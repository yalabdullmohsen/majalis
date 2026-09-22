/**
 * بوابة تصحيح المرجع: زهرة الآية + كارتوش مضغوط + ورق هادئ — بلا قوس فاتحة.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-reference-rosette-correction-gate.test.ts
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
} from "../../features/mushaf-reader/mushaf-warm-yellow-tokens";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/features/mushaf-reader/mushaf-reader.css"), "utf8");
const page = readFileSync(resolve(root, "src/features/mushaf-reader/MushafPage.tsx"), "utf8");
const banner = readFileSync(resolve(root, "src/features/mushaf-reader/MushafSurahBanner.tsx"), "utf8");

assert.match(css, new RegExp(`--mushaf-paper-warm-yellow:\\s*${mushafPaperWarmYellow}`, "i"));
assert.match(css, /--mushaf-verse-marker-fill:\s*var\(--mushaf-marker-background\)/);
assert.match(css, /--mushaf-verse-marker-border:\s*var\(--mushaf-marker-border\)/);
assert.match(css, /--mushaf-verse-marker-number:\s*var\(--mushaf-marker-number\)/);
assert.match(
  css,
  /\[data-mushaf-accent="gold"\][\s\S]{0,400}--mushaf-marker-background:\s*var\(--quran-gold\)/,
);
assert.equal(mushafVerseMarkerFill.toLowerCase(), mushafPrintedGold.toLowerCase());
assert.equal(mushafVerseMarkerBorder.toLowerCase(), "#b89620");
assert.equal(mushafVerseMarkerNumber.toLowerCase(), "#5f4814");
assert.match(css, /--mushaf-ayah-mark-size:\s*1\.15em/);

assert.match(css, /SunnahVerseRosette/);
assert.match(css, /\.nm-ayah-mark[\s\S]*?clip-path:\s*polygon/);
assert.doesNotMatch(css, /\.nm-ayah-mark[\s\S]*?50% 2%/);

assert.doesNotMatch(page, /SunnahFatihaBraidedMedallion|nm-page__fatiha-medallion/);
assert.doesNotMatch(css, /\.nm-page__fatiha-medallion\s*\{/);
assert.match(readFileSync(resolve(root, "src/styles/reader-page-chrome.css"), "utf8"), /Content Driven Layout/);

assert.match(banner, /SunnahSurahCartoucheCompact/);
assert.match(css, /\.nm-surah-banner[\s\S]*?width:\s*fit-content/);

assert.doesNotMatch(css, /--mushaf-paper-warm-yellow:\s*#f8f1d4/i);

console.log("mushaf-reference-rosette-correction-gate.test.ts: ok");
