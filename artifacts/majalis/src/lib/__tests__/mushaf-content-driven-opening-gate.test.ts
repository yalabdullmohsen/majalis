/**
 * بوابة Page Layout Engine — Content Driven Opening.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-content-driven-opening-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isContentPackedPage,
  resolveContentRowCount,
  resolveOpeningHeaderSlots,
  resolveSlotOrder,
} from "../../features/mushaf-reader/page-layout-engine";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.equal(isContentPackedPage("opening"), true);
assert.equal(isContentPackedPage("lead"), true);
assert.equal(isContentPackedPage("normal"), false);
assert.equal(isContentPackedPage("surah-start"), false);

assert.deepEqual(resolveOpeningHeaderSlots(true), {
  bannerSlot: 1,
  basmalaSlot: 2,
  lineStartSlot: 3,
});
assert.deepEqual(resolveOpeningHeaderSlots(false), {
  bannerSlot: 1,
  basmalaSlot: null,
  lineStartSlot: 2,
});

assert.deepEqual(resolveSlotOrder("opening", [1, 3, 5, 7]), [1, 3, 5, 7]);
assert.deepEqual(resolveSlotOrder("lead", [2, 4]), [2, 4]);
assert.deepEqual(resolveSlotOrder("normal", [1, 2]), [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
]);
assert.equal(resolveContentRowCount([1, 2, 3, 4, 5, 6, 7]), 7);

const data = read("src/lib/quran-data/qpc-page-data.ts");
const page = read("src/features/mushaf-reader/MushafPage.tsx");
const css = read("src/features/mushaf-reader/mushaf-reader.css");
const chrome = read("src/styles/reader-page-chrome.css");
const slots = read("scripts/mushaf-madinah/slot-layout.mjs");

assert.match(data, /bannerSlot = 1/);
assert.match(data, /basmalaSlot = 2/);
assert.match(data, /startSlot = headers\[0\]\?\.basmalaSlot != null \? 3 : 2/);
assert.match(slots, /bannerSlot = 1/);
assert.match(page, /resolveSlotOrder|page-layout-engine/);
assert.match(page, /--nm-content-rows/);
assert.doesNotMatch(page, /nm-page__fatiha-medallion|nm-page__ornament-frame/);
assert.doesNotMatch(css, /\.nm-page__fatiha-medallion\s*\{|\.nm-page__ornament-frame\s*\{/);
assert.match(chrome, /grid-template-rows:\s*repeat\(var\(--nm-content-rows/);

console.log("mushaf-content-driven-opening-gate.test.ts: ok");
