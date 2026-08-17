/**
 * تظليل الآية متصل: طبقة مستطيلات خلف النص، بلا إزاحة كلمات، rAF + ResizeObserver فقط.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-ayah-highlight-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
const page = read("src/features/mushaf-madinah/MushafPage.tsx");
const highlight = read("src/features/mushaf-madinah/MushafAyahHighlight.tsx");
const line = read("src/features/mushaf-madinah/MushafAyahLine.tsx");

assert.match(page, /MushafAyahHighlight/);
assert.match(highlight, /requestAnimationFrame/);
assert.match(highlight, /ResizeObserver/);
assert.match(highlight, /getBoundingClientRect/);
assert.match(highlight, /mm-ayah-highlight/);
assert.doesNotMatch(highlight, /setInterval|setTimeout/);
assert.match(css, /\.mm-ayah-highlight\s*\{[^}]*z-index:\s*0/);
assert.match(css, /\.mm-ayah-highlight__rect\s*\{[^}]*border-radius:\s*4px/);
assert.match(css, /var\(--gold,\s*var\(--mm-gold\)\) 14%/);
assert.match(css, /\.ayah-active\.mm-ayah-line__word\s*\{[^}]*background:\s*transparent/);
assert.match(css, /\.ayah-active\.mm-ayah-line__word\s*\{[^}]*padding:\s*0/);
assert.doesNotMatch(line, /padding:\s*[1-9]/);
assert.match(css, /\.mm-ayah-run__text\s*\{[^}]*padding:\s*0/);

console.log("mushaf-ayah-highlight-gate.test.ts: ok");
