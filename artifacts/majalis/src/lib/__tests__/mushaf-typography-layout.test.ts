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

// 2) بلا space-between على السطر — نص متصل؛ أسطر بارتفاع طبيعي + فجوات موزّعة من المكوّن
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
assert.match(mushafV2, /\.mf2-lines--opening/, "فرع افتتاحي ص1–2");
assert.match(mushafV2, /\.mf2-surah-header\s*\{[\s\S]*?flex:\s*0\s+0\s+auto/, "رأس السورة بارتفاع طبيعي");
assert.match(mushafV2, /\.mf2-bismillah\s*\{[\s\S]*?font-size:\s*1em/, "البسملة بمقاس سطر الآية");
assert.match(mushafV2, /\.mf2-bismillah\s*\{[\s\S]*?font-weight:\s*700/, "البسملة بسُمك موحّد مع الفاتحة");
{
  const basmalaBlock = mushafV2.match(/(?:^|\n)\.mf2-bismillah\s*\{[^}]+\}/)?.[0] ?? "";
  assert.equal(/overflow:\s*hidden/.test(basmalaBlock), false, "البسملة بلا overflow:hidden يقصّ النص");
}
assert.match(mushafV2, /--mf2-line-sx/, "تسوية أطراف الأسطر عبر --mf2-line-sx");
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
assert.match(mushafV2, /\.mf2-surah-banner/, "شارة سورة مزخرفة");
assert.match(mushafV2, /\.mf2-surah-banner__svg/, "SVG الشارة");
assert.match(pageComp, /SurahBanner/, "مكوّن SurahBanner");
assert.match(mushafV2, /\.mf2-surah-header__name\s*\{[\s\S]*?max-width:\s*calc\(34%/, "اسم الشارة داخل اللوحة الوسطى");
assert.match(
  readFileSync(resolve(appRoot, "src/components/quran/SurahBanner.tsx"), "utf8"),
  /PANEL_MARGIN_PX|scrollWidth/,
  "تصغير اسم الشارة داخل اللوحة",
);
assert.match(
  readFileSync(resolve(appRoot, "src/components/quran/SurahBanner.tsx"), "utf8"),
  /data-ornament="wing-dense"/,
  "شارة كثيفة بلا pattern",
);
assert.match(
  readFileSync(resolve(appRoot, "src/components/quran/SurahBanner.tsx"), "utf8"),
  /PetalMedallion|ArabesqueMesh/,
  "ميدالية + شبكة أرابيسك",
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

// 3) تخطيط من أساس صفحة ٣١١ + شبكة مطلقة
assert.match(pageComp, /MUSHAF_LAYOUT_BASELINE/);
assert.match(pageComp, /MUSHAF_GRID/);
assert.match(pageComp, /LINE_HEIGHT_EM\s*=\s*MUSHAF_LAYOUT_BASELINE\.lineHeightEm/);
assert.match(pageComp, /baselinesPct|data-grid-slot|data-mushaf-grid/);
assert.match(pageComp, /isOpening/);
assert.equal(/justifyContent:\s*"space-between"/.test(pageComp), false, "بلا justifyContent space-between");
assert.match(pageComp, /pageFontSize/);
assert.match(pageComp, /ayahLineRefs/, "أسطر الآيات للتحجيم العرضي");
assert.match(pageComp, /measurement-exclusions|metric-only/, "استثناءات المقياس مفصولة عن التحجيم");
assert.equal(/SHORT_FILL_RATIO/.test(pageComp), false, "بلا SHORT_FILL_RATIO / fit لكل سطر");
assert.match(pageComp, /glyphText/, "مجسم الآية في دقة QPC");
assert.match(pageComp, /drawnSurahTitleText/, "شارة السورة بالرسم العثماني");
assert.match(pageComp, /MIN_LINE_FILL/, "حد أدنى لامتلاء عرض السطر قبل scaleX");
assert.match(pageComp, /data-mf2-bind|dataset\.mf2Bind/, "تشخيص قيد التحجيم");
assert.match(pageComp, /pageFont\.failed|useUnicodeSafe/, "تراجع تلقائي عند فشل خط QPC");

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
assert.match(
  readFileSync(resolve(appRoot, "src/components/quran/MushafPageV2.tsx"), "utf8"),
  /OPENING_BANNER_TOP_PCT\s*=\s*38/,
  "شارة الافتتاح عند ٢٨٪",
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
