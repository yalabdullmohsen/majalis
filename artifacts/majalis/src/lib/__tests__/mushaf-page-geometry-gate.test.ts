/**
 * بوابة هندسة الصفحة: ١٥ خانة للصفحات ٣–٦٠٤، وص١–٢ كتلة موسّطة، والحزب في البدايات فقط.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pagesDir = resolve(root, "public/data/quran-v2/pages");
const css = readFileSync(resolve(root, "src/features/mushaf-madinah/mushaf-madinah.css"), "utf8");
const page = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafPage.tsx"), "utf8");
const footer = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafPageFooter.tsx"), "utf8");
const bands = readFileSync(resolve(root, "src/features/mushaf-madinah/layout-bands.ts"), "utf8");
const spec = readFileSync(resolve(root, "docs/MUSHAF_SPEC.md"), "utf8");
const ornament = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafSurahOrnament.tsx"), "utf8");

assert.match(page, /Array\.from\(\{ length: 15 \}/);
assert.match(page, /filledSlots/);
assert.match(page, /mm-page__body--opening/);
assert.match(css, /mm-page__body--opening/);
assert.match(css, /--mm-ref-open-banner-y:\s*27\.7%/);
assert.match(bands, /MUSHAF_LINES_NORMAL = 15/);
assert.match(bands, /MUSHAF_HIZB_START_PAGES = 60/);
assert.match(footer, /hizbStartingOnPage/);
assert.match(ornament, /data-ornament="islamic-light"/);
assert.doesNotMatch(ornament, /url\(.*bsml/i);
assert.match(spec, /QCF_BSML/);

type RawWord = { line_number: number };
type RawVerse = { words: RawWord[]; hizb_number?: number };

for (let n = 3; n <= 604; n++) {
  const file = resolve(pagesDir, `page-${String(n).padStart(3, "0")}.json`);
  assert.ok(existsSync(file), `صفحة ${n}`);
  const raw = JSON.parse(readFileSync(file, "utf8")) as RawVerse[];
  const lines = new Set<number>();
  for (const v of raw) {
    for (const w of v.words) {
      assert.ok(w.line_number >= 1 && w.line_number <= 15, `صفحة ${n} سطر ${w.line_number}`);
      lines.add(w.line_number);
    }
  }
  assert.ok(lines.size <= 15, `صفحة ${n}: ${lines.size} أسطر`);
}

let hizbStarts = 0;
let prevHizb = 0;
for (let n = 1; n <= 604; n++) {
  const raw = JSON.parse(
    readFileSync(resolve(pagesDir, `page-${String(n).padStart(3, "0")}.json`), "utf8"),
  ) as RawVerse[];
  for (const v of raw) {
    const h = Number(v.hizb_number) || 0;
    if (h > prevHizb) {
      hizbStarts += 1;
      prevHizb = h;
    }
  }
}
assert.equal(hizbStarts, 60, `بدايات الأحزاب ${hizbStarts} ≠ ٦٠`);

console.log(`mushaf-page-geometry-gate.test.ts: ok hizbStarts=${hizbStarts}`);
