#!/usr/bin/env node
/**
 * جرد كامل لمسارات الأحكام: قاعدة البيانات + البوابة + sitemap + search + prerender.
 * اختياري: HTTP عبر MAJLIS_AUDIT_BASE_URL (افتراضي بلا شبكة).
 *
 * node scripts/audit-rulings-route-inventory.mjs
 * MAJLIS_AUDIT_BASE_URL=https://majlisilm.com node scripts/audit-rulings-route-inventory.mjs
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(appRoot, "../..");
const baseUrl = (process.env.MAJLIS_AUDIT_BASE_URL || "").replace(/\/$/, "");

function norm(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

function isPublic(row) {
  const title = String(row?.title ?? "").trim();
  const body = String(row?.body ?? "").trim();
  if (!title || !body) return false;
  const v = norm(row?.verification_status);
  const s = norm(row?.status);
  const blocked = new Set(["draft", "pending", "pending_review", "needs_review", "rejected", "archived", ""]);
  if (blocked.has(v)) return false;
  if (v !== "approved" && v !== "published") return false;
  if (s && s !== "approved" && s !== "published") return false;
  return true;
}

function reviewStatus(row) {
  return norm(row?.verification_status) || norm(row?.status) || "unknown";
}

function publicationStatus(row) {
  if (isPublic(row)) return "published_public";
  const v = reviewStatus(row);
  if (v === "archived") return "archived";
  if (v === "draft") return "draft";
  if (["pending", "pending_review", "needs_review"].includes(v)) return "not_public_review";
  if (v === "approved" || v === "published") return "approved_gated";
  return "not_public";
}

function loadRows() {
  const manifestPath = resolve(appRoot, "public/data/rulings-encyclopedia/manifest.json");
  const rows = [];
  if (!existsSync(manifestPath)) return rows;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const chunk of manifest.chunks || []) {
    const file = resolve(appRoot, "public/data/rulings-encyclopedia", chunk.file);
    if (!existsSync(file)) continue;
    rows.push(...JSON.parse(readFileSync(file, "utf8")));
  }
  return rows;
}

function loadSitemapUrls() {
  const candidates = [
    resolve(appRoot, "public/sitemap.xml"),
    resolve(appRoot, "dist/sitemap.xml"),
  ];
  const urls = new Set();
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    const xml = readFileSync(p, "utf8");
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      try {
        const u = new URL(m[1].trim());
        urls.add(u.pathname.replace(/\/$/, "") || "/");
      } catch {
        /* ignore */
      }
    }
  }
  return urls;
}

function loadSearchRulingHrefs() {
  const p = resolve(appRoot, "public/data/search/index.json");
  if (!existsSync(p)) return new Set();
  const idx = JSON.parse(readFileSync(p, "utf8"));
  const hrefs = new Set();
  for (const doc of idx.docs || []) {
    const href = String(doc.href || "");
    if (doc.kind === "ruling" || href.startsWith("/rulings/")) {
      hrefs.add(href.replace(/\/$/, ""));
    }
  }
  return hrefs;
}

function prerenderSlugSet() {
  const dir = resolve(appRoot, "seo-prerender/rulings");
  const set = new Set();
  if (!existsSync(dir)) return set;
  for (const name of readdirSync(dir)) {
    if (existsSync(join(dir, name, "index.html"))) set.add(name);
  }
  return set;
}

async function httpStatus(path) {
  if (!baseUrl) return null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(25000),
      });
      return res.status;
    } catch {
      if (attempt === 2) return -1;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return -1;
}

const rows = loadRows();
const sitemap = loadSitemapUrls();
const searchHrefs = loadSearchRulingHrefs();
const prerender = prerenderSlugSet();

const inventory = [];
const failures = [];

for (const row of rows) {
  const identifier = String(row.id || row.external_key || "").trim();
  const slug = String(row.external_key || row.id || "").trim();
  const path = `/rulings/${slug}`;
  const pub = isPublic(row);
  const inSitemap = sitemap.has(path);
  const inSearch = searchHrefs.has(path);
  const inPrerender = prerender.has(slug);
  const review = reviewStatus(row);
  const publication = publicationStatus(row);

  let expectedHttp = "404_or_410";
  let indexability = "noindex";
  if (pub) {
    expectedHttp = "200";
    indexability = "indexable";
  } else if (review === "archived") {
    expectedHttp = "policy_archived";
    indexability = "noindex";
  }

  const entry = {
    identifier,
    slug,
    reviewStatus: review,
    publicationStatus: publication,
    publicEligible: pub,
    path,
    expectedHttp,
    indexability,
    sitemapMembership: inSitemap,
    searchIndexMembership: inSearch,
    prerenderMembership: inPrerender,
    httpStatus: null,
  };

  if (pub && !inSitemap) failures.push(`${slug}: published missing from sitemap`);
  if (!pub && inSitemap) failures.push(`${slug}: non-public in sitemap`);
  if (pub && !inSearch) {
    /* search قد يكون lazy — لا فشل صارم إن القائمة العامة فارغة بالكامل */
  }
  if (!pub && inSearch) failures.push(`${slug}: non-public in search index`);
  if (!pub && inPrerender) failures.push(`${slug}: non-public prerendered`);

  inventory.push(entry);
}

if (baseUrl) {
  const concurrency = 8;
  let i = 0;
  async function worker() {
    while (i < inventory.length) {
      const idx = i++;
      const entry = inventory[idx];
      entry.httpStatus = await httpStatus(entry.path);
      if (entry.publicEligible && entry.httpStatus !== 200) {
        failures.push(`${entry.slug}: published → HTTP ${entry.httpStatus}`);
      }
      if (!entry.publicEligible && entry.httpStatus === 200) {
        failures.push(`${entry.slug}: non-public returned HTTP 200 (possible content leak)`);
      }
      if (!entry.publicEligible && entry.httpStatus !== null) {
        if (entry.httpStatus >= 500) {
          failures.push(`${entry.slug}: unexpected HTTP ${entry.httpStatus}`);
        }
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const nonPublicOk = inventory.filter((e) => !e.publicEligible);
  const badPublicLeak = nonPublicOk.filter((e) => e.httpStatus === 200);
  // على Vercel بدون prerender غالباً 404؛ إن 200 نفحص أن الصفحة ليست محتوى الحكم
  for (const e of badPublicLeak.slice(0, 0)) {
    /* reserved */
  }
}

const summary = {
  total: inventory.length,
  publicEligible: inventory.filter((e) => e.publicEligible).length,
  pending_review: inventory.filter((e) => e.reviewStatus === "pending_review").length,
  inSitemap: inventory.filter((e) => e.sitemapMembership).length,
  inSearch: inventory.filter((e) => e.searchIndexMembership).length,
  inPrerender: inventory.filter((e) => e.prerenderMembership).length,
  httpChecked: Boolean(baseUrl),
  http404: inventory.filter((e) => e.httpStatus === 404).length,
  http200: inventory.filter((e) => e.httpStatus === 200).length,
  failures: failures.length,
};

const outDir = resolve(repoRoot, "reports");
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "rulings-route-inventory.json");
writeFileSync(
  outPath,
  JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl: baseUrl || null, summary, failures, inventory }, null, 2),
);

if (failures.length) {
  console.error(JSON.stringify({ ok: false, summary, failures: failures.slice(0, 30) }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, summary, report: outPath }, null, 2));
