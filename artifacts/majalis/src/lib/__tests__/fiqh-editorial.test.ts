/**
 * اختبار طبقة العرض التحريرية للفقه.
 * تشغيل: node --import tsx src/lib/__tests__/fiqh-editorial.test.ts
 */
import assert from "node:assert/strict";
import { fiqhBookEditorial, stripLeadingTitle } from "../fiqh-editorial";
import { publishedBooks } from "../fiqh-books";

console.log("\n=== fiqh-editorial ===");

assert.equal(
  stripLeadingTitle("باب المياه بابٌ من أبواب الطهارة", "باب المياه"),
  "بابٌ من أبواب الطهارة",
);
assert.equal(stripLeadingTitle("مقدمة موجزة دون تكرار", "باب الصلاة"), "مقدمة موجزة دون تكرار");
assert.equal(stripLeadingTitle("باب الصلاة: أحكامها", "باب الصلاة"), "أحكامها");

const book = publishedBooks()[0];
assert.ok(book, "يوجد كتاب فقه منشور");
const editorial = fiqhBookEditorial(book);
assert.ok(editorial.description.trim().length > 0, "وصف تحريري غير فارغ");
assert.notEqual(editorial.description.trim(), book.title.trim(), "الوصف ≠ العنوان كاملًا");
assert.ok(
  !editorial.description.trim().startsWith(book.title.trim()),
  "الوصف لا يبدأ بالعنوان الكامل",
);

console.log("  ✓ stripLeadingTitle");
console.log("  ✓ fiqhBookEditorial description ≠ title");
console.log("fiqh-editorial.test.ts: ok");
