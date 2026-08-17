/**
 * بوابة صفر فيض أفقي: ٦٠٤ صفحة × عروض 320/390/430.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-line-overflow-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fitPageFontSize } from "../../features/mushaf-madinah/fitPageFontSize";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pagesDir = resolve(root, "public/data/quran-v2/pages");
const css = readFileSync(resolve(root, "src/features/mushaf-madinah/mushaf-madinah.css"), "utf8");
const lineSrc = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafAyahLine.tsx"), "utf8");
const fitSrc = readFileSync(resolve(root, "src/features/mushaf-madinah/useMushafPageFontFit.ts"), "utf8");
const fitFn = readFileSync(resolve(root, "src/features/mushaf-madinah/fitPageFontSize.ts"), "utf8");
const pageSrc = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafPage.tsx"), "utf8");

const VIEWPORTS = [320, 390, 430] as const;
/** هامش الحبر من المواصفة: ١٫٥٪ … ٩٨٫٤٪ */
const INK_RATIO = 0.984 - 0.015;

const ayahBlock = css.match(/\.mm-ayah-line\s*\{[^}]+\}/)?.[0] ?? "";
assert.ok(ayahBlock, ".mm-ayah-line");
assert.match(ayahBlock, /display:\s*flex/);
assert.match(ayahBlock, /justify-content:\s*space-between/);
assert.match(ayahBlock, /overflow-x:\s*(hidden|clip)/);
assert.doesNotMatch(ayahBlock, /overflow-x:\s*visible/);
assert.doesNotMatch(ayahBlock, /overflow:\s*visible/);

assert.match(css, /\.mm-ayah-line\[data-centered="true"\]\s*\{[^}]*justify-content:\s*center/);
assert.match(css, /\.mm-viewport\s+\.mm-page\s*\{[^}]*overflow-x:\s*(hidden|clip)/);
assert.match(css, /contain:\s*layout\s+paint/);

assert.match(lineSrc, /data-type=\{w\.charType\}/);
assert.match(lineSrc, /data-centered=\{centered \? "true" : "false"\}/);
assert.match(pageSrc, /isLastSurahLine/);
assert.match(fitFn, /createElement\("canvas"\)/);
assert.match(fitSrc, /fitPageFontSize/);
assert.match(fitSrc, /ResizeObserver/);
assert.doesNotMatch(fitSrc, /wordSpacing/);

type RawWord = { line_number: number; code_v2?: string };
type RawVerse = { words: RawWord[] };

function measure(fontPx: number, text: string): number {
  return text.length * fontPx * 0.62;
}

assert.equal(fitPageFontSize([], 300, "qpc", measure), 12);
assert.equal(fitPageFontSize(["ا"], 300, "qpc", measure), 40);
assert.ok(fitPageFontSize(["أ".repeat(80)], 200, "qpc", measure) < 40);

let pages = 0;
let checks = 0;

for (let n = 1; n <= 604; n++) {
  const file = resolve(pagesDir, `page-${String(n).padStart(3, "0")}.json`);
  assert.ok(existsSync(file), `ناقصة: صفحة ${n}`);
  const raw = JSON.parse(readFileSync(file, "utf8")) as RawVerse[];
  const byLine = new Map<number, string[]>();
  for (const v of raw) {
    for (const w of v.words) {
      const glyph = w.code_v2 ?? "";
      if (!glyph) continue;
      const arr = byLine.get(w.line_number) ?? [];
      arr.push(glyph);
      byLine.set(w.line_number, arr);
    }
  }
  const lines = [...byLine.values()].map((glyphs) => glyphs.join(""));
  assert.ok(lines.length > 0, `صفحة ${n}: بلا أسطر`);

  for (const vw of VIEWPORTS) {
    const containerPx = Math.floor(vw * INK_RATIO);
    const size = fitPageFontSize(lines, containerPx, `qpc-page-${n}`, measure);
    const widest = Math.max(...lines.map((l) => measure(size, l)));
    // page.scrollWidth <= page.clientWidth — بعد الملاءمة أعرض سطر ≤ الحاوية
    assert.ok(
      widest <= containerPx,
      `فيض أفقي صفحة ${n} @${vw}px: widest=${widest.toFixed(2)} container=${containerPx} size=${size}`,
    );
    checks += 1;
  }
  pages += 1;
}

assert.equal(pages, 604);
assert.equal(checks, 604 * 3);

console.log(
  `mushaf-line-overflow-gate.test.ts: ok pages=604 viewports=${VIEWPORTS.join("/")} checks=${checks}`,
);
