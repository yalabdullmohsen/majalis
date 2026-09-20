/**
 * بوابة تخطيط المصحف — Content Driven Opening (بلا قوس/إطار زخرفي).
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-ornament-layout-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const css = read("src/features/mushaf-reader/mushaf-reader.css");
const chrome = read("src/styles/reader-page-chrome.css");
const page = read("src/features/mushaf-reader/MushafPage.tsx");
const engine = read("src/features/mushaf-reader/page-layout-engine.ts");
const data = read("src/lib/quran-data/qpc-page-data.ts");

/** محرك التخطيط الموحد */
assert.match(engine, /resolveSlotOrder/);
assert.match(engine, /resolveContentRowCount/);
assert.match(engine, /resolveOpeningHeaderSlots/);
assert.match(engine, /isContentPackedPage/);
assert.match(page, /resolveSlotOrder/);
assert.match(page, /--nm-content-rows/);

/** حذف نهائي للقوس/الإطار الزخرفي */
assert.doesNotMatch(page, /nm-page__ornament-frame/);
assert.doesNotMatch(page, /nm-page__fatiha-medallion/);
assert.doesNotMatch(page, /SunnahFatihaBraidedMedallion|sunnah-fatiha-medallion/);
assert.doesNotMatch(page, /sunnah-baqarah-medallion|SunnahBaqarahMedallion/);
assert.doesNotMatch(page, /AuthenticWarmMushafPageFrame/);
assert.doesNotMatch(css, /\.nm-page__ornament-frame\s*\{/);
assert.doesNotMatch(css, /\.nm-page__fatiha-medallion\s*\{/);

/** ص١–ص٢: خانات من ١ بلا فراغ علوي محجوز للزخرفة */
assert.match(data, /bannerSlot = 1/);
assert.match(chrome, /--nm-content-rows/);
assert.match(chrome, /Content Driven Layout/);
assert.match(chrome, /\.nm-page--opening \.nm-page__body[\s\S]{0,200}grid-template-rows:\s*repeat\(var\(--nm-content-rows/);

/** المسرح بلا حاوية cqmin للميدالية */
assert.doesNotMatch(css, /container-name:\s*mushaf-page-stage/);

/** رأس الجزء/الحزب متماثل الطرفين */
assert.match(page, /nm-page__header-juz/);
assert.match(page, /nm-page__header-hizb/);
assert.match(css, /\.nm-page__header-juz[\s\S]{0,80}justify-self:\s*start/);
assert.match(css, /\.nm-page__header-hizb[\s\S]{0,80}justify-self:\s*end/);

console.log("mushaf-ornament-layout-gate.test.ts: ok");
