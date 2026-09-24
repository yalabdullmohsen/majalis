/**
 * Guard: ص١–ص٢ امتلاء عمودي + Accent Theme + علامة آية أوضح — بلا مساس بالنص القرآني.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-pages-1-2-layout-gold-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  mushafPrintedGold,
  mushafVerseMarkerFill,
  mushafVerseMarkerBorder,
  mushafVerseMarkerNumber,
  quranGold,
  mushafOpeningTurquoise,
} from "../../features/mushaf-reader/mushaf-warm-yellow-tokens";
import {
  isContentPackedPage,
  resolveContentRowCount,
  resolveSlotOrder,
} from "../../features/mushaf-reader/page-layout-engine";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const css = read("src/features/mushaf-reader/mushaf-reader.css");
const chrome = read("src/styles/reader-page-chrome.css");
const page = read("src/features/mushaf-reader/MushafPage.tsx");
const data = read("src/lib/quran-data/qpc-page-data.ts");
const engine = read("src/features/mushaf-reader/page-layout-engine.ts");

console.log("=== لا مساس بالنص / التقسيم ===");
assert.match(engine, /لا يغيّر تقسيم المصحف ولا نص الآيات/);
assert.match(page, /layout\.pageNumber === 1/);
assert.match(page, /layout\.pageNumber === 2/);
assert.doesNotMatch(page, /replace\(|mutateAyah|editGlyph/);
assert.match(data, /bannerSlot = 1/);

console.log("=== Content Driven ص١–ص٢ بلا 1fr المفرّغ ===");
assert.equal(isContentPackedPage("opening"), true);
assert.equal(isContentPackedPage("lead"), true);
assert.equal(resolveContentRowCount(resolveSlotOrder("opening", [1, 2, 3, 4, 5, 6, 7])), 7);
assert.match(chrome, /align-content:\s*center/);
assert.match(chrome, /minmax\(0,\s*auto\)/);
assert.doesNotMatch(
  chrome,
  /\.nm-page--opening \.nm-page__body[\s\S]{0,220}grid-template-rows:\s*repeat\(var\(--nm-content-rows[^)]*\),\s*minmax\(0,\s*1fr\)/s,
);
assert.match(css, /--nm-content-rows/);
assert.doesNotMatch(
  css,
  /\.nm-page--opening \.nm-page__body[\s\S]{0,160}grid-template-rows:\s*repeat\(15,/s,
);

console.log("=== Quran Gold palette (single appearance) ===");
assert.equal(quranGold.toLowerCase(), mushafPrintedGold.toLowerCase());
assert.equal(mushafVerseMarkerFill.toLowerCase(), mushafPrintedGold.toLowerCase());
assert.equal(mushafVerseMarkerBorder.toLowerCase(), "#b89620");
assert.equal(mushafVerseMarkerNumber.toLowerCase(), "#5f4814");
assert.equal(mushafOpeningTurquoise.toLowerCase(), "#c9a82e");
assert.match(css, /--quran-gold:\s*#c9a82e/i);
assert.match(css, /--mushaf-printed-gold:\s*#c9a82e/i);
assert.match(css, /--mushaf-accent-fill:\s*var\(--quran-gold\)/i);
assert.match(css, /\[data-mushaf-accent="gold"\]/);
assert.doesNotMatch(css, /--mushaf-accent-fill:\s*#0e7a6b/i);
assert.doesNotMatch(css, /--mushaf-verse-marker-fill:\s*#dcb424/i);

console.log("=== علامة آية أوضح بلا تجاوز النص عالميًا ===");
assert.match(css, /--mushaf-ayah-mark-size:\s*1\.15em/);
assert.match(css, /--mushaf-ayah-mark-font-size:\s*0\.62em/);
assert.match(css, /--mushaf-ayah-mark-number-size:\s*1\.40em/);
assert.match(css, /\.nm-ayah-mark__glyph\s*\{[^}]*font-size:\s*var\(--mushaf-ayah-mark-number-size/s);
/* ص١–ص٢: لا تضخيم علامة منفصل — نفس عقد العلامة العام */
assert.doesNotMatch(chrome, /\.nm-page--opening[\s\S]{0,400}--mushaf-ayah-mark-size:\s*1\.22em/);
assert.doesNotMatch(
  chrome,
  /\.nm-page--opening \.nm-ayah-mark[\s\S]{0,200}font-size:\s*var\(--mushaf-ayah-mark-number-size/,
);
assert.match(chrome, /\.nm-page--opening \.nm-ayah-mark[\s\S]{0,400}mushaf-marker-background/);
assert.match(page, /MushafOpeningSpreadLayout/);

console.log("=== توازن ص١–ص٢ + بلا letter-spacing على البسملة ===");
assert.match(chrome, /\.nm-page--opening \.nm-slot\[data-kind="banner"\][\s\S]{0,80}padding-block-end:\s*0\.04em/);
assert.match(chrome, /\.nm-page--opening \.nm-slot\[data-kind="basmala"\][\s\S]{0,80}padding-block-end:\s*0\.02em/);
assert.match(chrome, /\.nm-page--opening \.nm-slot\[data-kind="line"\][\s\S]{0,60}align-items:\s*center/);
assert.match(css, /\.nm-basmala\s*\{[^}]*letter-spacing:\s*0\b/s);
assert.doesNotMatch(css, /\.nm-basmala\s*\{[^}]*letter-spacing:\s*0\.01em/s);
assert.equal(isContentPackedPage("surah-start"), false);
assert.equal(isContentPackedPage("normal"), false);

console.log("mushaf-pages-1-2-layout-gold-gate.test.ts: ok");
