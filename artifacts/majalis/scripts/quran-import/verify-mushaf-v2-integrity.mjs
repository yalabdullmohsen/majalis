#!/usr/bin/env node
/**
 * verify-mushaf-v2-integrity.mjs — بوابة القبول 1.
 * يتحقق: 114 سورة، 6236 آية، 604 صفحة، ≤15 سطرًا/صفحة، لا آية بلا صفحة،
 * لا سطر بلا صفحة، ويحسب checksum لنص كل سورة (لمراجعة يدوية لاحقة إن لزم).
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const PAGES_DIR = path.join(process.cwd(), "public/data/quran-v2/pages");
const OUT_REPORT = path.join(process.cwd(), "public/data/quran-v2/integrity-report.json");

async function main() {
  const files = (await readdir(PAGES_DIR)).filter((f) => f.endsWith(".json")).sort();
  const issues = [];
  const surahAyahs = new Map(); // surah -> Set(ayah_number)
  const surahTexts = new Map(); // surah -> concatenated uthmani text (ordered)
  let maxLineSeen = 0;
  let totalWords = 0;

  if (files.length !== 604) issues.push(`عدد ملفات الصفحات ${files.length} != 604`);

  for (const file of files) {
    const pageNum = Number(file.match(/page-(\d+)\.json/)[1]);
    const verses = JSON.parse(await readFile(path.join(PAGES_DIR, file), "utf-8"));
    if (!Array.isArray(verses) || verses.length === 0) {
      issues.push(`صفحة ${pageNum}: بلا آيات`);
      continue;
    }
    const linesOnPage = new Set();
    for (const v of verses) {
      const [surahStr, ayahStr] = v.verse_key.split(":");
      const surah = Number(surahStr);
      const ayah = Number(ayahStr);
      if (v.page_number !== pageNum) issues.push(`صفحة ${pageNum}: آية ${v.verse_key} تحمل page_number=${v.page_number}`);
      if (!surahAyahs.has(surah)) surahAyahs.set(surah, new Set());
      surahAyahs.get(surah).add(ayah);
      if (!surahTexts.has(surah)) surahTexts.set(surah, new Map());
      const words = v.words ?? [];
      const ayahText = words.filter((w) => w.char_type_name === "word").map((w) => w.text_uthmani).join(" ");
      surahTexts.get(surah).set(ayah, ayahText);
      for (const w of words) {
        totalWords++;
        if (typeof w.line_number === "number") {
          linesOnPage.add(w.line_number);
          if (w.line_number > maxLineSeen) maxLineSeen = w.line_number;
        } else {
          issues.push(`صفحة ${pageNum}: كلمة id=${w.id} بلا line_number`);
        }
      }
    }
    if (linesOnPage.size > 15) issues.push(`صفحة ${pageNum}: ${linesOnPage.size} سطرًا (أكثر من 15)`);
  }

  const totalSurahs = surahAyahs.size;
  let totalAyahs = 0;
  const checksums = {};
  for (const [surah, ayahSet] of [...surahAyahs.entries()].sort((a, b) => a[0] - b[0])) {
    totalAyahs += ayahSet.size;
    const textMap = surahTexts.get(surah);
    const orderedText = [...textMap.entries()].sort((a, b) => a[0] - b[0]).map(([, t]) => t).join("\n");
    checksums[surah] = {
      ayahCount: ayahSet.size,
      sha256: crypto.createHash("sha256").update(orderedText, "utf-8").digest("hex").slice(0, 16),
    };
  }

  if (totalSurahs !== 114) issues.push(`عدد السور ${totalSurahs} != 114`);
  if (totalAyahs !== 6236) issues.push(`عدد الآيات الإجمالي ${totalAyahs} != 6236`);
  if (maxLineSeen > 15) issues.push(`أُشوهد سطر رقم ${maxLineSeen} (> 15) في مكان ما`);

  const report = {
    generatedAt: new Date().toISOString(),
    totalPageFiles: files.length,
    totalSurahs,
    totalAyahs,
    maxLineNumberSeen: maxLineSeen,
    totalWords,
    issuesCount: issues.length,
    issues,
    checksums,
  };
  await writeFile(OUT_REPORT, JSON.stringify(report, null, 2));

  console.log(`ملفات الصفحات: ${files.length} (المتوقَّع 604)`);
  console.log(`السور: ${totalSurahs} (المتوقَّع 114)`);
  console.log(`الآيات: ${totalAyahs} (المتوقَّع 6236)`);
  console.log(`أقصى رقم سطر شُوهد: ${maxLineSeen} (المتوقَّع ≤15)`);
  console.log(`إجمالي الكلمات: ${totalWords}`);
  console.log(`المشاكل: ${issues.length}`);
  if (issues.length) {
    console.log("\n=== المشاكل (أول 30) ===");
    issues.slice(0, 30).forEach((i) => console.log(" -", i));
    process.exit(1);
  }
  console.log("\n✓ كل الفحوص نجحت — بوابة القبول 1 مكتملة.");
}

main().catch((err) => {
  console.error("فشل عام:", err);
  process.exit(1);
});
