/**
 * بوابة علامة الآية: محرف بحجم النص + إطار زخرفي CSS موحّد مع السورة؛ بلا SVG ولا تحجيم.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-ayah-marker-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/features/mushaf-madinah/mushaf-madinah.css"), "utf8");
const line = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafAyahLine.tsx"), "utf8");
const numberSrc = readFileSync(
  resolve(root, "src/features/mushaf-madinah/MushafAyahNumber.tsx"),
  "utf8",
);

const endBlock =
  css.match(/\.mm-ayah-line__word\[data-type="end"\][^{]*\{[^}]+\}/)?.[0] ??
  css.match(/\[data-type="end"\][^,{]*[,{][\s\S]*?\{[^}]+\}/)?.[0] ??
  "";

assert.match(line, /data-type=\{(w|word)\.charType\}/);
assert.match(line, /ayah-active/);
assert.match(line, /\{(w|word)\.glyphText\}/);
assert.doesNotMatch(line, /MushafAyahNumber/);
assert.doesNotMatch(numberSrc, /<svg/i);
assert.doesNotMatch(numberSrc, /scale\(/);

assert.ok(endBlock.includes("font-size: inherit") || /font-size:\s*inherit/.test(css), "حجم علامة الآية = حجم السطر");
assert.match(css, /\[data-type="end"\]/);
assert.match(css, /background-image:\s*none/);
assert.match(css, /\.mm-ayah-line__word\[data-type="end"\][^}]*transform:\s*none|\.mm-ayah-number[^}]*transform:\s*none/);
assert.doesNotMatch(css, /border-radius:\s*50%\s*\/\s*42%/);
assert.doesNotMatch(css, /height:\s*1\.55em/);
assert.doesNotMatch(css, /font-size:\s*1\.22em/);
assert.doesNotMatch(css, /ayah-marker|ayahBadge|verse-marker|end-marker/);
assert.match(css, /--mm-ayah-mark\s*:/);
assert.match(css, /\[data-type="end"\][^}]*color:\s*var\(--mm-ayah-mark\)|\.mm-ayah-hit--end[^}]*color:\s*var\(--mm-ayah-mark\)/);
assert.match(css, /ayah-active/);
assert.doesNotMatch(css, /transition:\s*background-color\s+150ms/);

/* تظليل الآية عبر is-selected على الكلمات + طبقة hl للتلاوة */
assert.match(line, /ayah-active\.mm-ayah-line__word|ayah-active|is-selected/);
assert.match(line, /is-selected/);
assert.match(css, /\.ayah-active\.mm-ayah-line__word/);
assert.match(css, /\.mm-ayah-hl__band/);
assert.match(css, /\.ayah-active\.mm-ayah-line__word:not\(\[data-type="end"\]\)/);
assert.match(css, /\.mm-ayah-hit--end\.ayah-active/);
assert.doesNotMatch(line, /border-radius:\s*3px/);

console.log("mushaf-ayah-marker-gate.test.ts: ok");
