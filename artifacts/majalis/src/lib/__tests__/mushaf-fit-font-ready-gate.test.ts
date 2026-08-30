/**
 * بوابة: لا قياس canvas قبل document.fonts.check لخط الصفحة نفسها.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-fit-font-ready-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MUSHAF_FIT_LINE_RATIO,
  MUSHAF_FIT_MAX_PX,
  MUSHAF_FIT_MIN_PX,
  fitPageFontSize,
  mushafFontCheckSpec,
  normalizeMushafFontFamily,
} from "../../features/mushaf-madinah/fitPageFontSize";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const fit = read("src/features/mushaf-madinah/fitPageFontSize.ts");
const hook = read("src/features/mushaf-madinah/useMushafPageFontFit.ts");
const qpc = read("src/features/mushaf-madinah/useQpcPageFont.ts");

assert.equal(normalizeMushafFontFamily('"qpc-v2-p2"'), "qpc-v2-p2");
assert.equal(mushafFontCheckSpec('"qpc-v2-p5"'), '16px "qpc-v2-p5"');
assert.match(fit, /assertMushafPageFontReady/);
assert.match(fit, /\$\{fontPx\}px "\$\{fam\}"/);
assert.match(hook, /document\.fonts\.check/);
assert.match(hook, /const spec = `16px "\$\{family\}"`/);
assert.match(hook, /document\.fonts\.load\(spec\)/);
assert.match(qpc, /document\.fonts\.check/);
assert.match(qpc, /qpc-v2-p\$\{pageNumber\}/);
assert.equal(MUSHAF_FIT_MIN_PX, 12);
assert.equal(MUSHAF_FIT_MAX_PX, 38);
assert.equal(MUSHAF_FIT_LINE_RATIO, 1.85);

const measure = (fontPx: number, text: string) => text.length * fontPx * 0.62;
assert.throws(
  () =>
    fitPageFontSize(["ا"], 400, "qpc", measure, {
      blockHeightPx: 20,
      lineCount: 15,
    }),
  /تعذّر ضبط الصفحة/,
);

console.log("mushaf-fit-font-ready-gate.test.ts: ok");
