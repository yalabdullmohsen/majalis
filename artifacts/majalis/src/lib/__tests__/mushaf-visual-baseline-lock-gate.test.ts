/**
 * Mushaf Visual Baseline Lock — الشكل المعتمد بعد Comfort Pass + توسيع ميدالية الفاتحة/البقرة.
 * أي إعادة تصميم بصرية للمصحف بعد هذا القفل ممنوعة دون قرار صريح جديد.
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

/** إطار الصفحة الخارجي مخفي (Comfort Pass محفوظ) */
const frameBlock = css.slice(
  css.indexOf(".nm-page__ornament-frame"),
  css.indexOf(".nm-page__ornament-frame") + 420,
);
assert.match(frameBlock, /opacity:\s*0/);
assert.match(frameBlock, /visibility:\s*hidden/);
assert.match(frameBlock, /border:\s*0/);
assert.match(page, /nm-page__ornament-frame/);

/**
 * ميدالية الفاتحة (ص1) — دائرة هندسية حقيقية (عرض = ارتفاع عبر cqmin).
 * قبل: inset نسبي على مستطيل → بيضاوي يختلف حسب الجهاز.
 */
const fatihaBlock = css.slice(
  css.indexOf(".nm-page__fatiha-medallion {"),
  css.indexOf(".nm-page__fatiha-medallion {") + 1600,
);
assert.match(fatihaBlock, /aspect-ratio:\s*1\s*\/\s*1/);
assert.match(fatihaBlock, /min\(\s*92cqw\s*,\s*86cqh\s*\)/);
assert.match(fatihaBlock, /radial-gradient\(\s*circle at center/);
assert.doesNotMatch(fatihaBlock, /inset:\s*10%\s+-7\.5%\s+14%\s+-7\.5%/);
assert.doesNotMatch(fatihaBlock, /radial-gradient\(\s*ellipse at center/);

/**
 * ميدالية البقرة (ص2) — نفس الدائرة الهندسية
 */
const baqarahBlock = css.slice(
  css.indexOf(".nm-page--lead .nm-page__fatiha-medallion"),
  css.indexOf(".nm-page--lead .nm-page__fatiha-medallion") + 280,
);
assert.match(baqarahBlock, /min\(\s*90cqw\s*,\s*84cqh\s*\)/);
assert.doesNotMatch(baqarahBlock, /inset:\s*11%\s+-7\.5%\s+15%\s+-7\.5%/);
assert.match(baqarahBlock, /opacity:\s*0\.52/);
assert.match(page, /sunnah-fatiha-medallion|SunnahFatihaBraidedMedallion/);
assert.match(page, /sunnah-baqarah-medallion|SunnahBaqarahMedallion/);

/** نقطة الحزب الذهبية تُخفى على صفحات الميدالية (افتتاح/بقرة) */
assert.match(css, /\.nm-page--opening \.nm-page__section-mark/);
assert.match(css, /\.nm-page--lead \.nm-page__section-mark/);

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
