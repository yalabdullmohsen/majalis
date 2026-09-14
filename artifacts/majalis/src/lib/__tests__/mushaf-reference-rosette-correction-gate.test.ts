/**
 * بوابة تصحيح المرجع: زهرة الآية + ضفيرة الفاتحة + كارتوش مضغوط + ورق هادئ.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-reference-rosette-correction-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  mushafPaperWarmYellow,
  mushafVerseMarkerFill,
  mushafVerseMarkerBorder,
  mushafVerseMarkerNumber,
} from "../../features/mushaf-reader/mushaf-warm-yellow-tokens";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/features/mushaf-reader/mushaf-reader.css"), "utf8");
const page = readFileSync(resolve(root, "src/features/mushaf-reader/MushafPage.tsx"), "utf8");
const banner = readFileSync(resolve(root, "src/features/mushaf-reader/MushafSurahBanner.tsx"), "utf8");

assert.match(css, new RegExp(`--mushaf-paper-warm-yellow:\\s*${mushafPaperWarmYellow}`, "i"));
assert.match(css, new RegExp(`--mushaf-verse-marker-fill:\\s*${mushafVerseMarkerFill}`, "i"));
assert.match(css, new RegExp(`--mushaf-verse-marker-border:\\s*${mushafVerseMarkerBorder}`, "i"));
assert.match(css, new RegExp(`--mushaf-verse-marker-number:\\s*${mushafVerseMarkerNumber}`, "i"));
assert.match(css, /--mushaf-ayah-mark-size:\s*1\.15em/);

assert.match(css, /SunnahVerseRosette/);
assert.match(css, /\.nm-ayah-mark[\s\S]*?clip-path:\s*polygon/);
assert.doesNotMatch(css, /\.nm-ayah-mark[\s\S]*?50% 2%/);

assert.match(page, /SunnahFatihaBraidedMedallion/);
assert.match(css, /SunnahFatihaBraidedMedallion|ضفيرة هندسية/);
assert.doesNotMatch(css, /\.nm-page__fatiha-medallion[\s\S]*?conic-gradient/);
assert.match(css, /\.nm-page__fatiha-medallion[\s\S]*?repeating-linear-gradient/);

assert.match(banner, /SunnahSurahCartoucheCompact/);
assert.match(css, /\.nm-surah-banner[\s\S]*?width:\s*fit-content/);

assert.doesNotMatch(css, /--mushaf-paper-warm-yellow:\s*#f8f1d4/i);

console.log("mushaf-reference-rosette-correction-gate.test.ts: ok");
