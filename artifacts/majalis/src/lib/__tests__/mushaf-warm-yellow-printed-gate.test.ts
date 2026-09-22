/**
 * بوابة Sunnah Warm Yellow Printed Mushaf — ألوان/تكوين بلا مساس بالنص أو الـgeometry.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-warm-yellow-printed-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  mushafPaperWarmYellow,
  mushafPrintedGold,
  mushafVerseMarkerFill,
  mushafVerseMarkerBorder,
  mushafVerseMarkerNumber,
  mushafInkPrimary,
} from "../../features/mushaf-reader/mushaf-warm-yellow-tokens";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/features/mushaf-reader/mushaf-reader.css"), "utf8");
const page = readFileSync(resolve(root, "src/features/mushaf-reader/MushafPage.tsx"), "utf8");
const banner = readFileSync(resolve(root, "src/features/mushaf-reader/MushafSurahBanner.tsx"), "utf8");

assert.match(css, new RegExp(`--mushaf-paper-warm-yellow:\\s*${mushafPaperWarmYellow}`, "i"));
assert.match(css, /--mushaf-verse-marker-fill:\s*var\(--mushaf-marker-background\)/);
assert.match(css, new RegExp(`--mushaf-printed-gold:\\s*${mushafPrintedGold}`, "i"));
assert.match(css, new RegExp(`--mushaf-ink:\\s*${mushafInkPrimary}`, "i"));
assert.match(
  css,
  /\[data-mushaf-accent="gold"\][\s\S]{0,400}--mushaf-marker-background:\s*var\(--quran-gold\)/,
);
assert.equal(mushafVerseMarkerFill.toLowerCase(), mushafPrintedGold.toLowerCase());
assert.equal(mushafVerseMarkerBorder.toLowerCase(), "#b89620");
assert.equal(mushafVerseMarkerNumber.toLowerCase(), "#5f4814");

assert.match(css, /--mushaf-ayah-mark-size:\s*1\.15em/);
assert.match(css, /\.nm-ayah-mark[\s\S]*?clip-path:\s*polygon/);
assert.match(css, /\.nm-ayah-mark[\s\S]*?background:\s*var\(--mushaf-verse-marker-fill\)/);
assert.doesNotMatch(css, /\.nm-page__ornament-frame\s*\{/);
assert.doesNotMatch(css, /\.nm-page__fatiha-medallion\s*\{/);
assert.doesNotMatch(page, /AuthenticWarmMushafPageFrame|authentic-mushaf-page-frame/);
assert.doesNotMatch(page, /SunnahFatihaBraidedMedallion|sunnah-fatiha-medallion|sunnah-baqarah-medallion/);

assert.match(page, /mushaf-header-juz/);
assert.match(page, /mushaf-header-hizb/);
assert.doesNotMatch(page, /headerSurahName|nm-page__header-surah/);

assert.match(banner, /سورة \$\{label\}/);
assert.match(css, /--mushaf-surah-frame-accent:\s*var\(--mushaf-surah-header-line\)/);
assert.doesNotMatch(css, /--mushaf-surah-frame-border:\s*#1f4f3c/);

assert.doesNotMatch(css, /--mushaf-verse-marker-fill:\s*#a3864d/i);
assert.doesNotMatch(css, /--mushaf-paper-warm-yellow:\s*#fcf7ec/i);
assert.doesNotMatch(css, /--mushaf-paper-warm-yellow:\s*#f8f1d4/i);
assert.doesNotMatch(css, /\.nm-ayah-mark[\s\S]*?50% 2%/);
assert.match(css, /SunnahVerseRosette|فصوص ناعمة/);
assert.match(css, /\.nm-surah-banner[\s\S]*?width:\s*fit-content/);
assert.match(readFileSync(resolve(root, "src/styles/reader-page-chrome.css"), "utf8"), /Content Driven Layout/);

console.log("mushaf-warm-yellow-printed-gate.test.ts: ok");
