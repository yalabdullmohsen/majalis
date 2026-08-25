/**
 * بوابة فواصل الآيات — لون token موحّد + تناسق.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-ayah-marks-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/features/mushaf-madinah/mushaf-madinah.css"), "utf8");
const line = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafAyahLine.tsx"), "utf8");

assert.match(css, /--mm-ayah-mark:\s*#[0-9a-fA-F]{3,8}/, "token واحد لفاصلة الآية");
assert.match(
  css,
  /\.mm-ayah-line__word\[data-type="end"\][\s\S]*?color:\s*var\(--mm-ayah-mark\)/,
  "لون الفاصلة من الـtoken",
);
assert.match(css, /html\[data-theme="dark"\][\s\S]*--mm-ayah-mark:/, "ليلي له قيمة token");
assert.match(css, /font-size:\s*inherit/);
assert.match(css, /vertical-align:\s*baseline/);
assert.doesNotMatch(css, /ayah-marker|ayahBadge|verse-marker|end-marker/);
assert.doesNotMatch(css, /border-radius:\s*50%\s*\/\s*42%/);
assert.match(line, /charType === "end"|data-type=\{(w|word)\.charType\}/);
assert.match(line, /\{(w|word)\.glyphText\}/);

console.log("mushaf-ayah-marks-gate.test.ts: ok");
