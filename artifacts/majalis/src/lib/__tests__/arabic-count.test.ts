/**
 * جمع عربي للمسائل والأبواب — يمنع «1 مسائل».
 * node --import tsx src/lib/__tests__/arabic-count.test.ts
 */
import assert from "node:assert/strict";
import { formatAbwabCount, formatMasailCount } from "../arabic-count";

assert.equal(formatMasailCount(0), "لا مسائل");
assert.equal(formatMasailCount(1), "مسألة");
assert.equal(formatMasailCount(2), "مسألتان");
assert.equal(formatMasailCount(3), "3 مسائل");
assert.equal(formatMasailCount(10), "10 مسائل");
assert.equal(formatMasailCount(11), "11 مسألة");
assert.equal(formatMasailCount(25), "25 مسألة");

assert.equal(formatAbwabCount(0), "لا أبواب");
assert.equal(formatAbwabCount(1), "باب");
assert.equal(formatAbwabCount(2), "بابان");
assert.equal(formatAbwabCount(5), "5 أبواب");
assert.equal(formatAbwabCount(12), "12 باباً");

assert.notEqual(formatMasailCount(1), "1 مسائل");
assert.ok(!`${formatMasailCount(1)}`.includes("1 مسائل"));

console.log("arabic-count.test.ts: ok");
