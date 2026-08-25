/**
 * بوابة: هندسة النص، مزامنة التظليل، وفهرس البحث المسطّح.
 * تشغيل: node --import tsx src/lib/__tests__/typography-layout-sync-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MUSHAF_LINE_HEIGHT_RATIO,
  UTHMANI_LINE_HEIGHT_RATIO,
  quranLineHeightPx,
} from "../text-layout-geometry";
import {
  QURAN_FONT_LINE_HEIGHT_RATIO,
  quranTextStyle,
} from "../quran-font-size";
import { MUSHAF_FIT_LINE_RATIO } from "../../features/mushaf-madinah/fitPageFontSize";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p: string) => readFileSync(resolve(appRoot, p), "utf8");

assert.equal(UTHMANI_LINE_HEIGHT_RATIO, 1.85);
assert.equal(MUSHAF_LINE_HEIGHT_RATIO, 1.85);
assert.equal(MUSHAF_FIT_LINE_RATIO, 1.85);
assert.equal(QURAN_FONT_LINE_HEIGHT_RATIO, 1.85);
assert.equal(quranLineHeightPx(20), 37);
assert.equal(quranTextStyle(20).lineHeight, 37);

const hl = read("features/mushaf-madinah/MushafAyahHighlight.tsx");
assert.match(hl, /getCachedTextBands/);
assert.match(hl, /requestAnimationFrame/);
assert.match(hl, /shouldThrottleUiRender/);

const sync = read("features/mushaf-madinah/mushaf-ayah-sync-store.ts");
assert.match(sync, /useSyncExternalStore/);
assert.match(sync, /useMushafAyahWordSelected/);

const line = read("features/mushaf-madinah/MushafAyahLine.tsx");
assert.match(line, /useMushafAyahWordSelected/);
assert.doesNotMatch(line, /selectedVerseKey/);

const reader = read("features/mushaf-madinah/VerifiedMushafReader.tsx");
assert.match(reader, /scrollAyahIntoViewCentered/);
assert.match(reader, /data-text-profile/);

const css = read("features/mushaf-madinah/mushaf-madinah.css");
assert.match(css, /translateZ\(0\)/);
assert.match(css, /data-text-profile="low"/);
assert.match(css, /--mm-line-height:\s*1\.85/);
assert.match(css, /mm-page__body[\s\S]*padding-inline-start:\s*max\(0\.05em,\s*var\(--inset-left/);

const fit = read("features/mushaf-madinah/fitPageFontSize.ts");
assert.match(fit, /releaseCanvasResources/);

const plain = read("lib/quran-plain-text-index.ts");
assert.match(plain, /plainText/);
assert.match(plain, /searchPlainQuranIndex/);

const mem = read("lib/memory-pressure.ts");
assert.match(mem, /clearTextMeasureCache/);
assert.match(mem, /purgeMushafLayoutCaches/);

console.log("typography-layout-sync-gate: OK");
