/**
 * مكتبة المؤذنين — محلي + بث، ودعم سلسلة iOS.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-muezzin-library.test.ts
 */
import assert from "node:assert/strict";
import {
  clampSelectableMuezzinId,
  listSelectableMuezzins,
  muezzinSupportsIosChaining,
} from "../adhan-muezzin-library";
import { recordingSupportsIosChainedSegments } from "../adhan-ios-segments";

const list = listSelectableMuezzins();
assert.ok(list.length >= 7, "قائمة المؤذنين");
assert.ok(list.some((m) => m.id === "makkah" && m.bundled));
assert.ok(list.some((m) => m.id === "aqsa" && m.bundled));
assert.ok(list.some((m) => m.id === "abdulbasit" && !m.bundled));
assert.equal(clampSelectableMuezzinId("madinah"), "makkah");
assert.equal(muezzinSupportsIosChaining("makkah"), true);
assert.equal(muezzinSupportsIosChaining("aqsa"), false);
assert.equal(recordingSupportsIosChainedSegments("alharam"), true);

console.log("adhan-muezzin-library.test.ts: ok");
