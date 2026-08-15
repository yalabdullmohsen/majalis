#!/usr/bin/env node
/** بوابة وحدات خفيفة للمصحف الجديد */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(resolve(root, p), "utf8");

const comps = [
  "src/features/mushaf-madinah/MushafPage.tsx",
  "src/features/mushaf-madinah/MushafViewport.tsx",
  "src/features/mushaf-madinah/MushafPageHeader.tsx",
  "src/features/mushaf-madinah/MushafSurahOrnament.tsx",
  "src/features/mushaf-madinah/MushafAyahLine.tsx",
  "src/features/mushaf-madinah/MushafAyahNumber.tsx",
  "src/features/mushaf-madinah/MushafPageFooter.tsx",
  "src/features/mushaf-madinah/MushafControls.tsx",
];
for (const c of comps) assert.ok(existsSync(resolve(root, c)), c);

const lineSrc = read("src/features/mushaf-madinah/MushafAyahLine.tsx");
assert.match(lineSrc, /a\.id\s*-\s*b\.id/);
assert.doesNotMatch(lineSrc, /\.sort\(\(a,\s*b\)\s*=>\s*a\.position\s*-\s*b\.position\)\s*;/);

const dataSrc = read("src/lib/quran-data/qpc-page-data.ts");
assert.match(dataSrc, /words\.sort\(\(a,\s*b\)\s*=>\s*a\.id/);

const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
assert.match(css, /--mm-paper/);
assert.match(css, /--mm-gold/);
assert.match(css, /\.mm-page__body/);
assert.match(css, /\.mm-ayah-bar/);
assert.match(css, /rgba\(190,\s*157,\s*82,\s*0\.22\)/);
assert.doesNotMatch(css, /\.mm-ayah-sheet__backdrop/);
assert.doesNotMatch(css, /\.mm-page__frame\s*\{[^}]*border:\s*1px/);
assert.match(css, /html\[data-theme="dark"\]\s*\.mm-viewport/);
assert.match(css, /\.mm-page-edge/);
assert.match(css, /#1c2430|#151c26/); // ليلي كحلي لا أسود قاتم على الورقة
const ayahBlock = css.match(/\.mm-ayah-line\s*\{[^}]+\}/)?.[0] ?? "";
assert.ok(ayahBlock.includes("letter-spacing: 0") || !/letter-spacing\s*:/.test(ayahBlock));
assert.ok(ayahBlock.includes("word-spacing: 0") || !/word-spacing\s*:/.test(ayahBlock));
assert.doesNotMatch(ayahBlock, /letter-spacing:\s*[1-9]/);
assert.doesNotMatch(ayahBlock, /word-spacing:\s*[1-9]/);

const viewport = read("src/features/mushaf-madinah/MushafViewport.tsx");
assert.match(viewport, /MushafAyahActions/);
assert.match(viewport, /MushafTafsirSheet/);
assert.match(viewport, /MushafAudioDock/);
assert.match(viewport, /playAyah|togglePlay/);

const line = read("src/features/mushaf-madinah/MushafAyahLine.tsx");
assert.match(line, /onSelectVerse/);
assert.match(line, /mm-ayah-hit/);

const app = read("src/App.tsx");
assert.match(app, /MushafReaderPage/);
assert.doesNotMatch(app, /MushafComingSoonPage/);
assert.doesNotMatch(app, /demo-ayah-reader(?!.*Redirect)/);

const page = read("src/pages/quran/MushafReaderPage.tsx");
assert.match(page, /MushafViewport/);
assert.doesNotMatch(page, /\.pdf/i);

assert.ok(existsSync(resolve(root, "public/fonts/qpc-v2/p1.woff2")));
assert.ok(existsSync(resolve(root, "public/data/quran-v2/pages/page-001.json")));

console.log("✓ mushaf-gates:unit ok");
