#!/usr/bin/env node
/**
 * توليد public/data/quran/stats.json من نص المصحف + التحقق من البصمة.
 * التشغيل: node scripts/generate-quran-stats.mjs
 * التحقق فقط: node scripts/generate-quran-stats.mjs --check
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "public/data/quran");
const outFile = path.join(dataDir, "stats.json");
const checkOnly = process.argv.includes("--check");

const ARABIC_LETTER = /[\u0621-\u064A\u0671]/g;
const TASHKEEL = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const BOM = /^\uFEFF/;

function stripMarks(text) {
  return text.replace(BOM, "").replace(TASHKEEL, "");
}
function lettersOnly(text) {
  return (stripMarks(text).match(ARABIC_LETTER) || []).join("");
}
function wordsOf(text) {
  const cleaned = stripMarks(text)
    .replace(/[^\u0621-\u064A\u0671\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned ? cleaned.split(" ") : [];
}

function compute() {
  const surahs = [];
  for (let i = 1; i <= 114; i++) {
    const file = path.join(dataDir, `surah-${String(i).padStart(3, "0")}.json`);
    surahs.push(JSON.parse(fs.readFileSync(file, "utf8")));
  }

  let totalAyahs = 0;
  let totalWords = 0;
  let totalLetters = 0;
  let basmalaCount = 0;
  const perSurah = [];
  let longestAyah = { surah: 1, ayah: 1, len: 0, text: "" };
  let shortestAyah = { surah: 1, ayah: 1, len: Infinity, text: "" };
  let longestSurah = { number: 1, ayahs: 0, name: "" };
  let shortestSurah = { number: 1, ayahs: Infinity, name: "" };
  let meccan = 0;
  let medinan = 0;
  const sajda = [];

  for (const s of surahs) {
    const ayahs = s.ayahs;
    totalAyahs += ayahs.length;
    if (s.revelationType === "Meccan") meccan++;
    else medinan++;
    if (ayahs.length > longestSurah.ayahs) {
      longestSurah = { number: s.number, ayahs: ayahs.length, name: s.name };
    }
    if (ayahs.length < shortestSurah.ayahs) {
      shortestSurah = { number: s.number, ayahs: ayahs.length, name: s.name };
    }

    let surahWords = 0;
    let surahLetters = 0;
    for (const a of ayahs) {
      let text = a.text.replace(BOM, "");
      if (s.number !== 1 && a.numberInSurah === 1) {
        const basmalaRe = /^بِسْمِ[\s\S]{0,40}?ٱلرَّحِيمِ\s*/;
        if (basmalaRe.test(text) || /^بسم[\s\S]{0,30}?الرحيم/.test(stripMarks(text))) {
          basmalaCount++;
          text = text.replace(basmalaRe, "");
        }
      } else if (s.number === 1 && a.numberInSurah === 1) {
        basmalaCount++;
      }
      const w = wordsOf(text);
      const L = lettersOnly(text);
      surahWords += w.length;
      surahLetters += L.length;
      totalWords += w.length;
      totalLetters += L.length;
      if (L.length > longestAyah.len) {
        longestAyah = { surah: s.number, ayah: a.numberInSurah, len: L.length, text: text.slice(0, 120) };
      }
      if (L.length > 0 && L.length < shortestAyah.len) {
        shortestAyah = { surah: s.number, ayah: a.numberInSurah, len: L.length, text };
      }
      if (a.sajda) sajda.push({ surah: s.number, ayah: a.numberInSurah });
    }
    perSurah.push({
      number: s.number,
      name: s.name,
      revelationType: s.revelationType,
      ayahs: ayahs.length,
      words: surahWords,
      letters: surahLetters,
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    mushaf: "1",
    sourcePath: "public/data/quran/surah-*.json",
    methodology: {
      arabic:
        "حساب آلي من نص المصحف العثماني في المشروع: الآيات كما في الملفات؛ تُجرَّد التشكيل وعلامات الوقف قبل عدّ الحروف الهجائية؛ الكلمة = مقاطع مفصولة بمسافة بعد التجريد؛ بسملة غير الفاتحة إن دُمجت في أول آية لا تُضاعف كآية؛ الحروف المقطّعة تُحسب حروفًا.",
      basmalaExcludedFromExtraAyah: true,
      basmalaInFatihaCountedAsAyah: true,
      tashkeelStripped: true,
      stopMarksIgnored: true,
      disjointLettersCountedAsLetters: true,
    },
    totals: {
      surahs: 114,
      ayahs: totalAyahs,
      words: totalWords,
      letters: totalLetters,
      basmalaOccurrencesDetected: basmalaCount,
      meccanSurahs: meccan,
      medinanSurahs: medinan,
      sajdaMarksInData: sajda.length,
    },
    extremes: { longestAyah, shortestAyah, longestSurah, shortestSurah },
    sajda,
    perSurah,
  };

  const { fingerprint: _ignore, generatedAt: _ga, ...stableBase } = { ...payload, fingerprint: undefined };
  payload.fingerprint = crypto.createHash("sha256").update(JSON.stringify(stableBase)).digest("hex");
  return payload;
}

const computed = compute();
if (checkOnly) {
  if (!fs.existsSync(outFile)) {
    console.error("verify-quran-stats: FAILED — stats.json مفقود");
    process.exit(1);
  }
  const existing = JSON.parse(fs.readFileSync(outFile, "utf8"));
  if (existing.fingerprint !== computed.fingerprint) {
    console.error(
      `verify-quran-stats: FAILED — بصمة تغيّرت\n  ملف: ${existing.fingerprint}\n  حساب: ${computed.fingerprint}`,
    );
    process.exit(1);
  }
  if (existing.totals.ayahs !== 6236) {
    console.error("verify-quran-stats: FAILED — عدد الآيات المحسوب يجب أن يطابق العدّ الكوفي ٦٢٣٦ في هذه البيانات");
    process.exit(1);
  }
  console.log(`verify-quran-stats: OK fingerprint=${existing.fingerprint.slice(0, 12)}…`);
  process.exit(0);
}

fs.writeFileSync(outFile, `${JSON.stringify(computed, null, 2)}\n`);
console.log(
  `generate-quran-stats: OK ayahs=${computed.totals.ayahs} words=${computed.totals.words} letters=${computed.totals.letters} fp=${computed.fingerprint.slice(0, 12)}…`,
);
