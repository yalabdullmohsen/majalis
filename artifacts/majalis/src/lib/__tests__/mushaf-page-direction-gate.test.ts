/**
 * بوابة اتجاه تصفح المصحف (ورقي RTL).
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-page-direction-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pager = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafPager.tsx"), "utf8");
const controls = readFileSync(resolve(root, "src/features/mushaf-madinah/MushafControls.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/features/mushaf-madinah/mushaf-madinah.css"), "utf8");
const reader = readFileSync(resolve(root, "src/features/mushaf-madinah/VerifiedMushafReader.tsx"), "utf8");

assert.match(pager, /dx > 0/, "سحب لليمين = التالية");
assert.match(pager, /go\(page \+ 1\)/);
assert.match(pager, /go\(page - 1\)/);
assert.match(pager, /ArrowRight/, "سهم يمين = تالٍ");
assert.match(pager, /ArrowLeft/, "سهم يسار = سابق");
assert.match(pager, /data-pane="next"/);
assert.match(pager, /data-pane="prev"/);
assert.match(pager, /mm-page-edge--next/);
assert.match(pager, /mm-page-edge--prev/);
assert.match(pager, /dir.*rtl|scrollLeft/, "منطق بالفهرس لا scrollLeft السالب وحده");
assert.match(controls, /onNext/);
assert.match(controls, /onPrev/);
assert.match(controls, /onGoto/);
assert.match(reader, /dir="rtl"/);
assert.match(css, /\.mm-pager-scroller|mm-page-edge--next/);
assert.doesNotMatch(pager, /rotateY|perspective\(/);

console.log("mushaf-page-direction-gate.test.ts: ok");
