/**
 * اختبارات سلامة الباحث الشرعي/المساعد — تمنع المصادر الوهمية وتُلزم الصدق عند نقص
 * المصدر، وتتحقق أن حارس الإسناد يرفض الإجابات بلا مصدر أو منخفضة الثقة.
 *
 * يُشغَّل: node lib/__tests__/researcher-safety.test.mjs
 */
import {
  buildInsufficientSourcesPayload,
  buildGroundedPayload,
  INSUFFICIENT_SOURCES_MESSAGE,
  ISLAMIC_SYSTEM_PROMPT,
} from "../islamic-answer-guardrails.mjs";

let passed = 0, failed = 0;
function assert(cond, label) {
  if (cond) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ FAIL: ${label}`); }
}

console.log("\n=== عند نقص المصدر: صدق بلا مصدر مُختلَق ===");
const insufficient = buildInsufficientSourcesPayload("ما حكم كذا؟");
const insufficientStr = JSON.stringify(insufficient);
assert(Array.isArray(insufficient.citations) && insufficient.citations.length === 0, "citations فارغة (لا استشهاد زائف)");
assert(insufficient.grounded === false && insufficient.no_evidence === true, "موسوم بعدم الإسناد صراحةً");
assert(/لم أجد|لا تكفي|مادة موثوقة|راجع/.test(insufficient.answer), "الرسالة تقرّ بنقص المصدر بوضوح");
assert(!insufficientStr.includes("الدعيع"), "لا نسبة مُختلَقة لإسلام سؤال وجواب (لا «الدعيع»)");
assert(!/trust_score/.test(insufficientStr), "لا درجات ثقة مُختلَقة");
assert(insufficientStr.includes("المنجد"), "النسبة الصحيحة لإسلام سؤال وجواب (المنجد) في المراجع");

console.log("\n=== حارس الإسناد يرفض ما لا مصدر له أو منخفض الثقة ===");
const noSource = buildGroundedPayload("ملخص", [], 0.9, "fiqh_answer");
assert(noSource.grounded === false, "إجابة بلا مصادر → غير مسنَدة (تُحوَّل لرسالة نقص المصدر)");
const lowConf = buildGroundedPayload("ملخص", [{ title: "مصدر", href: "#" }], 0.2, "fiqh_answer");
assert(lowConf.grounded === false, "ثقة منخفضة (<0.35) → غير مسنَدة");
const good = buildGroundedPayload("ملخص موثّق", [{ title: "مصدر حقيقي", href: "https://majlisilm.com" }], 0.8, "fiqh_answer");
assert(good.grounded === true && good.citations.length === 1, "إجابة مسنَدة بمصدر وثقة كافية → grounded مع الاستشهاد");
assert(typeof good.disclaimer === "string" && good.disclaimer.length > 0, "الإجابة المسنَدة تحمل تنبيهًا");

console.log("\n=== نظام المساعد لا يوجّه للتلفيق ===");
assert(!/اختلق|لفّق|من ذاكرتك بثقة/.test(ISLAMIC_SYSTEM_PROMPT), "لا توجيه للتلفيق في نظام المساعد");
assert(typeof INSUFFICIENT_SOURCES_MESSAGE === "string" && INSUFFICIENT_SOURCES_MESSAGE.length > 0, "رسالة نقص المصدر معرّفة");

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
