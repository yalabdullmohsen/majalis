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
const themeCss = readFileSync(resolve(appRoot, "src/app/styles/theme.css"), "utf8");

// 1) هوامش جانبية ضيّقة 2px + safe-area
assert.match(quranCss, /\.mpv-body--ayah\s*\{[\s\S]*?max\(2px,\s*var\(--inset-left\)\)/);
assert.match(quranCss, /\.mpv-body--ayah\s*\{[\s\S]*?box-sizing:\s*border-box/);
assert.equal(/4\.5vw/.test(quranCss.match(/\.mpv-body--ayah\s*\{[\s\S]*?\n\}/)?.[0] ?? ""), false, "بلا هامش 4.5vw");
assert.match(mushafV2, /\.mf2-page\s*\{[\s\S]*?box-sizing:\s*border-box/);
assert.match(readerCss, /\.mushaf-v2__page\s*\{[\s\S]*?max\(1rem/);

// 2) بلا space-between رأسي على حاوية الأسطر — نص متصل؛ أسطر بارتفاع طبيعي
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?display:\s*block|\.mf2-grid-slot--line \.mf2-line\s*\{[\s\S]*?display:\s*flex/);
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?word-spacing:\s*normal/);
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?letter-spacing:\s*0/);
assert.equal(
  /\.mf2-lines\s*\{[^}]*justify-content:\s*space-between/.test(mushafV2),
  false,
  "أُلغي space-between الرأسي من .mf2-lines",
);
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?flex:\s*0\s+0\s+auto|\.mf2-grid-slot--line \.mf2-line/, "أسطر بلا تمديد فراغات رأسية");
assert.match(mushafV2, /\.mf2-lines--qpc-contiguous/, "أسطر QPC متصلة بلا عزل bidi");
assert.match(mushafV2, /\.mf2-lines--opening/, "فرع افتتاحي ص1–2");
assert.match(mushafV2, /\.mf2-surah-header\s*\{[\s\S]*?flex:\s*0\s+0\s+auto/, "رأس السورة بارتفاع طبيعي");
assert.match(mushafV2, /\.mf2-bismillah\s*\{[\s\S]*?font-size:\s*1em/, "البسملة بمقاس سطر الآية");
assert.match(mushafV2, /\.mf2-bismillah\s*\{[\s\S]*?font-weight:\s*700/, "البسملة بسُمك موحّد مع الفاتحة");
{
  const basmalaBlock = mushafV2.match(/(?:^|\n)\.mf2-bismillah\s*\{[^}]+\}/)?.[0] ?? "";
  assert.equal(/overflow:\s*hidden/.test(basmalaBlock), false, "البسملة بلا overflow:hidden يقصّ النص");
}
assert.match(mushafV2, /justify-content:\s*space-between/, "تسوية عرض السطر عبر space-between");
assert.match(mushafV2, /\.mf2-line--surah-end/, "صنف آخر سطر سورة بلا مطّ");
assert.match(pageComp, /lastSurahEndLineNumbers|noStretchLines/, "آخر سطر سورة بلا تمديد");
assert.equal(
  /if\s*\(\s*!isOpening\s*&&\s*noStretchLines/.test(pageComp),
  false,
  "استثناء آخر سطر سورة يُطبَّق على صفحتي الافتتاح أيضًا",
);
assert.equal(
  /availableWidth\s*\/\s*0\.72/.test(pageComp),
  false,
  "بلا تقليص خانة بنسبة 0.72 لفرض الامتلاء",
);
assert.match(mushafV2, /\.mf2-surah-banner/, "شارة سورة");
assert.match(pageComp, /SurahBanner/, "مكوّن SurahBanner");
assert.match(
  readFileSync(resolve(appRoot, "src/components/quran/SurahBanner.tsx"), "utf8"),
  /data-ornament="none"/,
  "شارة بسيطة بلا زخرفة",
);
assert.match(
  readFileSync(resolve(appRoot, "src/components/quran/SurahBanner.tsx"), "utf8"),
  /data-banner-style="minimal-rule"/,
  "خطّان ذهبيان رفيعان",
);
assert.equal(
  /PetalMedallion|TwinSpirals|data-wing-part|wing-refined/.test(
    readFileSync(resolve(appRoot, "src/components/quran/SurahBanner.tsx"), "utf8"),
  ),
  false,
  "بلا جناح/ميدالية بتلات",
);
assert.equal(
  /<pattern[\s/]/i.test(readFileSync(resolve(appRoot, "src/components/quran/SurahBanner.tsx"), "utf8")),
  false,
  "ممنوع وسم pattern مكرر في الشارة",
);
const nameBlock = mushafV2.match(/\.mf2-surah-header__name\s*\{[^}]+\}/)?.[0]
  ?? mushafV2.match(/\.mf2-surah-banner__name,\s*\n\.mf2-surah-header__name\s*\{[^}]+\}/)?.[0]
  ?? "";
assert.ok(nameBlock.includes("inherit,"), "اسم الشارة يرث خط/حجم الصفحة مع احتياطي قرآن");
assert.match(mushafV2, /\.mf2-word--ayah-end\s*\{[\s\S]*?mushaf-gold-strong/, "مجسم الآية بلون ذهبي");
assert.equal(/\bAyahMarker\b/.test(pageComp), false, "بلا مكوّن AyahMarker يستبدل المجسم");
assert.equal(/from ["']@\/components\/quran\/AyahMarker["']/.test(pageComp), false);
assert.match(pageComp, /glyphText/, "مجسم نهاية الآية من خط QPC");
assert.match(pageComp, /data-ayah-numeral="qpc"/, "علامة رقم QPC");
assert.match(pageComp, /sizingEls|sizing-line|ayahLineCount|ayahLineRefs/, "تحجيم من أعرض سطر");
assert.match(pageComp, /MUSHAF_LAYOUT_BASELINE|MUSHAF_GRID/, "تخطيط من أساس ٣١١ + شبكة");
assert.match(mushafV2, /data-ornament|mf2-surah-banner/, "شارة سورة");
assert.match(pageComp, /SurahBanner/, "مكوّن SurahBanner");
assert.equal(
  /flex:\s*1\s+1\s+0/.test(mushafV2.match(/\.mf2-line\s*\{[\s\S]*?\n\}/)?.[0] ?? ""),
  false,
  "أسطر الآيات بلا flex:1 1 0 يمدّد الفراغ بين الأسطر",
);

// 3) تخطيط تدفق ١٥ صفًا + حجم ثابت من baseline
assert.match(pageComp, /MUSHAF_LAYOUT_BASELINE/);
assert.match(pageComp, /MUSHAF_GRID/);
assert.match(pageComp, /LINE_HEIGHT_EM\s*=\s*MUSHAF_LAYOUT_BASELINE\.lineHeightEm/);
assert.match(pageComp, /data-mushaf-grid="flow"/);
assert.match(pageComp, /data-board="1000x1618"/);
assert.match(pageComp, /MUSHAF_LAYOUT_BASELINE\.fontSizePx/);
assert.match(pageComp, /isOpening/);
assert.match(pageComp, /justifyContent\s*=\s*["']space-between["']/, "توزيع مسافات أفقي بين الكلمات");
assert.match(pageComp, /pageFontSize/);
assert.match(pageComp, /ayahLineRefs/, "أسطر الآيات للتحجيم العرضي");
assert.match(pageComp, /measurement-exclusions|metric-only/, "استثناءات المقياس مفصولة عن التحجيم");
assert.equal(/SHORT_FILL_RATIO/.test(pageComp), false, "بلا SHORT_FILL_RATIO / fit لكل سطر");
assert.match(pageComp, /glyphText/, "مجسم الآية في دقة QPC");
assert.match(pageComp, /drawnSurahTitleText/, "شارة السورة بالرسم العثماني");
assert.match(pageComp, /--mf2-line-sx|mf2-line-sx/, "ضغط أفقي اختياري عند تجاوز العمود بلا تغيير S");
assert.match(mushafV2, /scaleX\(var\(--mf2-line-sx/, "scaleX مشروط عبر --mf2-line-sx");
assert.match(pageComp, /data-mf2-bind|dataset\.mf2Bind|flow-grid-fixed-S/, "تشخيص قيد التحجيم");
assert.match(pageComp, /pageFont\.failed|useUnicodeSafe/, "انتظار خط QPC بلا fallback نظام");
assert.equal(/OPENING_BANNER_TOP_PCT/.test(pageComp), false, "بلا OPENING_BANNER_TOP_PCT");
assert.equal(
  /position:\s*["']absolute["']/.test(pageComp.match(/const slotStyle[\s\S]*?return \{[\s\S]*?\};/)?.[0] || ""),
  false,
  "خانات بلا position absolute",
);

// 4) رموز الألوان المرجعية
assert.match(themeCss, /--color-mushaf-bg:\s*#FCF8F1/);
assert.match(themeCss, /--color-mushaf-gold:\s*#B08D57/);
assert.match(themeCss, /--color-mushaf-numeral:\s*#6B4E2A/);
assert.match(themeCss, /--color-mushaf-panel:\s*#FAF3E8/);
assert.match(immersiveLib, /AYAH_MUSHAF_PAPER_BG\s*=\s*"#FCF8F1"/);

// 5) line-height عبر --mf2-lh
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?line-height:\s*normal/);
assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?overflow:\s*visible/);
assert.equal(
  /^\s*overflow-x:\s*hidden/m.test(
    mushafV2.match(/\.mf2-line\s*\{[^}]+\}/)?.[0] ?? "",
  ),
  false,
  "ممنوع overflow-x المخفي على .mf2-line (يقصّ الحبر رأسيًا قسرًا)",
);
assert.equal(
  /\.mf2-opening-frame/.test(mushafV2) &&
    /OpeningPageFrame/.test(
      readFileSync(resolve(appRoot, "src/components/quran/MushafPageV2.tsx"), "utf8"),
    ),
  false,
  "لا إطار زخرفي مفعّل لصفحتي الافتتاح",
);
assert.equal(
  /OPENING_BANNER_TOP_PCT/.test(
    readFileSync(resolve(appRoot, "src/components/quran/MushafPageV2.tsx"), "utf8"),
  ),
  false,
  "بلا نسبة شارة افتتاح مطلقة — نفس شبكة التدفق",
);
assert.match(mushafV2, /\.mf2-line--unicode[\s\S]*?line-height:\s*2\.2/, "وضع Unicode: ارتفاع تشكيل 2.2");

assert.match(quranCss, /\.quran-shell--ayah\s+\.qs-mushaf-body\s+\.qs-mushaf-body-inner\s*\{[\s\S]*?aspect-ratio:\s*auto/);
assert.match(quranCss, /\.quran-shell--ayah\s+\.qs-mushaf-body\s+\.qs-mushaf-body-inner\s*\{[\s\S]*?height:\s*100%/);
assert.match(quranCss, /\.quran-shell--ayah\s+\.mf2-lines\s*\{[\s\S]*?height:\s*100%/);
assert.equal(/mpv-fill-enter/.test(quranCss), false, "أُزيلت أزرار وضع الامتلاء المنفصل");

assert.match(quranCss, /\.qs-mushaf-body\s*\{[\s\S]*?text-align:\s*justify/);
assert.match(readerCss, /\.mushaf-v2__ayah\s*\{[\s\S]*?word-break:\s*keep-all\s*!important/);
assert.match(immersiveCss, /\.immersive-quran-page__verse-text\s*\{[\s\S]*?word-break:\s*keep-all\s*!important/);
assert.match(mushafV2, /\.mf2-word\s*\{[\s\S]*?word-break:\s*keep-all\s*!important/);
assert.match(readerCss, /\.mushaf-v2__ayah\s*\{[\s\S]*?line-height:\s*2\.5/);
assert.match(immersiveLib, /IMMERSIVE_LINE_HEIGHT_RATIO\s*=\s*2\.4/);

console.log("mushaf-typography-layout.test.ts: ok");
