/**
 * بوابات تخطيط طباعة المصحف: حشو آمن، تبرير، عدم قطع الكلمات، ارتفاع التشكيل.
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

// 1) Horizontal safe padding + box model
assert.match(mushafV2, /\.mf2-page\s*\{[\s\S]*?padding-inline:\s*max\(1rem/);
assert.match(mushafV2, /\.mf2-page\s*\{[\s\S]*?box-sizing:\s*border-box/);
assert.match(mushafV2, /\.mf2-frame\s*\{[\s\S]*?box-sizing:\s*border-box/);
assert.match(quranCss, /\.mpv-body--ayah\s*\{[\s\S]*?max\(1rem/);
assert.match(quranCss, /\.mpv-body--ayah\s*\{[\s\S]*?box-sizing:\s*border-box/);
assert.match(readerCss, /\.mushaf-v2__page\s*\{[\s\S]*?max\(1rem/);

// 2) Mushaf justification
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?justify-content:\s*space-between/);
assert.match(mushafV2, /\.mf2-line--short\s*\{[\s\S]*?justify-content:\s*center/);
assert.match(mushafV2, /\.mf2-line--short\s*\{[\s\S]*?text-align-last:\s*center/);
assert.match(quranCss, /\.qs-mushaf-body\s*\{[\s\S]*?text-align:\s*justify/);
assert.match(quranCss, /\.qs-mushaf-body\s*\{[\s\S]*?text-justify:\s*inter-word/);
assert.match(readerCss, /\.mushaf-v2__ayahs\s*\{[\s\S]*?text-align:\s*justify/);

// 3) No word truncation
assert.match(mushafV2, /\.mf2-word\s*\{[\s\S]*?word-break:\s*keep-all\s*!important/);
assert.match(quranCss, /\.qs-mushaf-body\s*\{[\s\S]*?word-break:\s*keep-all\s*!important/);
assert.match(readerCss, /\.mushaf-v2__ayah\s*\{[\s\S]*?word-break:\s*keep-all\s*!important/);
assert.match(immersiveCss, /\.immersive-quran-page__verse-text\s*\{[\s\S]*?word-break:\s*keep-all\s*!important/);

// 4) Tashkeel vertical safety
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?line-height:\s*1\.35/);
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?overflow-y:\s*visible/);
assert.match(mushafV2, /\.mf2-line--unicode[\s\S]*?line-height:\s*2\.2/, "وضع Unicode: ارتفاع تشكيل 2.2");
assert.match(mushafV2, /\.mf2-line--unicode[\s\S]*?text-align:\s*justify/, "وضع Unicode: تبرير");
assert.match(pageComp, /lineHeightAvailable\s*\*\s*0\.9/, "سقف خط يكفي لملء عرض السطر المطبوع");
assert.match(pageComp, /SHORT_FILL_RATIO\s*=\s*0\.92/, "كشف السطر القصير بنسبة امتلاء");
assert.match(pageComp, /mf2-ayah-marker/, "علامة الآية من محرف الخط");
assert.match(pageComp, /pageFont\.failed|useUnicodeSafe/, "تراجع تلقائي عند فشل خط QPC");
assert.match(readerCss, /\.mushaf-v2__ayah\s*\{[\s\S]*?line-height:\s*2\.5/);
assert.match(immersiveLib, /IMMERSIVE_LINE_HEIGHT_RATIO\s*=\s*2\.4/);
assert.match(quranCss, /\.qs-mushaf-frame--ayah[\s\S]*?max-width:\s*min\(100%,\s*56rem\)/, "حاوية المصحف max-w-4xl");

console.log("mushaf-typography-layout.test.ts: ok");
