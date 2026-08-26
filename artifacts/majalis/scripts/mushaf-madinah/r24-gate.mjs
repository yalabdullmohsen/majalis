#!/usr/bin/env node
/**
 * بوابة جولة ٢٤ — مطابقة آية: هندسة، حزب، خطوط، أدوات، شيت.
 * تشغيل: node scripts/mushaf-madinah/r24-gate.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(resolve(root, p), "utf8");

const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
const pager = read("src/features/mushaf-madinah/MushafPager.tsx");
const fit = read("src/features/mushaf-madinah/useMushafPageFontFit.ts");
const font = read("src/features/mushaf-madinah/useQpcPageFont.ts");
const page = read("src/features/mushaf-madinah/MushafPage.tsx");
const footer = read("src/features/mushaf-madinah/MushafPageFooter.tsx");
const viewport = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
const ornament = read("src/features/mushaf-madinah/MushafSurahOrnament.tsx");
const actions = read("src/features/mushaf-madinah/AyahActionSheet.tsx");
const bands = read("src/features/mushaf-madinah/layout-bands.ts");
const spec = read("docs/MUSHAF_SPEC.md");

assert.match(bands, /MUSHAF_HEADER_Y = 0\.083/);
assert.match(bands, /MUSHAF_OPEN_BANNER_Y = 0\.277/);
assert.match(bands, /MUSHAF_SETTLE_MS = 250/);
assert.match(bands, /MUSHAF_HIZB_START_PAGES = 60/);
assert.match(bands, /MUSHAF_WORD_COUNT = 83665/);

assert.match(font, /document\.fonts\.load/);
assert.match(font, /document\.fonts\.ready/);
assert.match(fit, /document\.fonts\.load/);
assert.match(fit, /document\.fonts\.ready/);
assert.match(fit, /resolveUniformMushafFontSize/);
assert.match(fit, /mushafUniformFitCacheKey/);
assert.doesNotMatch(fit, /pageNumber\s*===\s*3/);
assert.doesNotMatch(page, /pageNumber\s*===\s*3/);

assert.match(pager, /SETTLE_MS\s*=\s*250|MUSHAF_SETTLE_MS/);
assert.match(pager, /scroll-snap|data-snap/);
assert.doesNotMatch(pager, /rotateY/);
assert.match(css, /scroll-snap-type:\s*x\s+mandatory/);

assert.match(footer, /hizbStartingOnPage/);
assert.match(footer, /hizb-start/);
assert.match(page, /hizbStartingOnPage/);
assert.doesNotMatch(page, /hizbNumber=\{layout\.hizbNumber\}/);

assert.match(viewport, /useState\(false\)/);
assert.match(viewport, /exitAlwaysVisible=\{actionsOpen\s*\|\|\s*chromeOpen\s*\|\|\s*overlayOpen\}/);
assert.doesNotMatch(viewport, /exitAlwaysVisible=\{true\}/);
assert.doesNotMatch(viewport, /تعذّرت المشاركة/);
assert.match(viewport, /PrefetchedMushafPage/);
assert.match(viewport, /MUSHAF_CHROME_HIDE_MS/);

assert.match(css, /--mm-ref-header-y:\s*8\.3%/);
assert.match(css, /--mm-ref-text-start:\s*11\.9%/);
assert.match(css, /--mm-ref-text-end:\s*91\.1%/);
assert.match(css, /--mm-ref-open-banner-y:\s*27\.7%/);
assert.match(css, /--mm-ref-open-text-end:\s*74\.8%/);
assert.doesNotMatch(css, /--mm-ref-open-p2-text-end/);
assert.doesNotMatch(css, /\[data-page="2"\]/);
assert.match(css, /--mm-basmala-size:\s*var\(--mm-qpc-size\)/);
assert.match(css, /opacity:\s*1/);
assert.match(css, /border-radius:\s*0\s+16px\s+16px\s+0/);
assert.match(css, /gap:\s*6px/);
assert.match(css, /baselineShift/);

assert.match(ornament, /mm-surah-frame/);
assert.doesNotMatch(ornament, /<svg/i);
assert.doesNotMatch(ornament, /data-ornament/);
assert.doesNotMatch(ornament, /سُورَةُ \$\{/);
assert.match(actions, /data-opacity="1"/);

assert.match(spec, /overflowX === 0/);
assert.match(spec, /وصف الحزب يظهر فقط/);

const pagesDir = resolve(root, "public/data/quran-v2/pages");
let hizbStarts = 0;
let prevHizb = 0;
let totalWords = 0;
let totalAyahs = 0;
for (let n = 1; n <= 604; n++) {
  const file = resolve(pagesDir, `page-${String(n).padStart(3, "0")}.json`);
  assert.ok(existsSync(file), `صفحة ${n}`);
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const verses = Array.isArray(raw) ? raw : [];
  const keys = new Set();
  for (const v of verses) {
    keys.add(v.verse_key);
    const h = Number(v.hizb_number) || 0;
    if (h > prevHizb) {
      hizbStarts += 1;
      prevHizb = h;
    }
    for (const w of v.words ?? []) totalWords += 1;
  }
  totalAyahs += keys.size;
}
assert.equal(hizbStarts, 60, `صفحات بداية الأحزاب: ${hizbStarts}`);
assert.equal(totalAyahs, 6236, `آيات: ${totalAyahs}`);
assert.equal(totalWords, 83665, `كلمات: ${totalWords}`);

const snapPages = [1, 2, 3, 4, 5, 7, 48, 283, 600, 603];
assert.match(read("scripts/mushaf-madinah/visual-snapshot.mjs"), /1,\s*2,\s*3,\s*4,\s*5,\s*7,\s*48/);
for (const n of snapPages) {
  assert.ok(existsSync(resolve(pagesDir, `page-${String(n).padStart(3, "0")}.json`)));
}

assert.ok(existsSync(resolve(root, "src/features/mushaf-madinah/layout-bands.ts")));
const license = readFileSync(resolve(root, "../../LICENSE_RISKS.md"), "utf8");
assert.match(license, /QCF_BSML/);

console.log(
  `✓ mushaf r24-gate ok hizbStarts=${hizbStarts} ayahs=${totalAyahs} words=${totalWords} files=${readdirSync(pagesDir).length}`,
);
