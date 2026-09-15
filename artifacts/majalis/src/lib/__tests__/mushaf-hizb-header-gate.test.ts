/**
 * بوابة: رأس مصحف أصيل — جزء وطرف / حزب وطرف، بلا اسم سورة في الرأس.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-hizb-header-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const page = read("src/features/mushaf-reader/MushafPage.tsx");
const banner = read("src/features/mushaf-reader/MushafSurahBanner.tsx");
const data = read("src/lib/quran-data/qpc-page-data.ts");
const css = read("src/features/mushaf-reader/mushaf-reader.css");
const font = read("src/features/mushaf-madinah/useQpcPageFont.ts");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const tele = read("src/features/mushaf-reader/mushaf-turn-telemetry.ts");

assert.match(data, /hizbNumber:\s*number/);
assert.match(data, /hizbStartingOnPage/);
assert.match(data, /rubElHizbStartingOnPage/);

/* لا اسم سورة في رأس الصفحة — جزء وحزب على طرفين فقط */
assert.match(page, /MushafPageMetadataHeader/);
assert.match(page, /nm-page__header-juz/);
assert.match(page, /nm-page__header-hizb/);
assert.match(page, /الجزء \$\{toArabicDigits\(layout\.juzNumber\)\}/);
assert.match(page, /الحزب \$\{toArabicDigits\(layout\.hizbNumber\)\}/);
assert.doesNotMatch(page, /nm-page__header-surah/);
assert.doesNotMatch(page, /nm-page__header-stack/);
assert.doesNotMatch(page, /nm-page__header-meta/);
assert.doesNotMatch(page, /headerSurahName/);
assert.doesNotMatch(page, /الجزء \$\{toArabicDigits\(layout\.juzNumber\)\} • الحزب/);
assert.doesNotMatch(page, /•\s*الحزب/);

/* اسم السورة داخل الإطار فقط */
assert.match(banner, /سورة \$\{label\}/);
assert.match(banner, /MushafSurahFramePremium|nm-surah-banner__label/);

assert.match(page, /layout\.hizbStartingOnPage/);
assert.match(page, /layout\.rubElHizbStartingOnPage/);
assert.doesNotMatch(page, /nm-page__section-mark/);
assert.match(page, /rubQuarterLabel/);
assert.doesNotMatch(page, /Math\.ceil\(\s*layout\.pageNumber/);

assert.match(css, /\.nm-page__header\s*\{[^}]*grid-template-columns:\s*1fr 1fr/s);
assert.match(css, /\.nm-page__header-juz/);
assert.match(css, /\.nm-page__header-hizb/);
assert.match(css, /justify-self:\s*start/);
assert.match(css, /justify-self:\s*end/);
assert.match(css, /--mushaf-header-height:\s*36px/);
assert.doesNotMatch(css, /\.nm-page__header-surah\b/);
assert.doesNotMatch(css, /\.nm-page__header-stack\b/);
assert.doesNotMatch(css, /\.nm-page__section-mark\b/);
assert.match(css, /pointer-events:\s*none/);

assert.match(font, /prefetchAdjacent/);
assert.match(font, /inflight/);
assert.match(reader, /prefetchAdjacent:\s*false/);
assert.match(reader, /mushafPerfInc\("readerMount"\)/);
assert.match(tele, /readerMountCount/);
assert.match(tele, /fontLoadCount/);

/** Metadata معتمدة من ملفات الصفحة — بلا تخمين من رقم الصفحة */
type RawVerse = {
  verse_key: string;
  juz_number: number;
  hizb_number: number;
};

const chapters = JSON.parse(
  readFileSync(resolve(root, "public/data/quran-v2/chapters.json"), "utf8"),
) as Array<{ id: number; name_arabic: string }>;
const chapterName = Object.fromEntries(chapters.map((c) => [c.id, c.name_arabic]));

function pageMeta(n: number) {
  const file = resolve(root, `public/data/quran-v2/pages/page-${String(n).padStart(3, "0")}.json`);
  assert.ok(existsSync(file), `ناقصة: صفحة ${n}`);
  const verses = JSON.parse(readFileSync(file, "utf8")) as RawVerse[];
  const first = verses[0]!;
  const starts = [
    ...new Set(
      verses
        .filter((v) => v.verse_key.endsWith(":1"))
        .map((v) => chapterName[Number(v.verse_key.split(":")[0]!)]!),
    ),
  ];
  return { juz: first.juz_number, hizb: first.hizb_number, starts };
}

const samples: Array<{ page: number; juz: number; hizb: number; surahStarts: string[] }> = [
  { page: 2, juz: 1, hizb: 1, surahStarts: ["البقرة"] },
  { page: 3, juz: 1, hizb: 1, surahStarts: [] },
  { page: 598, juz: 30, hizb: 60, surahStarts: ["القدر", "البينة"] },
  { page: 600, juz: 30, hizb: 60, surahStarts: ["القارعة", "التكاثر"] },
];

for (const s of samples) {
  const m = pageMeta(s.page);
  assert.equal(m.juz, s.juz, `page ${s.page} juz`);
  assert.equal(m.hizb, s.hizb, `page ${s.page} hizb`);
  assert.deepEqual(m.starts, s.surahStarts, `page ${s.page} surah starts`);
}

console.log("mushaf-hizb-header-gate.test.ts: ok");
