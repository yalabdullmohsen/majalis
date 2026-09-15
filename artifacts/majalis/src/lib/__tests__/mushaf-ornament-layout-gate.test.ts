/**
 * بوابة تخطيط زخارف المصحف — دائرة الافتتاح + بلا زخارف شاردة.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-ornament-layout-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const css = read("src/features/mushaf-reader/mushaf-reader.css");
const page = read("src/features/mushaf-reader/MushafPage.tsx");

/** المسرح حاوية مقاس لحساب cqmin */
assert.match(css, /container-type:\s*size/);
assert.match(css, /container-name:\s*mushaf-page-stage/);

/** الميدالية دائرة رياضية: عرض = ارتفاع، قناع circle لا ellipse */
const medallionIdx = css.indexOf(".nm-page__fatiha-medallion {");
assert.ok(medallionIdx > 0, "قاعدة الميدالية موجودة");
const medallion = css.slice(medallionIdx, medallionIdx + 1200);
assert.match(medallion, /aspect-ratio:\s*1\s*\/\s*1/);
assert.match(medallion, /width:\s*var\(--nm-medallion-size\)/);
assert.match(medallion, /height:\s*var\(--nm-medallion-size\)/);
assert.match(medallion, /transform:\s*translate\(-50%,\s*-50%\)/);
assert.match(medallion, /border-radius:\s*50%/);
assert.match(medallion, /radial-gradient\(\s*circle at center/);
assert.doesNotMatch(medallion, /radial-gradient\(\s*ellipse/);
assert.doesNotMatch(medallion, /inset:\s*\d+%/);

/** الزخارف داخل حدود الصفحة — absolute على المسرح، بلا overflow زخرفي */
assert.match(css, /\.nm-page__stage[\s\S]{0,120}position:\s*relative/);
assert.match(medallion, /max-width:\s*100%/);
assert.match(medallion, /max-height:\s*100%/);
assert.match(medallion, /pointer-events:\s*none/);

/** إطار الصفحة الخارجي يبقى مخفيًا (Comfort Pass) — بلا تكرار زخرفة */
const frameBlock = css.slice(
  css.indexOf(".nm-page__ornament-frame"),
  css.indexOf(".nm-page__ornament-frame") + 420,
);
assert.match(frameBlock, /opacity:\s*0/);
assert.match(frameBlock, /visibility:\s*hidden/);
assert.match(frameBlock, /::before[\s\S]*?content:\s*none/);

/** لا نقطة حزب ذهبية شاردة على صفحات الميدالية */
assert.match(
  css,
  /\.nm-page--opening \.nm-page__section-mark[\s\S]{0,80}display:\s*none/,
);
assert.match(
  css,
  /\.nm-page--lead \.nm-page__section-mark[\s\S]{0,80}display:\s*none/,
);

/** الميدالية فقط على ص1/ص2 — بلا تكرار orphan */
assert.match(page, /isOpeningP1[\s\S]{0,200}nm-page__fatiha-medallion/);
assert.match(page, /isLeadP2[\s\S]{0,200}sunnah-baqarah-medallion/);
assert.doesNotMatch(page, /nm-page__fatiha-medallion[\s\S]{0,80}nm-page__fatiha-medallion/);

/** رأس الجزء/الحزب متماثل الطرفين */
assert.match(page, /nm-page__header-juz/);
assert.match(page, /nm-page__header-hizb/);
assert.match(css, /\.nm-page__header-juz[\s\S]{0,80}justify-self:\s*start/);
assert.match(css, /\.nm-page__header-hizb[\s\S]{0,80}justify-self:\s*end/);

console.log("mushaf-ornament-layout-gate.test.ts: ok");
