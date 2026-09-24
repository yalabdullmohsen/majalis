/**
 * بوابة Comfort Pass: وردة أوضح + ورق أفتح + بلا إطار/قوس زخرفي.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-visual-comfort-pass-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mushafPaperWarmYellow } from "../../features/mushaf-reader/mushaf-warm-yellow-tokens";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/features/mushaf-reader/mushaf-reader.css"), "utf8");
const page = readFileSync(resolve(root, "src/features/mushaf-reader/MushafPage.tsx"), "utf8");

assert.equal(mushafPaperWarmYellow.toLowerCase(), "#fffcf7");
assert.match(css, /--mushaf-paper-warm-yellow:\s*#fffcf7/i);
assert.match(css, /--mushaf-paper-reading-surface:\s*#fffcf7/i);
assert.match(css, /--mushaf-ayah-mark-size:\s*1\.15em/);
assert.doesNotMatch(css, /--mushaf-ayah-mark-size:\s*0\.98em/);

assert.doesNotMatch(page, /nm-page__ornament-frame/);
assert.doesNotMatch(page, /nm-page__fatiha-medallion|SunnahFatihaBraidedMedallion/);
assert.doesNotMatch(css, /\.nm-page__ornament-frame\s*\{/);
assert.doesNotMatch(css, /\.nm-page__fatiha-medallion\s*\{/);
assert.match(css, /\.nm-ayah-mark\s*\{/);
assert.match(css, /\.nm-surah-banner/);
assert.doesNotMatch(css, /--mushaf-paper-warm-yellow:\s*#ffffff/i);
assert.match(css, /--mushaf-font-size:\s*24px/);
assert.match(css, /--mushaf-line-height:\s*1\.85/);

console.log("mushaf-visual-comfort-pass-gate.test.ts: ok");
