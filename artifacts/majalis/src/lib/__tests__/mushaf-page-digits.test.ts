/**
 * رقم صفحة المصحف: تحويل محارف مباشِر بلا فواصل locale.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-page-digits.test.ts
 */
import assert from "node:assert/strict";
import { toArabicPageDigits, toArabicIndicDigits } from "@/lib/numerals";

assert.equal(toArabicPageDigits(11), "١١");
assert.equal(toArabicPageDigits(1), "١");
assert.equal(toArabicPageDigits(604), "٦٠٤");
assert.equal(toArabicPageDigits(11.9), "١١");
assert.equal(toArabicPageDigits(Number.NaN), "٠");
assert.equal(toArabicPageDigits(-3), "٠");
assert.equal(toArabicPageDigits(11).includes("٫"), false, "بلا فاصل عشري عربي");
assert.equal(toArabicPageDigits(11).includes("."), false);
assert.equal(toArabicPageDigits(11).includes(","), false);
// تأكيد أن toLocaleString("ar-EG") لـ 1.1 ينتج الفاصل — ونحن لا نستخدمه
assert.equal((1.1).toLocaleString("ar-EG"), "١٫١");
assert.notEqual(toArabicPageDigits(11), (1.1).toLocaleString("ar-EG"));
assert.equal(toArabicIndicDigits(11), "١١");

console.log("mushaf-page-digits.test.ts: ok");
