/**
 * بوابة قبول القارئ الجديد — مصحف بسيط بلا زخارف + صفحات إلزامية.
 * تشغيل: node --import tsx src/lib/__tests__/new-mushaf-reader-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const REQUIRED_PAGES = [1, 2, 3, 5, 11, 13, 126, 221, 222, 294, 393, 604] as const;

const readerPage = read("src/pages/quran/MushafReaderPage.tsx");
const newReader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const pageView = read("src/features/mushaf-reader/MushafPage.tsx");
const verse = read("src/features/mushaf-reader/MushafVerseLayer.tsx");
const css = read("src/features/mushaf-reader/mushaf-reader.css");

assert.match(readerPage, /NewMushafReader|MushafViewport/);
assert.match(readerPage, /features\/mushaf-reader/);
assert.doesNotMatch(readerPage, /features\/mushaf-madinah/);
assert.doesNotMatch(readerPage, /\.pdf/i);

assert.match(newReader, /MushafPage\b/);
assert.match(newReader, /MushafVerseMenu|MushafControlsLayer/);
assert.match(newReader, /loadMushafPage/);
assert.match(newReader, /prefetchMushafPage/);
assert.match(newReader, /playAyah/);
assert.match(newReader, /MushafTafsirSheet/);
assert.match(newReader, /saveReciterId|loadReciterId/);
assert.match(newReader, /allowOffscreenPrefetch/);

assert.match(pageView, /MushafVerseLayer/);
assert.match(pageView, /bismillahPre === true/);
assert.match(pageView, /MushafSurahBanner/);
assert.doesNotMatch(pageView, /MushafDecorFrame/);
assert.doesNotMatch(pageView, /DecorFrame/);

assert.match(newReader, /MushafPager/);
assert.match(newReader, /useMushafFixedMetrics/);
assert.doesNotMatch(newReader, /features\/mushaf-madinah\/MushafPager/);

assert.match(verse, /word\.glyphText/);
assert.match(verse, /nm-ayah-mark/);
assert.match(verse, /is-selected/);
assert.match(verse, /is-playing/);

assert.match(css, /#fdf9f3|--nm-paper:\s*#fdf9f3|--mushaf-page-bg:\s*#fdf9f3/i);
assert.match(css, /--mushaf-page-bg:/);
assert.match(css, /--mushaf-text-color:/);
assert.match(css, /--mushaf-meta-color:/);
assert.match(css, /--mushaf-body-width:/);
assert.match(css, /--mushaf-safe-top:|--mushaf-top-safe:/);
assert.match(css, /--mushaf-line-height:/);
assert.match(css, /--mushaf-font-size:/);
assert.match(css, /--mushaf-page-width:/);
assert.match(css, /--mushaf-page-height:/);
assert.match(css, /var\(--inset-/);
assert.match(css, /\.nm-verse-menu/);
assert.match(css, /\.nm-line[^{]*\{[^}]*display:\s*block/);
assert.doesNotMatch(css, /\.nm-line[^{]*\{[^}]*justify-content:\s*space-between/);
assert.doesNotMatch(css, /\.nm-line--center[^{]*\{[^}]*justify-content:\s*space-between/);
assert.doesNotMatch(css, /MushafDecorFrame|nm-page__frame-svg/);
assert.doesNotMatch(css, /\.nm-page__stage[^{]*\{[^}]*border:\s*1\.5px/);
assert.doesNotMatch(css, /env\(safe-area/);
assert.ok(!existsSync(resolve(root, "src/features/mushaf-reader/MushafDecorFrame.tsx")));

const fitHook = read("src/features/mushaf-reader/useMushafFixedMetrics.ts");
assert.match(fitHook, /resolveUniformMushafFontSize/);
assert.match(fitHook, /--mushaf-font-size/);
assert.match(fitHook, /useLayoutEffect/);
assert.doesNotMatch(fitHook, /fitPageFontSize\(/);
assert.doesNotMatch(read("src/features/mushaf-reader/MushafPage.tsx"), /useNewMushafFontFit|useMushafFixedMetrics/);
assert.match(read("src/features/mushaf-reader/MushafPage.tsx"), /data-mm-fit="1"/);
assert.match(read("src/features/mushaf-reader/useMushafPager.ts"), /translate3d/);
assert.match(read("src/features/mushaf-reader/MushafPager.tsx"), /data-pane="next"/);

for (const n of REQUIRED_PAGES) {
  const jsonPath = resolve(
    root,
    `public/data/quran-v2/pages/page-${String(n).padStart(3, "0")}.json`,
  );
  const font = resolve(root, `public/fonts/qpc-v2/p${n}.woff2`);
  assert.ok(existsSync(jsonPath), `بيانات الصفحة ${n}`);
  assert.ok(existsSync(font), `خط الصفحة ${n}`);
  const raw = JSON.parse(readFileSync(jsonPath, "utf8")) as unknown;
  const verses = Array.isArray(raw) ? raw : [];
  assert.ok(verses.length > 0, `آيات الصفحة ${n}`);
  const first = verses[0] as {
    page_number?: number;
    words?: Array<{ code_v2?: string }>;
  };
  assert.equal(first.page_number ?? n, n);
  const hasGlyph = verses.some((v) => {
    const words = (v as { words?: Array<{ code_v2?: string }> }).words ?? [];
    return words.some((w) => typeof w.code_v2 === "string" && w.code_v2.length > 0);
  });
  assert.ok(hasGlyph, `code_v2/glyph في الصفحة ${n}`);
}

console.log("new-mushaf-reader-gate.test.ts: ok", REQUIRED_PAGES.join(","));
