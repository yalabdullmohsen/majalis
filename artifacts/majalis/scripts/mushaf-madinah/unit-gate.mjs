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
assert.match(css, /rgba\(190,\s*157,\s*82,\s*0\.2/);
assert.doesNotMatch(css, /\.mm-ayah-sheet__backdrop/);
assert.doesNotMatch(css, /\.mm-page__frame\s*\{[^}]*border:\s*1px/);
assert.match(css, /html\[data-theme="dark"\]\s*\.mm-viewport/);
assert.match(css, /\.mm-page-edge/);
assert.match(css, /#152018|#101812|#0e1410|#1c2430|#151c26/);
assert.match(css, /\.mm-ayah-run__text\.is-selected/);
assert.match(css, /\.mm-ayah-bar__dismiss\s*\{[^}]*background:\s*transparent/);
assert.match(css, /\.mm-viewport\s+\.mm-page\s*\{[^}]*box-shadow:\s*none/);
assert.match(css, /\.mm-basmala\s*\{[^}]*font-size:\s*var\(--mm-qpc-size\)/);
assert.match(css, /\.mm-reciter-sheet/);
assert.match(css, /--mm-outer-pad:\s*0/);
assert.match(css, /--mm-chrome-top-h/);
assert.match(css, /--mm-chrome-bottom-h/);
assert.match(css, /\.mm-ayah-bar__handle/);
assert.match(css, /max-height:\s*min\(50dvh/);
assert.doesNotMatch(css, /--mm-page-aspect/);
assert.doesNotMatch(css, /background:\s*#000\b/);
const ayahBlock = css.match(/\.mm-ayah-line\s*\{[^}]+\}/)?.[0] ?? "";
assert.ok(ayahBlock.includes("letter-spacing: 0") || !/letter-spacing\s*:/.test(ayahBlock));
assert.ok(ayahBlock.includes("word-spacing: 0") || !/word-spacing\s*:/.test(ayahBlock));
assert.doesNotMatch(ayahBlock, /letter-spacing:\s*[1-9]/);
assert.doesNotMatch(ayahBlock, /word-spacing:\s*[1-9]/);
assert.match(ayahBlock, /bidi-override/);

const viewport = read("src/features/mushaf-madinah/MushafViewport.tsx");
assert.match(viewport, /MushafAyahActions/);
assert.match(viewport, /MushafTafsirSheet/);
assert.match(viewport, /MushafAudioDock/);
assert.match(viewport, /playAyah|togglePlay/);
assert.match(viewport, /onShare|navigator\.share/);
assert.match(viewport, /exitAlwaysVisible/);
assert.match(viewport, /dx < 0\) go\(page \+ 1\)/);
assert.match(viewport, /SWIPE_MIN_PX\s*=\s*45/);
assert.match(viewport, /suppressPageSyncRef/);
assert.match(viewport, /اختر آية أولاً/);

const controls = read("src/features/mushaf-madinah/MushafControls.tsx");
assert.match(controls, /exitAlwaysVisible/);
assert.match(controls, /data-exit/);
assert.match(controls, /\{pageNumber\} \/ \{MUSHAF_PAGE_MAX\}/);

const actions = read("src/features/mushaf-madinah/MushafAyahActions.tsx");
assert.match(actions, /mm-reciter-sheet/);
assert.match(actions, /مشاركة|onShare/);
assert.match(actions, /husary|MUSHAF_RECITER_IDS/);
assert.match(actions, /mm-ayah-bar__handle/);
assert.match(actions, /جاري تحميل التلاوة/);
assert.match(actions, /mushaf-ayah-play/);

const pageSrc = read("src/features/mushaf-madinah/MushafPage.tsx");
assert.match(pageSrc, /inlineBasmala/);
assert.match(pageSrc, /bismillahPre/);
assert.match(pageSrc, /BASMALA/);
assert.match(pageSrc, /targetStart = 1/);
assert.doesNotMatch(pageSrc, /Math\.floor\(\(15 - span\) \/ 2\)/);
assert.match(pageSrc, /mm-slot__banner--with-basmala/);

const line = read("src/features/mushaf-madinah/MushafAyahLine.tsx");
assert.match(line, /onSelectVerse/);
assert.match(line, /mm-ayah-hit/);
assert.match(line, /mm-ayah-run/);
assert.match(line, /groupRuns|WordRun/);
assert.match(line, /charType === "end"/);
assert.match(line, /stopPropagation/);
assert.match(line, /LONG_PRESS_MS/);
assert.match(line, /data-testid="mushaf-ayah-hit"/);

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
