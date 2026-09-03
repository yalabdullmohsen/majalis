#!/usr/bin/env node
/**
 * فحص جودة البحث — كلمات إسلامية أساسية يجب ألا ترجع صفرًا.
 * التشغيل: node scripts/check-search-quality.js
 */
import { searchStaticIndex } from "../artifacts/majalis/lib/static-search-server.mjs";

const REQUIRED_QUERIES = [
  "الصلاة",
  "الحديث",
  "الوضوء",
  "الزكاة",
  "الصيام",
  "القرآن",
  "البخاري",
  "الأذكار",
  "أذكار الصباح",
];

let failed = false;

for (const query of REQUIRED_QUERIES) {
  const { total, results } = searchStaticIndex(query, 12);
  if (total <= 0) {
    console.error(`✗ "${query}" — count = 0`);
    failed = true;
    continue;
  }
  const sample = results[0]?.title ?? results[0]?.id ?? "—";
  console.log(`✓ "${query}" — ${total} نتيجة (أول: ${sample})`);
}

if (failed) {
  console.error("\nفشل فحص جودة البحث: بعض الكلمات الأساسية لا ترجع نتائج.");
  process.exit(1);
}

console.log("\nفحص جودة البحث: نجح");
