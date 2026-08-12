#!/usr/bin/env node
/**
 * تحقق من سلامة بيانات القرآن المحلية (public/data/quran/) — بلا شبكة.
 *
 * يتحقق من:
 *  1. وجود manifest.json وتطابق عدد السور (114) وإجمالي الآيات (6236).
 *  2. كل سورة: تطابق SHA-256 المحسوب فعليًا مع القيمة المسجَّلة في manifest
 *     (يكشف أي تعديل يدوي أو تلف في الملف بعد الجلب).
 *  3. كل سورة: عدد الآيات في الملف يطابق عدد الآيات المرجعي في
 *     src/lib/quran-api.ts (SURAH_AYAH_COUNTS عبر getSurahList()).
 *
 * لا يُعدِّل أي نص قرآني إطلاقًا — قراءة وتحقق فقط.
 *
 * تشغيل: npx tsx scripts/verify-quran-integrity.mjs
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSurahList } from "../src/lib/quran-api.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data", "quran");

const EXPECTED_SURAH_COUNT = 114;
const EXPECTED_TOTAL_AYAHS = 6236;

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

let passed = 0;
let failed = 0;

function check(label, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ${GREEN}✓${RESET} ${label}`);
  } else {
    failed++;
    console.log(`  ${RED}✗ ${label}${detail ? ` — ${detail}` : ""}${RESET}`);
  }
}

async function main() {
  console.log(`${BOLD}تحقق سلامة بيانات القرآن المحلية${RESET}\n`);

  let manifestRaw;
  try {
    manifestRaw = await readFile(path.join(DATA_DIR, "manifest.json"), "utf8");
  } catch {
    console.log(`${YELLOW}لا يوجد public/data/quran/manifest.json بعد.${RESET}`);
    console.log(`${YELLOW}شغّل أولاً: node scripts/fetch-quran-data.mjs${RESET}`);
    console.log(`${YELLOW}(الواجهة تعمل حاليًا عبر الجلب الحي من AlQuran Cloud كاحتياط — لا كسر وظيفي)${RESET}`);
    process.exit(0);
  }

  const manifest = JSON.parse(manifestRaw);
  const referenceSurahs = getSurahList();

  check(`عدد السور في manifest = ${EXPECTED_SURAH_COUNT}`, manifest.totalSurahs === EXPECTED_SURAH_COUNT, `الفعلي: ${manifest.totalSurahs}`);
  check(`إجمالي الآيات في manifest = ${EXPECTED_TOTAL_AYAHS}`, manifest.totalAyahs === EXPECTED_TOTAL_AYAHS, `الفعلي: ${manifest.totalAyahs}`);
  check(`عدد السجلات في manifest.surahs = ${EXPECTED_SURAH_COUNT}`, Array.isArray(manifest.surahs) && manifest.surahs.length === EXPECTED_SURAH_COUNT);

  let recomputedTotal = 0;
  let fileErrors = 0;

  for (const entry of manifest.surahs ?? []) {
    const filePath = path.join(DATA_DIR, entry.file);
    let content;
    try {
      content = await readFile(filePath, "utf8");
    } catch {
      check(`سورة ${entry.number} (${entry.name}): الملف موجود`, false, entry.file);
      fileErrors++;
      continue;
    }

    const sha256 = createHash("sha256").update(content, "utf8").digest("hex");
    if (sha256 !== entry.sha256) {
      check(`سورة ${entry.number}: SHA-256 مطابق`, false, "الملف تغيّر بعد الجلب الأصلي");
      fileErrors++;
      continue;
    }

    const parsed = JSON.parse(content);
    const ayahCount = Array.isArray(parsed.ayahs) ? parsed.ayahs.length : 0;
    recomputedTotal += ayahCount;

    const reference = referenceSurahs.find((s) => s.number === entry.number);
    if (ayahCount !== reference?.ayahs) {
      check(`سورة ${entry.number} (${entry.name}): عدد الآيات = ${reference?.ayahs}`, false, `الفعلي: ${ayahCount}`);
      fileErrors++;
    }
  }

  check(`لا أخطاء في أي سورة (${manifest.surahs?.length ?? 0} سورة مفحوصة)`, fileErrors === 0, `${fileErrors} خطأ`);
  check(`مجموع الآيات المُعاد حسابه من الملفات = ${EXPECTED_TOTAL_AYAHS}`, recomputedTotal === EXPECTED_TOTAL_AYAHS, `الفعلي: ${recomputedTotal}`);

  console.log(`\n${BOLD}النتيجة: ${GREEN}${passed} نجح${RESET}${BOLD}، ${failed > 0 ? RED : GREEN}${failed} فشل${RESET}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`${RED}خطأ غير متوقع:${RESET}`, err);
  process.exit(1);
});
