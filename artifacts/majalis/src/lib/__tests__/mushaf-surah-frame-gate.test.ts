/**
 * بوابة إطار السورة — خرطوش CSS بلا SVG؛ إطار 1px وradius 6px.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/features/mushaf-madinah/mushaf-madinah.css"), "utf8");
const ornament = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafSurahOrnament.tsx"), "utf8");
const page = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafPage.tsx"), "utf8");

assert.match(ornament, /mm-surah-frame/);
assert.match(ornament, /mm-surah-frame__name/);
assert.doesNotMatch(ornament, /<svg/i);
assert.doesNotMatch(ornament, /position:\s*absolute/);
assert.doesNotMatch(css, /\.mm-surah-frame\s*\{[^}]*position:\s*absolute/);
assert.doesNotMatch(ornament, /linearGradient/i);
assert.doesNotMatch(ornament, /data-ornament/);

assert.match(css, /\.mm-surah-frame\s*\{[^}]*border:\s*1px/);
assert.match(css, /\.mm-surah-frame\s*\{[^}]*border-radius:\s*6px/);
assert.match(css, /--mm-ornament-ring\s*:/);
assert.match(css, /\.mm-ayah-line__word\[data-type="end"\][\s\S]*?border:\s*1px solid var\(--mm-ornament-ring\)/);
assert.match(css, /\.mm-surah-frame\s*\{[\s\S]*?border:\s*1px solid var\(--mm-ornament-ring\)/);
assert.match(css, /\.mm-surah-frame__name\s*\{[^}]*font-size:\s*calc\(var\(--mm-qpc-size\) \* 0\.85\)/);
assert.match(css, /\.mm-surah-frame__name\s*\{[^}]*font-weight:\s*400/);
assert.match(css, /\.mm-surah-frame__name[\s\S]*--mm-qpc-family/);
assert.doesNotMatch(css, /\.mm-surah-ornament/);
assert.doesNotMatch(page, /mm-slot__banner--with-basmala/);

console.log("mushaf-surah-frame-gate.test.ts: ok");
