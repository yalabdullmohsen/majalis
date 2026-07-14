/**
 * اختبار وحدة — تحميل lib/api-handlers/search.js دون خطأ
 *
 * يمنع رجوع عطل حقيقي وقع في الإنتاج: character class عربي بترتيب مدى
 * غير صحيح (SyntaxError: Range out of order in character class) كان يمنع
 * تحميل الموديول بالكامل فيُعيد /api/search دائمًا HTTP 500.
 *
 * تُشغَّل عبر: node lib/__tests__/search-normalize.test.mjs
 */

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

console.log("\n=== تحميل search.js بلا SyntaxError ===");

let mod = null;
let loadError = null;
try {
  mod = await import("../api-handlers/search.js");
} catch (e) {
  loadError = e;
}

assert(loadError === null, `الموديول يُحمَّل بلا خطأ${loadError ? ": " + loadError.message : ""}`);
assert(typeof mod?.default === "function", "handler الافتراضي دالة صحيحة");

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
