#!/usr/bin/env node
/**
 * تدقيق مصادر كتب المكتبة المنشورة — بلا اختلاق روابط.
 * التشغيل: node scripts/audit-library-sources.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalogMod = await import(pathToFileURL(resolve(appRoot, "src/lib/library-catalog.ts")).href);
const books = catalogMod.LIBRARY_CATALOG || [];

function classify(book) {
  const url = String(book.external_url || "").trim();
  if (!url) return "source_missing";
  try {
    const u = new URL(url);
    if (!/^https?:$/i.test(u.protocol)) return "source_broken";
    if (!u.hostname) return "source_broken";
    return "source_verified";
  } catch {
    return "source_broken";
  }
}

const counts = {
  total: books.length,
  source_verified: 0,
  source_missing: 0,
  source_broken: 0,
  needs_review: 0,
};
const missing = [];
const broken = [];

for (const book of books) {
  const kind = classify(book);
  counts[kind] += 1;
  if (book.contentStatus === "needs_review") counts.needs_review += 1;
  if (kind === "source_missing") missing.push({ id: book.id, title: book.title });
  if (kind === "source_broken") broken.push({ id: book.id, title: book.title, url: book.external_url });
}

const report = {
  generatedAt: new Date().toISOString(),
  counts,
  sample_missing: missing.slice(0, 40),
  sample_broken: broken.slice(0, 40),
  policy:
    "لا اختلاق مصادر. حقل رابط القراءة يُخفى في SEO عند الغياب؛ لا يُعرض «المصدر قيد الإضافة» للعامة.",
};

const outDir = resolve(appRoot, "../../reports");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "library-source-completeness-audit.json");
writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");

console.log(JSON.stringify(counts, null, 2));
console.log(`wrote ${outPath}`);

// بوابة: لا placeholder في مولّد SEO
const seo = readFileSync(resolve(appRoot, "scripts/generate-seo.mjs"), "utf8");
if (seo.includes("المصدر قيد الإضافة")) {
  console.error("✗ generate-seo.mjs ما زال يحتوي «المصدر قيد الإضافة»");
  process.exit(1);
}
if (broken.length) {
  console.error(`✗ ${broken.length} رابط مصدر بصيغة غير صالحة`);
  process.exit(1);
}
console.log("✓ audit-library-sources");
