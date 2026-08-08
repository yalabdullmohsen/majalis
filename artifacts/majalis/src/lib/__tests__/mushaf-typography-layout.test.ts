/**
 * بوابات تخطيط طباعة المصحف: نص متصل، حجم موحّد، كثافة رأسية، هوامش ضيقة.
 * تشغيل: npx tsx src/lib/__tests__/mushaf-typography-layout.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const mushafV2 = readFileSync(resolve(appRoot, "src/styles/mushaf-v2.css"), "utf8");
const quranCss = readFileSync(resolve(appRoot, "src/styles/quran.css"), "utf8");
const readerCss = readFileSync(resolve(appRoot, "src/styles/pages/mushaf-reader.css"), "utf8");
const immersiveCss = readFileSync(resolve(appRoot, "src/styles/quran-immersive-reader.css"), "utf8");
const pageComp = readFileSync(resolve(appRoot, "src/components/quran/MushafPageV2.tsx"), "utf8");
const immersiveLib = readFileSync(resolve(appRoot, "src/lib/quran-immersive.ts"), "utf8");

// 1) هوامش جانبية ضيقة (8–12px) مع safe-area
assert.match(quranCss, /\.mpv-body--ayah\s*\{[\s\S]*?max\(8px/);
assert.match(quranCss, /\.mpv-body--ayah\s*\{[\s\S]*?box-sizing:\s*border-box/);
assert.match(mushafV2, /\.mf2-page\s*\{[\s\S]*?box-sizing:\s*border-box/);
assert.match(readerCss, /\.mushaf-v2__page\s*\{[\s\S]*?max\(1rem/);

// 2) بلا space-between — نص متصل + word/letter-spacing طبيعي
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?display:\s*block/);
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?word-spacing:\s*normal/);
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?letter-spacing:\s*0/);
assert.equal(
  /\.mf2-line\s*\{[\s\S]*?justify-content:\s*space-between/.test(mushafV2),
  false,
  "أُلغي space-between من .mf2-line",
);
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?flex:\s*1\s+1\s+0/, "15 خانة متساوية تملأ الارتفاع");
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?justify-content:\s*flex-start/, "بلا space-between أفقيًا");

// 3) حجم موحّد للصفحة — لا fit سطر-بسطر
assert.match(pageComp, /LINE_HEIGHT_EM\s*=\s*1\.1/);
assert.match(pageComp, /sizeByWidth/);
assert.match(pageComp, /sizeByHeight/);
assert.match(pageComp, /pageFontSize/);
assert.equal(/SHORT_FILL_RATIO/.test(pageComp), false, "بلا SHORT_FILL_RATIO / fit لكل سطر");
assert.match(pageComp, /mf2-ayah-marker/, "علامة الآية من محرف الخط");
assert.match(pageComp, /pageFont\.failed|useUnicodeSafe/, "تراجع تلقائي عند فشل خط QPC");

// 4) line-height ضمن 1.0–1.15 عبر --mf2-lh
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?line-height:\s*var\(--mf2-lh/);
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?overflow-y:\s*visible/);
assert.match(mushafV2, /\.mf2-line--unicode[\s\S]*?line-height:\s*2\.2/, "وضع Unicode: ارتفاع تشكيل 2.2");

// 5) كتلة الأسطر تملأ المساحة — بلا قيد 83vh / نسبة 0.72 على مسار آية
assert.match(quranCss, /\.quran-shell--ayah\s+\.qs-mushaf-body\s+\.qs-mushaf-body-inner\s*\{[\s\S]*?aspect-ratio:\s*auto/);
assert.match(quranCss, /\.quran-shell--ayah\s+\.qs-mushaf-body\s+\.qs-mushaf-body-inner\s*\{[\s\S]*?height:\s*100%/);
assert.equal(/mpv-fill-enter/.test(quranCss), false, "أُزيلت أزرار وضع الامتلاء المنفصل");

assert.match(quranCss, /\.qs-mushaf-body\s*\{[\s\S]*?text-align:\s*justify/);
assert.match(readerCss, /\.mushaf-v2__ayah\s*\{[\s\S]*?word-break:\s*keep-all\s*!important/);
assert.match(immersiveCss, /\.immersive-quran-page__verse-text\s*\{[\s\S]*?word-break:\s*keep-all\s*!important/);
assert.match(mushafV2, /\.mf2-word\s*\{[\s\S]*?word-break:\s*keep-all\s*!important/);
assert.match(readerCss, /\.mushaf-v2__ayah\s*\{[\s\S]*?line-height:\s*2\.5/);
assert.match(immersiveLib, /IMMERSIVE_LINE_HEIGHT_RATIO\s*=\s*2\.4/);

console.log("mushaf-typography-layout.test.ts: ok");
