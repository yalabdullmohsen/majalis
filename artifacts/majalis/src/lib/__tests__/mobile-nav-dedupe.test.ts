/**
 * بوابة دائمة: لا تنقّل مكرر على الجوال، ولا شريط متحرك مقصوص.
 *
 * تحمي ثلاث حقائق انحدرت فعليًا:
 *  ١) TopSectionBar مبنيّ من نفس BOTTOM_NAV_TABS ⇒ على الجوال هو تكرار حرفي
 *     للشريط السفلي. يجب ألّا يُرسَم هناك (لا يُخفى بـCSS — يُلغى من الشجرة).
 *  ٢) نقطة انقطاع التنقّل مصدر واحد؛ كانت ثلاث قيم متعارضة (768/879/880).
 *  ٣) ارتفاع الشريط المتحرك يُشتق من رمز واحد؛ صف بارتفاع أصغر بـoverflow
 *     hidden كان يقصّ النص رأسيًا، وقاعدة !important في theme-aliases كانت
 *     تهزم أي إصلاح في final-release.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(APP_ROOT, p), "utf8");
/** يجرّد تعليقات CSS — وإلا طابقت التوكيدات نصّ التعليق نفسه. */
const stripCssComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

const topBar = read("src/components/TopSectionBar.tsx");
const navBar = read("src/components/NavBar.tsx");
const breakpoint = read("src/lib/nav-breakpoint.ts");
const finalRelease = read("src/styles/final-release.css");
const themeAliases = read("src/styles/theme-aliases.css");
const moreSheetCss = read("src/styles/components/more-bottom-sheet.css");
void moreSheetCss;

test("TopSectionBar لا يُرسَم على مقاسات الشريط السفلي", () => {
  assert.match(topBar, /useIsMobileNav/, "TopSectionBar يقرأ نقطة الانقطاع الموحّدة");
  assert.match(
    topBar,
    /if\s*\(isMobileNav\)\s*return null/,
    "يُعاد null على الجوال — إلغاء من الشجرة لا إخفاء بـCSS",
  );
});

test("TopSectionBar ما زال حاضرًا على سطح المكتب", () => {
  assert.match(topBar, /aria-label="أقسام رئيسية"/, "الشريط باقٍ لسطح المكتب/التابلت");
  assert.doesNotMatch(
    topBar,
    /display\s*:\s*none/,
    "لا إخفاء بـinline style — الإلغاء منطقي",
  );
});

test("نقطة انقطاع التنقّل مصدر واحد ومطابقة للـCSS", () => {
  const m = breakpoint.match(/MOBILE_NAV_MAX_WIDTH\s*=\s*(\d+)/);
  assert.ok(m, "MOBILE_NAV_MAX_WIDTH معرَّف");
  const px = Number(m![1]);
  assert.equal(px, 879, "يطابق @media (max-width: 879px) الذي يُظهر الشريط السفلي");
  assert.match(
    finalRelease,
    /@media \(min-width: 880px\)[\s\S]{0,400}?\.bottom-nav[^{]*\{[^}]*display:\s*none/,
    "الشريط السفلي يُخفى فوق 879px — نفس الحد",
  );
});

test("NavBar يستهلك الخطاف الموحّد ولا يعرّف نقطة انقطاع محلية", () => {
  assert.match(navBar, /useIsMobileNav/, "NavBar يستعمل الخطاف الموحّد");
  assert.doesNotMatch(
    navBar,
    /innerWidth\s*<=\s*879/,
    "لا رقم 879 مكتوب يدويًا داخل NavBar",
  );
});

test("لا صفّا تبويبات على الجوال داخل الهيدر", () => {
  assert.doesNotMatch(navBar, /navbar-v3__tabs-row/, "لا صف تبويبات جوال في الهيدر");
  // تبويبات سطح المكتب مشروطة بـ!isMobile
  assert.match(
    navBar,
    /\{!isMobile && \(\s*<nav className="navbar-v3__tabs"/,
    "تبويبات الهيدر لسطح المكتب فقط",
  );
});

test("ارتفاع الشريط المتحرك من رمز واحد", () => {
  assert.match(finalRelease, /--ticker-h:\s*[\d.]+rem/, "الرمز --ticker-h معرَّف");
  assert.match(
    finalRelease,
    /\.header-ticker \{[\s\S]*?height:\s*var\(--ticker-h\)/,
    ".header-ticker يقرأ الارتفاع من الرمز",
  );
  assert.match(
    themeAliases,
    /\.navbar-ticker-row \.header-ticker \{\s*height:\s*var\(--ticker-h/,
    "طبقة theme-aliases بـ!important تقرأ من نفس الرمز لا من رقم صلب",
  );
  assert.doesNotMatch(
    themeAliases,
    /\.header-ticker,\s*\n\.navbar-ticker-row \.header-ticker \{\s*height:\s*2\.5rem\s*!important/,
    "لا ارتفاع صلب 2.5rem يهزم الرمز",
  );
});

test("صف الشريط لا يقصّ الشريط رأسيًا", () => {
  const rowBlock = stripCssComments(finalRelease).match(/\.navbar-ticker-row \{[^}]*\}/);
  assert.ok(rowBlock, "قاعدة .navbar-ticker-row موجودة");
  const css = rowBlock![0];
  assert.match(
    css,
    /min-height:\s*calc\(var\(--ticker-h\)/,
    "ارتفاع الصف مُشتق من ارتفاع الشريط",
  );
  assert.doesNotMatch(css, /overflow:\s*hidden/, "لا overflow:hidden يقصّ رأسيًا");
  assert.match(css, /overflow-y:\s*visible/, "التجاوز الرأسي مسموح");
});

test("شريط الأقسام المُلغى يُصفّر إزاحة sticky على الجوال", () => {
  assert.match(
    finalRelease,
    /@media \(max-width:879px\)\{[\s\S]{0,400}?--top-section-bar-h:\s*0px/,
    "‎--top-section-bar-h = 0‎ على الجوال وإلا هبطت رؤوس sticky 3.5rem",
  );
});

test("صفحة الأقسام تحجز حشواً سفلياً فوق الشريط", () => {
  const css = read("src/components/sections/section-cards.css");
  assert.match(
    css,
    /padding-bottom:\s*calc\(var\(--nav-h[^)]*\)\s*\+\s*var\(--inset-bottom[^)]*\)\s*\+\s*16px\)/,
    "حشو سفلي = شريط + safe-area + 16px",
  );
  assert.doesNotMatch(read("src/components/BottomNavBar.tsx"), /MoreBottomSheet/, "لا شيت في الشريط");
});

test("لا نص شرعي مقصوص بـellipsis في الشريط", () => {
  assert.doesNotMatch(
    finalRelease,
    /\.header-ticker__text \{[^}]*text-overflow:\s*ellipsis/,
    "نص الشريط يُعرض كاملًا عبر التمرير لا يُقصّ",
  );
});
