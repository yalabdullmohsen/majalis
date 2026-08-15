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

const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
assert.match(css, /--mm-paper/);
assert.match(css, /--mm-gold/);
const ayahBlock = css.match(/\.mm-ayah-line\s*\{[^}]+\}/)?.[0] ?? "";
assert.ok(ayahBlock.includes("letter-spacing: 0") || !/letter-spacing\s*:/.test(ayahBlock));
assert.ok(ayahBlock.includes("word-spacing: 0") || !/word-spacing\s*:/.test(ayahBlock));
assert.doesNotMatch(ayahBlock, /letter-spacing:\s*[1-9]/);
assert.doesNotMatch(ayahBlock, /word-spacing:\s*[1-9]/);

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
