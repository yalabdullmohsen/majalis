import assert from "node:assert/strict";
import {
  looksLikePersonSpeaker,
  resolveSafeSpeaker,
  dedupeLessonTitleSegments,
} from "../lesson-speaker-guard.ts";

assert.equal(looksLikePersonSpeaker("الطهارة"), false);
assert.equal(looksLikePersonSpeaker("18 مجلساً"), false);
assert.equal(looksLikePersonSpeaker("علوم القرآن"), false);
assert.equal(looksLikePersonSpeaker("متاح 24 ساعة"), false);
assert.equal(looksLikePersonSpeaker("سالم بن سعد الطويل"), true);
assert.equal(resolveSafeSpeaker("الطهارة", "يوسف بن أحمد القاسم"), "يوسف بن أحمد القاسم");
assert.equal(
  dedupeLessonTitleSegments("المجلس الثالث عشر — المجلس الثالث عشر"),
  "المجلس الثالث عشر",
);
console.log("lesson-speaker-guard: ok");
