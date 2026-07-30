/**
 * تنقّل الرجوع الواعي بالقسم — لا قفز دائم للرئيسية عند الروابط العميقة.
 * تشغيل: npx tsx src/lib/__tests__/navigation-back.test.ts
 */
import assert from "node:assert/strict";
import { sectionAwareFallback } from "../navigation-back";

assert.equal(sectionAwareFallback("/"), "/");
assert.equal(sectionAwareFallback("/mushaf/page/12"), "/mushaf");
assert.equal(sectionAwareFallback("/quran-hub"), "/mushaf");
assert.equal(sectionAwareFallback("/quran/tajweed"), "/mushaf");
assert.equal(sectionAwareFallback("/prayer-times"), "/prayer-times");
assert.equal(sectionAwareFallback("/prayer-ranks"), "/prayer-times");
assert.equal(sectionAwareFallback("/qibla"), "/prayer-times");
assert.equal(sectionAwareFallback("/fiqh/topics/tahara"), "/fiqh");
assert.equal(sectionAwareFallback("/hadith/nawawi"), "/hadith");
assert.equal(sectionAwareFallback("/adhkar/morning"), "/adhkar");
assert.equal(sectionAwareFallback("/lessons/abc"), "/lessons");
assert.equal(sectionAwareFallback("/fawaid/curated"), "/fawaid");
assert.equal(sectionAwareFallback("/admin/users"), "/admin");
assert.equal(sectionAwareFallback("/unknown-section"), "/");

console.log("navigation-back.test.ts: ok");
