#!/usr/bin/env node
/**
 * يمنع رجوع ألوان صلبة شائعة تكسر الوضع الليلي.
 * تشغيل: node scripts/lint-design-tokens.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..", "src");
const SKIP_DIR = new Set([
  "features/mushaf",
  "styles/quran.css", // high-contrast mushaf modes intentionally solid
]);
const SKIP_FILE_RE = /(mushaf|qpc|high-contrast|print)\.(css|tsx|ts)$/i;
const SKIP_REL = [
  /^styles\/quran\.css$/,
  /UniversityDetailPage\.tsx$/,
  /MyCitationsPage\.tsx$/, // print:bg-white مقصود للطباعة
];

/** أنماط ممنوعة في ملفات واجهة جديدة/عامة */
const FORBIDDEN = [
  { re: /\btext-black\b/, msg: "text-black — استخدم text-[var(--mj-ink)] أو --text-primary" },
  { re: /\bbg-white\b(?!\s*\/)/, msg: "bg-white — استخدم bg-[var(--mj-surface)] أو --surface" },
  { re: /color:\s*#0{3,6}\b/i, msg: "color:#000 — استخدم var(--mj-ink)" },
  { re: /color:\s*#111\b/i, msg: "color:#111 — استخدم var(--mj-ink)" },
];

const ALLOW_PATH = [
  /design-tokens\.css$/,
  /typography-scale\.css$/,
  /dark-mode-surfaces\.css$/,
  /verify-color-contrast/,
  /lint-design-tokens/,
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|css)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk(root);
const failures = [];

for (const file of files) {
  const rel = relative(root, file).replace(/\\/g, "/");
  if (SKIP_FILE_RE.test(rel)) continue;
  if (SKIP_REL.some((r) => r.test(rel))) continue;
  if (ALLOW_PATH.some((r) => r.test(rel))) continue;
  if (rel.includes("features/mushaf")) continue;

  const src = readFileSync(file, "utf8");
  // تجاهل تعليقات وأسطر توثيق طويلة
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
    for (const { re, msg } of FORBIDDEN) {
      if (re.test(line)) {
        failures.push(`${rel}:${i + 1}: ${msg} → ${trimmed.slice(0, 100)}`);
      }
    }
  });
}

if (failures.length) {
  console.error(`✗ lint:design-tokens — ${failures.length} مخالفة:\n` + failures.slice(0, 40).join("\n"));
  if (failures.length > 40) console.error(`… و${failures.length - 40} أخرى`);
  process.exit(1);
}

console.log(`✓ lint:design-tokens — لا text-black / bg-white / #000|#111 في ${files.length} ملفًا مفحوصًا.`);
