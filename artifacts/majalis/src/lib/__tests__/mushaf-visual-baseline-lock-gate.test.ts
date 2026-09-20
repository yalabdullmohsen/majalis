/**
 * Mushaf Visual Baseline Lock — Content Driven Opening (بلا قوس/إطار).
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-visual-baseline-lock-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mushafPaperWarmYellow } from "../../features/mushaf-reader/mushaf-warm-yellow-tokens";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/features/mushaf-reader/mushaf-reader.css"), "utf8");
const page = readFileSync(resolve(root, "src/features/mushaf-reader/MushafPage.tsx"), "utf8");

/** ورق Warm Ivory المعتمد */
assert.equal(mushafPaperWarmYellow.toLowerCase(), "#fcf6e3");
assert.match(css, /--mushaf-paper-warm-yellow:\s*#fcf6e3/i);
assert.match(css, /--mushaf-paper-reading-surface:\s*#fffbef/i);
assert.doesNotMatch(css, /--mushaf-paper-warm-yellow:\s*#ffffff/i);

/** حذف نهائي للإطار والقوس الزخرفي */
assert.doesNotMatch(page, /nm-page__ornament-frame/);
assert.doesNotMatch(page, /nm-page__fatiha-medallion|SunnahFatihaBraidedMedallion|sunnah-baqarah-medallion/);
assert.doesNotMatch(css, /\.nm-page__ornament-frame\s*\{/);
assert.doesNotMatch(css, /\.nm-page__fatiha-medallion\s*\{/);

/** Content Driven على ص١–ص٢ */
assert.match(page, /resolveSlotOrder|--nm-content-rows/);
assert.match(readFileSync(resolve(root, "src/styles/reader-page-chrome.css"), "utf8"), /Content Driven Layout|--nm-content-rows/);

/** وردة الآية — Visual Baseline مقفل عند 1.15em (زيادة إضافية تكسر ص600) */
assert.match(css, /--mushaf-ayah-mark-size:\s*1\.15em/);
assert.doesNotMatch(css, /--mushaf-ayah-mark-size:\s*0\.98em/);

/** قياسات المصحف الناجحة — لا تُمس */
assert.match(css, /--mushaf-font-size:\s*24px/);
assert.match(css, /--mushaf-line-height:\s*1\.85/);

/** رأس الجزء/الحزب يبقى */
assert.match(page, /mushaf-header-juz|nm-page__header-juz/);
assert.match(page, /mushaf-header-hizb|nm-page__header-hizb/);

console.log("mushaf-visual-baseline-lock-gate.test.ts: ok");
