/**
 * بوابة صفحة واحدة في الـviewport — تغطي خطأ ظهور صفحتين/قص أفقي.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-single-page-viewport-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const page = read("src/pages/quran/MushafReaderPage.tsx");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const css = read("src/features/mushaf-reader/mushaf-reader.css");
const pagerHook = read("src/features/mushaf-reader/useMushafPager.ts");
const pagerUi = read("src/features/mushaf-reader/MushafPager.tsx");
const layout = read("src/features/mushaf-reader/useStableMushafLayout.ts");
const overlay = read("src/features/mushaf-reader/AyahSelectionOverlay.tsx");
const mushafPage = read("src/features/mushaf-reader/MushafPage.tsx");

/* المسار الحقيقي يستخدم NewMushafReader */
assert.match(page, /NewMushafReader/);
assert.match(reader, /MushafPager/);
assert.doesNotMatch(page, /VerifiedMushafReader/);

/* قفل بكسل — لا transform بنسبة مئوية تعتمد على عرض المسار */
assert.match(pagerHook, /data-pager-w/);
assert.match(pagerHook, /--nm-pager-w/);
assert.match(pagerHook, /Math\.round/);
assert.match(pagerHook, /translate3d\(\$\{x\}px/);
assert.match(pagerHook, /لا resetToCurrent قبل go/);
assert.doesNotMatch(pagerHook, /translate3d\([^)]*%/);
assert.doesNotMatch(
  pagerUi,
  /style=\{\{[^}]*transform:[^}]*nm-pager-w/,
  "ممنوع inline transform يعتمد على --nm-pager-w قبل القياس",
);
assert.doesNotMatch(
  pagerUi,
  /calc\(var\(--nm-pager-w/,
  "ممنوع calc(--nm-pager-w) في JSX — النسبة تُحسب من المسار لا الشاشة",
);

/* CSS: قبل القياس 33.333%، بعد data-pager-w بالبكسل */
assert.match(css, /flex:\s*0\s+0\s+33\.333333%/);
assert.match(css, /translate3d\(-33\.333333%/);
assert.match(css, /\[data-pager-w\]/);
assert.match(css, /flex:\s*0\s+0\s+var\(--nm-pager-w\)/);
/* خاصية CSS فعلية فقط — استبعد التعليقات */
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
assert.doesNotMatch(
  cssNoComments,
  /--nm-pager-w\s*:\s*100%/,
  "ممنوع --nm-pager-w كنسبة مئوية — يكسر عرض اللوحة",
);

/* المشغّل overlay — لا يعيد قياس الصفحة */
assert.match(css, /\.nm-root\s+\.mm-audio-dock\s*\{[^}]*position:\s*fixed/s);
assert.match(css, /padding:\s*var\(--nm-top-pad\)\s+var\(--nm-side-pad\)\s+calc\(var\(--nm-bottom-pad\)\s*\+\s*16px\)/);
assert.doesNotMatch(
  cssNoComments,
  /padding:[^;{]*reader-bottom-stack/,
  "حشو الصفحة يجب ألا يعتمد على --reader-bottom-stack",
);
assert.match(layout, /bottomSafe = "0px"/);
assert.doesNotMatch(layout, /getPropertyValue\("--reader-bottom-stack"\)/);

/* تحديد آية بسقف ارتفاع — بلا مستطيلات سطرية ضخمة */
assert.match(overlay, /MAX_BAND_EM/);
assert.match(overlay, /Math\.min\(r\.height,\s*maxH\)/);

/* رقم الصفحة من بيانات المصحف */
assert.match(mushafPage, /layout\.pageNumber/);
assert.match(mushafPage, /mushaf-page-number/);

console.log("mushaf-single-page-viewport-gate.test.ts: ok");
