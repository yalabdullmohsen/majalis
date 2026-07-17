#!/usr/bin/env node
/**
 * تحقق سلامة بيان صفحات المصحف (public/data/quran/pages-manifest.json) —
 * المرحلة 8. يضمن أن ترقيم الصفحات (604 صفحة) يغطي كل آية من الآيات
 * الـ6236 مرة واحدة بالضبط بلا فجوة ولا تكرار ولا تجاوز لحدود السورة —
 * هذا هو الأساس الذي تُبنى عليه واجهة المصحف الجديدة (تصفّح بالصفحة)،
 * فأي خطأ هنا يعني عرض آية خاطئة أو مفقودة في الواجهة.
 *
 * تشغيل: npx tsx scripts/verify-quran-pages-manifest.mjs
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data", "quran");

const EXPECTED_TOTAL_PAGES = 604;
const EXPECTED_TOTAL_AYAHS = 6236;

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

let passed = 0;
let failed = 0;
function check(label, ok, detail = "") {
  if (ok) { passed++; console.log(`  ${GREEN}✓${RESET} ${label}`); }
  else { failed++; console.log(`  ${RED}✗ ${label}${detail ? ` — ${detail}` : ""}${RESET}`); }
}

async function main() {
  console.log(`${BOLD}تحقق سلامة بيان صفحات المصحف${RESET}\n`);

  let pagesManifest, surahsManifest;
  try {
    pagesManifest = JSON.parse(await readFile(path.join(DATA_DIR, "pages-manifest.json"), "utf8"));
  } catch {
    console.log(`${RED}✗ pages-manifest.json غير موجود — شغّل node scripts/generate-quran-pages-manifest.mjs${RESET}`);
    process.exit(1);
  }
  surahsManifest = JSON.parse(await readFile(path.join(DATA_DIR, "manifest.json"), "utf8"));
  const ayahCountBySurah = new Map(surahsManifest.surahs.map((s) => [s.number, s.numberOfAyahs]));

  check(`عدد الصفحات = ${EXPECTED_TOTAL_PAGES}`, pagesManifest.totalPages === EXPECTED_TOTAL_PAGES && pagesManifest.pages.length === EXPECTED_TOTAL_PAGES, `الفعلي: ${pagesManifest.pages?.length}`);

  // تغطية كل آية مرة واحدة بالضبط: نبني خريطة سورة← مجموعة أرقام آيات مغطاة، ونتأكد لا فجوة ولا تكرار.
  const covered = new Map(); // surah -> Set(ayahNumbers)
  let totalRangeAyahs = 0;
  let overlapErrors = 0;
  let orderErrors = 0;
  let prevPage = 0;

  for (const pageEntry of pagesManifest.pages ?? []) {
    if (pageEntry.page !== prevPage + 1) { orderErrors++; }
    prevPage = pageEntry.page;

    for (const r of pageEntry.ranges) {
      if (r.from > r.to) { overlapErrors++; continue; }
      const set = covered.get(r.surah) ?? new Set();
      for (let n = r.from; n <= r.to; n++) {
        if (set.has(n)) overlapErrors++;
        set.add(n);
        totalRangeAyahs++;
      }
      covered.set(r.surah, set);
    }
  }

  check("الصفحات مرتّبة تصاعديًا 1..604 بلا فجوة", orderErrors === 0, `${orderErrors} خطأ ترتيب`);
  check("لا تكرار لأي آية عبر الصفحات", overlapErrors === 0, `${overlapErrors} تكرار/نطاق فاسد`);
  check(`إجمالي آيات النطاقات = ${EXPECTED_TOTAL_AYAHS}`, totalRangeAyahs === EXPECTED_TOTAL_AYAHS, `الفعلي: ${totalRangeAyahs}`);

  let missingErrors = 0;
  for (const [surahNum, expectedCount] of ayahCountBySurah) {
    const set = covered.get(surahNum);
    if (!set || set.size !== expectedCount) {
      check(`سورة ${surahNum}: كل الآيات (${expectedCount}) مغطاة بصفحة`, false, `مُغطّى فعليًا: ${set?.size ?? 0}`);
      missingErrors++;
      continue;
    }
    for (let n = 1; n <= expectedCount; n++) {
      if (!set.has(n)) { missingErrors++; }
    }
  }
  check("كل سورة: كل أرقام آياتها من 1 حتى عددها مغطاة بلا فجوة", missingErrors === 0, `${missingErrors} فجوة`);

  console.log(`\n${BOLD}النتيجة: ${GREEN}${passed} نجح${RESET}${BOLD}، ${failed > 0 ? RED : GREEN}${failed} فشل${RESET}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`${RED}خطأ غير متوقع:${RESET}`, err);
  process.exit(1);
});
