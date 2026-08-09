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

// 1) هوامش جانبية ضيّقة 3px + safe-area (--inset-*)
assert.match(quranCss, /\.mpv-body--ayah\s*\{[\s\S]*?max\(2px,\s*var\(--inset-left\)\)/);
assert.match(quranCss, /\.mpv-body--ayah\s*\{[\s\S]*?box-sizing:\s*border-box/);
assert.equal(/4\.5vw/.test(quranCss.match(/\.mpv-body--ayah\s*\{[\s\S]*?\n\}/)?.[0] ?? ""), false, "بلا هامش 4.5vw");
assert.match(mushafV2, /\.mf2-page\s*\{[\s\S]*?box-sizing:\s*border-box/);
assert.match(readerCss, /\.mushaf-v2__page\s*\{[\s\S]*?max\(1rem/);

// 2) بلا space-between — نص متصل؛ أسطر بارتفاع طبيعي + تمركز رأسي للكتلة
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?display:\s*block/);
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?word-spacing:\s*normal/);
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?letter-spacing:\s*0/);
assert.equal(
  /\.mf2-line\s*\{[\s\S]*?justify-content:\s*space-between/.test(mushafV2),
  false,
  "أُلغي space-between من .mf2-line",
);
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?flex:\s*0\s+0\s+auto/, "أسطر بارتفاع طبيعي بلا تمديد فراغات");
assert.match(mushafV2, /\.mf2-lines--qpc-contiguous/, "أسطر QPC متصلة بلا عزل bidi");
assert.match(mushafV2, /\.mf2-lines\s*\{[\s\S]*?justify-content:\s*center/, "تمركز رأسي — الفراغ فوق/تحت الكتلة");
assert.match(mushafV2, /\.mf2-lines\s*\{[\s\S]*?flex:\s*1\s+1\s+auto/, "حاوية الأسطر تملأ الارتفاع");
assert.match(mushafV2, /\.mf2-surah-header\s*\{[\s\S]*?flex:\s*0\s+0\s+auto/, "رأس السورة بارتفاع طبيعي");
assert.match(mushafV2, /\.mf2-bismillah\s*\{[\s\S]*?font-size:\s*0\.82em/, "البسملة الافتتاحية أخف من الآيات");
assert.equal(
  /\.mf2-bismillah\s*\{[\s\S]*?overflow:\s*hidden/.test(mushafV2),
  false,
  "البسملة بلا overflow:hidden يقصّ النص",
);
assert.equal(
  /\.mf2-lines--opening-centered/.test(mushafV2),
  false,
  "أُزيل فرع opening-centered — منطق موحّد مع ص3",
);
assert.match(
  mushafV2,
  /--mf2-line-sx/,
  "تسوية أطراف الأسطر عبر --mf2-line-sx",
);
assert.match(pageComp, /lastSurahEndLineNumbers|noStretchLines/, "آخر سطر سورة بلا تمديد");
assert.equal(
  /availableWidth\s*\/\s*0\.72/.test(pageComp),
  false,
  "بلا تقليص خانة بنسبة 0.72 لفرض الامتلاء",
);
assert.equal(
  /opening-centered/.test(pageComp),
  false,
  "مكوّن الصفحة بلا opening-centered",
);
assert.match(mushafV2, /\.mf2-surah-badge/, "شارة سورة بسيطة");
assert.match(mushafV2, /\.mf2-surah-badge__bar/, "شريط شارة بإطار");
assert.equal(/mf2-surah-badge__end/.test(mushafV2), false, "بلا زخرفة طرفية في الشارة");
assert.equal(/mf2-surah-badge__mid/.test(mushafV2), false, "بلا لوحة وسطى منفصلة");
assert.match(
  mushafV2,
  /\.mf2-surah-header__frame\s*\{[\s\S]*?1\.6em/,
  "ارتفاع الشارة ≈ 1.6× ارتفاع سطر",
);
assert.match(mushafV2, /\.mf2-surah-header__name\s*\{[\s\S]*?overflow:\s*visible/, "تشكيل الاسم غير مقصوص");
const nameBlock = mushafV2.match(/\.mf2-surah-header__name\s*\{[^}]+\}/)?.[0] ?? "";
assert.ok(nameBlock.includes("inherit,"), "اسم الشارة يرث خط/حجم الصفحة مع احتياطي قرآن");
assert.match(mushafV2, /\.mf2-ayah-marker\s*\{[\s\S]*?1\.15em/, "قطر علامة الآية 1.15em");
assert.match(pageComp, /MushafSurahBadgeFrame/);
assert.match(pageComp, /sizingEls|sizing-line|ayahLineCount/, "تحجيم من أعرض سطر + عدد الأسطر الفعلي");
assert.match(
  pageComp,
  /TARGET_BLOCK_FILL/,
  "امتلاء كتلة الأسطر بتقليص ارتفاع الحاوية — منطق موحّد",
);
assert.equal(
  /flex:\s*1\s+1\s+0/.test(mushafV2.match(/\.mf2-line\s*\{[\s\S]*?\n\}/)?.[0] ?? ""),
  false,
  "أسطر الآيات بلا flex:1 1 0 يمدّد الفراغ بين الأسطر",
);

// 3) حجم موحّد من أعرض سطر آيات — لا fit سطر-بسطر ولا measurementExclusions
assert.match(pageComp, /LINE_HEIGHT_EM\s*=\s*1\.05/);
assert.match(pageComp, /TARGET_BLOCK_FILL\s*=\s*0\.92/);
assert.match(pageComp, /EDGE_GAP_PX\s*=\s*8/);
assert.match(pageComp, /LH_CAP\s*=\s*1\.6/);
assert.equal(/openingFewLines/.test(pageComp), false, "بلا فرع خاص لصفحتي الافتتاح");
assert.match(pageComp, /sizeByWidth/);
assert.match(pageComp, /sizeByHeight/);
assert.match(pageComp, /pageFontSize/);
assert.match(pageComp, /ayahLineRefs/, "أسطر الآيات للتحجيم العرضي");
assert.match(pageComp, /measurement-exclusions|metric-only/, "استثناءات المقياس مفصولة عن التحجيم");
assert.equal(/SHORT_FILL_RATIO/.test(pageComp), false, "بلا SHORT_FILL_RATIO / fit لكل سطر");
assert.match(pageComp, /glyphText/, "علامة الآية في دقة QPC من محارف خط الصفحة");
assert.match(pageComp, /mf2-ayah-marker/, "علامة آية SVG للوضع Unicode/خفيف");
assert.match(pageComp, /MushafAyahMarkerSvg/);
assert.match(pageComp, /drawnSurahTitleText/, "شارة السورة بالرسم العثماني");
assert.match(pageComp, /TARGET_BLOCK_FILL/, "هدف امتلاء صندوق الأسطر 0.92 مع سقف LH");
assert.match(pageComp, /MIN_LINE_FILL/, "حد أدنى لامتلاء عرض السطر قبل scaleX (≤2%)");
assert.equal(/EQUALIZE_PAGE_DEV_GATE/.test(pageComp), false, "تسوية دائمة لكل الأسطر دون بوابة ص1–2");
assert.match(pageComp, /data-mf2-bind|dataset\.mf2Bind/, "تشخيص قيد التحجيم");
assert.match(pageComp, /pageFont\.failed|useUnicodeSafe/, "تراجع تلقائي عند فشل خط QPC");

// 4) line-height ضمن 1.0–1.15 عبر --mf2-lh
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?line-height:\s*var\(--mf2-lh/);
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?overflow-y:\s*visible/);
assert.match(mushafV2, /\.mf2-line--unicode[\s\S]*?line-height:\s*2\.2/, "وضع Unicode: ارتفاع تشكيل 2.2");

// 5) خانة آية 100% + كتلة أسطر محتضَنة مثبتة أعلى الفجوة (بلا تمركز يضخّم الفراغ العلوي)
assert.match(quranCss, /\.quran-shell--ayah\s+\.qs-mushaf-body\s+\.qs-mushaf-body-inner\s*\{[\s\S]*?aspect-ratio:\s*auto/);
assert.match(quranCss, /\.quran-shell--ayah\s+\.qs-mushaf-body\s+\.qs-mushaf-body-inner\s*\{[\s\S]*?height:\s*100%/);
assert.match(quranCss, /\.quran-shell--ayah\s+\.mf2-lines\s*\{[\s\S]*?height:\s*auto/);
assert.match(quranCss, /\.quran-shell--ayah\s+\.mfl-visual\s*\{[\s\S]*?justify-content:\s*flex-start/);
assert.equal(/mpv-fill-enter/.test(quranCss), false, "أُزيلت أزرار وضع الامتلاء المنفصل");

assert.match(quranCss, /\.qs-mushaf-body\s*\{[\s\S]*?text-align:\s*justify/);
assert.match(readerCss, /\.mushaf-v2__ayah\s*\{[\s\S]*?word-break:\s*keep-all\s*!important/);
assert.match(immersiveCss, /\.immersive-quran-page__verse-text\s*\{[\s\S]*?word-break:\s*keep-all\s*!important/);
assert.match(mushafV2, /\.mf2-word\s*\{[\s\S]*?word-break:\s*keep-all\s*!important/);
assert.match(readerCss, /\.mushaf-v2__ayah\s*\{[\s\S]*?line-height:\s*2\.5/);
assert.match(immersiveLib, /IMMERSIVE_LINE_HEIGHT_RATIO\s*=\s*2\.4/);

console.log("mushaf-typography-layout.test.ts: ok");
