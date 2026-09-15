/**
 * بوابة اتجاه تصفح المصحف (ورقي RTL).
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-page-direction-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const pager =
  read("src/features/mushaf-reader/useMushafPager.ts") +
  read("src/features/mushaf-reader/MushafPager.tsx");
const nav = read("src/features/mushaf-reader/MushafPageNavigation.tsx");
const readerCss = read("src/features/mushaf-reader/mushaf-reader.css");
const controls = read("src/features/mushaf-madinah/MushafControls.tsx");
const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
const reader = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");

assert.match(pager, /dx > 0/, "سحب لليمين = التالية");
assert.match(pager, /go\(page \+ 1\)|pendingCommit\.current = pageNow \+ 1/);
assert.match(pager, /go\(page - 1\)|pendingCommit\.current = pageNow - 1/);
assert.match(pager, /ArrowRight/, "سهم يمين = تالٍ");
assert.match(pager, /ArrowLeft/, "سهم يسار = سابق");
assert.match(pager, /data-pane="next"/);
assert.match(pager, /data-pane="prev"/);
assert.doesNotMatch(pager, /mm-page-edge/, "لا حواف شفافة مزدوجة في القارئ الجديد");
assert.match(pager, /dir="rtl"|translate3d/, "تقليب RTL عبر translate3d");

assert.match(nav, /MushafPageNavigation/);
assert.match(nav, /nm-page-arrow--next/);
assert.match(nav, /nm-page-arrow--prev/);
assert.match(nav, /الصفحة التالية/);
assert.match(nav, /الصفحة السابقة/);
assert.match(nav, /inline-start/);
assert.match(nav, /inline-end/);

assert.match(readerCss, /\.nm-page-arrow--next[\s\S]*inset-inline-start/);
assert.match(readerCss, /\.nm-page-arrow--prev[\s\S]*inset-inline-end/);

assert.match(controls, /onNext/);
assert.match(controls, /onPrev/);
assert.match(controls, /onGoto/);
assert.match(reader, /dir="rtl"/);
assert.match(css, /\.mm-pager-scroller|mm-page-edge--next/);
assert.doesNotMatch(pager, /rotateY|perspective\(/);

console.log("mushaf-page-direction-gate.test.ts: ok");
