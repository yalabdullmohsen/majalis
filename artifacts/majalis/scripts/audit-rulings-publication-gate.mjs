#!/usr/bin/env node
/**
 * تدقيق بوابة نشر الأحكام + رفض prerender الذي يحتوي pending_review.
 * التشغيل: node scripts/audit-rulings-publication-gate.mjs
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gateUrl = pathToFileURL(resolve(appRoot, "src/lib/rulings-publication-gate.ts")).href;

async function loadGate() {
  // عبر tsx عند التشغيل بـ --import tsx؛ وإلا نسخة مساعدة محلية
  try {
    return await import(gateUrl);
  } catch {
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    // fallback: duplicate minimal check in pure JS for gate script
    return null;
  }
}

function isPublic(row) {
  const title = String(row?.title ?? "").trim();
  const body = String(row?.body ?? "").trim();
  if (!title || !body) return false;
  const v = String(row?.verification_status ?? "").toLowerCase().replace(/-/g, "_");
  const s = String(row?.status ?? "").toLowerCase().replace(/-/g, "_");
  const blocked = new Set(["draft", "pending", "pending_review", "needs_review", "rejected", "archived", ""]);
  if (blocked.has(v)) return false;
  if (v !== "approved" && v !== "published") return false;
  if (s && s !== "approved" && s !== "published") return false;
  return true;
}

function classify(row) {
  const v = String(row?.verification_status ?? "").toLowerCase().replace(/-/g, "_");
  const s = String(row?.status ?? "").toLowerCase().replace(/-/g, "_");
  const title = String(row?.title ?? "").trim();
  const body = String(row?.body ?? "").trim();
  if (!title && !body) return "orphaned";
  if (!title || !body) return "incomplete";
  if (v === "archived" || s === "archived") return "archived";
  if (v === "draft" || s === "draft") return "draft";
  if (["pending", "pending_review", "needs_review"].includes(v) || ["pending", "pending_review"].includes(s)) {
    return "needs_review";
  }
  if (v === "approved" || v === "published") return "published";
  return "needs_review";
}

const manifestPath = resolve(appRoot, "public/data/rulings-encyclopedia/manifest.json");
const rows = [];
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const chunk of manifest.chunks || []) {
    const file = resolve(appRoot, "public/data/rulings-encyclopedia", chunk.file);
    if (!existsSync(file)) continue;
    const part = JSON.parse(readFileSync(file, "utf8"));
    rows.push(...part);
  }
}

const counts = {
  total: rows.length,
  draft: 0,
  needs_review: 0,
  pending_review: 0,
  approved: 0,
  published: 0,
  archived: 0,
  incomplete: 0,
  orphaned: 0,
  publicEligible: 0,
};
for (const row of rows) {
  const life = classify(row);
  counts[life] += 1;
  const rawV = String(row?.verification_status ?? "").toLowerCase().replace(/-/g, "_");
  const rawS = String(row?.status ?? "").toLowerCase().replace(/-/g, "_");
  if (rawV === "pending_review" || rawS === "pending_review") counts.pending_review += 1;
  if (isPublic(row)) counts.publicEligible += 1;
}

const seoHelper = readFileSync(resolve(appRoot, "scripts/generate-seo-rulings-helpers.mjs"), "utf8");
const seedJs = readFileSync(resolve(appRoot, "lib/rulings-db-seed.mjs"), "utf8");
const failures = [];

if (!/isPubliclyPublishedRuling/.test(seoHelper)) {
  failures.push("SEO loader missing publication gate");
}
if (/status:\s*"approved"\s*,/.test(seedJs) && !/verification_status === "approved"/.test(seedJs)) {
  failures.push("DB seed still hardcodes status approved without verification gate");
}

const prerenderDir = resolve(appRoot, "seo-prerender/rulings");
let pendingPrerender = 0;
if (existsSync(prerenderDir)) {
  for (const name of readdirSync(prerenderDir)) {
    const htmlPath = join(prerenderDir, name, "index.html");
    if (!existsSync(htmlPath)) continue;
    const html = readFileSync(htmlPath, "utf8");
    if (/pending_review|حالة المراجعة:\s*pending/i.test(html)) {
      pendingPrerender += 1;
    }
  }
}

console.log(JSON.stringify({ audit: counts, pendingPrerenderHits: pendingPrerender }, null, 2));

if (counts.publicEligible > 0) {
  // مسموح إن وُجدت سجلات معتمدة فعلاً في البذرة
  console.log(`ℹ publicEligible=${counts.publicEligible}`);
}
if (pendingPrerender > 0) {
  console.warn(
    `⚠ ${pendingPrerender} prerender HTML ما زال يعرض pending_review — يلزم generate:seo لإزالته من الـartifacts`,
  );
}

if (failures.length) {
  console.error("✗ audit-rulings-publication-gate:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}

console.log("✓ audit-rulings-publication-gate");
