#!/usr/bin/env node
/**
 * بوابة أرقام الآيات (حاجبة):
 * 1) كل آية لها مجسم نهاية (char_type end) بـ code_v2 غير فارغ → المجموع 6236
 * 2) المصدر يعرض glyphText لمجاميع النهاية — بلا AyahMarker يستبدل المجسم
 * 3) صفحة 306 (مرجع مريم) تحتفظ بمجسمات نهاية غير فارغة
 */
import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");
const PAGES_DIR = path.join(ROOT, "public/data/quran-v2/pages");
const EXPECTED = 6236;
const REF_PAGE = 306;

function isAyahNumeralWord(w) {
  if (w.char_type_name === "end") return true;
  /* استثناء بيانات معروف: 2:181 مصنَّف word رغم أنه رقم آية هندية */
  return /^[٠-٩]{1,3}$/u.test(String(w.text_uthmani ?? "").trim());
}

async function countEndGlyphs() {
  const files = (await readdir(PAGES_DIR)).filter((f) => f.endsWith(".json")).sort();
  let ends = 0;
  let emptyEnds = 0;
  const emptySamples = [];
  let page306Ends = 0;
  let page306Empty = 0;
  const ayahsWithNumeral = new Set();

  for (const file of files) {
    const pageNum = Number(file.match(/page-(\d+)\.json/)?.[1]);
    const verses = JSON.parse(await readFile(path.join(PAGES_DIR, file), "utf-8"));
    for (const v of verses) {
      let verseHas = false;
      for (const w of v.words ?? []) {
        if (!isAyahNumeralWord(w)) continue;
        ends += 1;
        verseHas = true;
        const glyph = String(w.code_v2 ?? w.text ?? "").trim();
        if (!glyph) {
          emptyEnds += 1;
          if (emptySamples.length < 12) {
            emptySamples.push(`${v.verse_key}@p${pageNum}`);
          }
        }
        if (pageNum === REF_PAGE) {
          page306Ends += 1;
          if (!glyph) page306Empty += 1;
        }
      }
      if (verseHas) ayahsWithNumeral.add(v.verse_key);
    }
  }
  return {
    files: files.length,
    ends,
    emptyEnds,
    emptySamples,
    page306Ends,
    page306Empty,
    ayahsWithNumeral: ayahsWithNumeral.size,
  };
}

async function assertSource() {
  const pageV2 = await readFile(path.join(ROOT, "src/components/quran/MushafPageV2.tsx"), "utf8");
  const view = await readFile(path.join(ROOT, "src/pages/quran/ui/MushafPageView.tsx"), "utf8");
  const issues = [];
  if (/\bAyahMarker\b/.test(pageV2) || /\bAyahMarker\b/.test(view)) {
    issues.push("المصدر ما زال يستورد/يستخدم AyahMarker");
  }
  if (/from ["']@\/components\/quran\/AyahMarker["']/.test(pageV2 + view)) {
    issues.push("استيراد AyahMarker ما زال قائمًا");
  }
  try {
    await access(path.join(ROOT, "src/components/quran/AyahMarker.tsx"));
    issues.push("ملف AyahMarker.tsx ما زال موجودًا — يجب حذفه");
  } catch {
    /* مطلوب غيابه */
  }
  if (!/data-ayah-numeral="qpc"/.test(pageV2)) {
    issues.push("MushafPageV2 بلا data-ayah-numeral=qpc على مجسم النهاية");
  }
  if (!/mf2-word--ayah-end[\s\S]{0,120}\{w\.glyphText\}/.test(pageV2)
    && !/className="mf2-word mf2-word--ayah-end"[\s\S]{0,200}\{w\.glyphText\}/.test(pageV2)) {
    issues.push("مجسم النهاية لا يعرض w.glyphText مباشرة");
  }
  const css = await readFile(path.join(ROOT, "src/styles/mushaf-v2.css"), "utf8");
  if (!/\.mf2-word--ayah-end\s*\{[\s\S]*?mushaf-gold-strong/.test(css)) {
    issues.push("لون مجسم النهاية ليس mushaf-gold-strong");
  }
  const banner = await readFile(path.join(ROOT, "src/components/quran/SurahBanner.tsx"), "utf8");
  if (/WingArabesque|Octofoil/.test(banner)) {
    issues.push("SurahBanner ما زال يحوي نقشًا ركيكًا (WingArabesque/Octofoil)");
  }
  if (!/data-ornament="solid"/.test(banner)) {
    issues.push("SurahBanner بلا data-ornament=solid");
  }
  if (!/MAX_TOP_PAD_RATIO\s*=\s*0\.02/.test(pageV2)) {
    issues.push("سقف الفجوة العلوية 2% مفقود من خوارزمية التخطيط");
  }
  return issues;
}

async function main() {
  const counts = await countEndGlyphs();
  const sourceIssues = await assertSource();
  const fail = [];

  if (counts.files !== 604) fail.push(`ملفات الصفحات ${counts.files} ≠ 604`);
  if (counts.ends !== EXPECTED) {
    fail.push(`علامات نهاية الآية (مجسم/رقم) ${counts.ends} ≠ ${EXPECTED}`);
  }
  if (counts.ayahsWithNumeral !== EXPECTED) {
    fail.push(`آيات لها رقم ظاهر ${counts.ayahsWithNumeral} ≠ ${EXPECTED}`);
  }
  if (counts.emptyEnds > 0) {
    fail.push(`${counts.emptyEnds} علامة نهاية بلا مجسم (عيّنة: ${counts.emptySamples.join(", ")})`);
  }
  if (counts.page306Ends < 1) fail.push(`صفحة ${REF_PAGE}: بلا علامات نهاية`);
  if (counts.page306Empty > 0) {
    fail.push(`صفحة ${REF_PAGE} المرجعية: ${counts.page306Empty} علامة بلا مجسم — انحدار عن خط الأساس`);
  }
  fail.push(...sourceIssues);

  console.log(
    `[mushaf-ayah-numerals-gate] numerals=${counts.ends}/${EXPECTED} ayahs=${counts.ayahsWithNumeral} empty=${counts.emptyEnds}`,
  );
  console.log(`[mushaf-ayah-numerals-gate] page${REF_PAGE} ends=${counts.page306Ends} empty=${counts.page306Empty}`);

  if (fail.length) {
    console.error("[mushaf-ayah-numerals-gate] FAIL");
    for (const f of fail) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log("[mushaf-ayah-numerals-gate] OK — 6236/6236 رقم آية ظاهر (مجسم QPC)");
}

main().catch((err) => {
  console.error("[mushaf-ayah-numerals-gate] ERROR:", err?.message || err);
  process.exit(1);
});
