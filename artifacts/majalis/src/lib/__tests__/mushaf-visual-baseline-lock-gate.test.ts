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
 * ميدالية الفاتحة (ص1) — قبل: 2.2% 10% 18% (~80%×79.8%)
 * بعد القفل: 0.5% 1.5% 4% (~97%×95.5%) ≈ +12–13%
 */
const fatihaBlock = css.slice(
  css.indexOf(".nm-page__fatiha-medallion {"),
  css.indexOf(".nm-page__fatiha-medallion {") + 520,
);
assert.match(fatihaBlock, /inset:\s*0\.5%\s+1\.5%\s+4%/);
assert.doesNotMatch(fatihaBlock, /inset:\s*1\.2%\s+5%\s+11%/);

/**
 * ميدالية البقرة (ص2) — قبل: 3% 11% 22% (~78%×75%)
 * بعد القفل: 0.9% 1.5% 6% (~97%×93.1%) ≈ +11–12%
 */
const baqarahBlock = css.slice(
  css.indexOf(".nm-page--lead .nm-page__fatiha-medallion"),
  css.indexOf(".nm-page--lead .nm-page__fatiha-medallion") + 280,
);
assert.match(baqarahBlock, /inset:\s*0\.9%\s+1\.5%\s+6%/);
assert.doesNotMatch(baqarahBlock, /inset:\s*1\.8%\s+6\.5%\s+15%/);
assert.match(page, /sunnah-fatiha-medallion|SunnahFatihaBraidedMedallion/);
assert.match(page, /sunnah-baqarah-medallion|SunnahBaqarahMedallion/);

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
