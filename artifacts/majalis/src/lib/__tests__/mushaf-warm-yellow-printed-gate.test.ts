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
assert.match(css, new RegExp(`--mushaf-verse-marker-fill:\\s*${mushafVerseMarkerFill}`, "i"));
assert.match(css, new RegExp(`--mushaf-verse-marker-border:\\s*${mushafVerseMarkerBorder}`, "i"));
assert.match(css, new RegExp(`--mushaf-verse-marker-number:\\s*${mushafVerseMarkerNumber}`, "i"));
assert.match(css, new RegExp(`--mushaf-printed-gold:\\s*${mushafPrintedGold}`, "i"));
assert.match(css, new RegExp(`--mushaf-ink:\\s*${mushafInkPrimary}`, "i"));

assert.match(css, /--mushaf-ayah-mark-size:\s*1\.15em/);
assert.match(css, /\.nm-ayah-mark[\s\S]*?clip-path:\s*polygon/);
assert.match(css, /\.nm-ayah-mark[\s\S]*?background:\s*var\(--mushaf-verse-marker-fill\)/);
assert.match(css, /\.nm-page__ornament-frame/);
assert.match(css, /\.nm-page__fatiha-medallion/);
assert.match(page, /AuthenticWarmMushafPageFrame|AuthenticMushafPageFrame|authentic-mushaf-page-frame/);

assert.match(page, /SunnahFatihaBraidedMedallion|sunnah-fatiha-medallion/);
assert.match(page, /sunnah-baqarah-medallion/);
assert.match(page, /mushaf-header-juz/);
assert.match(page, /mushaf-header-hizb/);
assert.doesNotMatch(page, /headerSurahName|nm-page__header-surah/);

assert.match(banner, /سورة \$\{label\}/);
assert.match(css, /--mushaf-surah-frame-accent:\s*var\(--mushaf-printed-gold\)/);
assert.doesNotMatch(css, /--mushaf-surah-frame-border:\s*#1f4f3c/);

assert.doesNotMatch(css, /--mushaf-verse-marker-fill:\s*#a3864d/i);
assert.doesNotMatch(css, /--mushaf-paper-warm-yellow:\s*#fcf7ec/i);
assert.doesNotMatch(css, /--mushaf-paper-warm-yellow:\s*#f8f1d4/i);
assert.doesNotMatch(css, /\.nm-page__fatiha-medallion[\s\S]*?conic-gradient/);
assert.doesNotMatch(css, /\.nm-ayah-mark[\s\S]*?50% 2%/);
assert.match(css, /SunnahVerseRosette|فصوص ناعمة/);
assert.match(css, /\.nm-surah-banner[\s\S]*?width:\s*fit-content/);

console.log("mushaf-warm-yellow-printed-gate.test.ts: ok");
