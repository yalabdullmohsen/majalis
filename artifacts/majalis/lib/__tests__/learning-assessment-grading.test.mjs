/**
 * اختبار وحدة لمنطق تصحيح التقييمات (isAnswerCorrect) في
 * lib/api-handlers/learning-assessment.js — بلا قاعدة بيانات ولا شبكة ولا
 * جلسة مستخدم حقيقية.
 *
 * لماذا هذا الاختبار تحديدًا: اختبار طرف-لطرف حقيقي (تسجيل دخول فعلي في
 * المتصفح وأداء تقييم "اختبر نفسك: الأصول الثلاثة" المزروع في الإنتاج) غير
 * ممكن في هذه البيئة المعزولة بلا بيانات اعتماد مستخدم اختبار حقيقية، ولا
 * ينبغي اختلاقها. هذا الاختبار يغطي بدلاً من ذلك الدالة الحرجة أمنيًا نفسها
 * (المقارنة الفعلية بين إجابة المستخدم والإجابة الصحيحة) بأنواع الأسئلة
 * المستخدَمة فعليًا في البذرة المزروعة (mcq, true_false) بالإضافة لبقية
 * الأنواع المدعومة في المخطط (ordering, matching, short_answer, essay).
 *
 * تُشغَّل عبر: node lib/__tests__/learning-assessment-grading.test.mjs
 */

import { isAnswerCorrect } from "../api-handlers/learning-assessment.js";

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

console.log("\n=== mcq ===");
const mcqCorrect = { value: "معرفة الله ومعرفة دينه ومعرفة نبيه محمد ﷺ" };
assert(
  isAnswerCorrect("mcq", mcqCorrect, "معرفة الله ومعرفة دينه ومعرفة نبيه محمد ﷺ") === true,
  "إجابة mcq مطابقة تمامًا ⇒ صحيحة",
);
assert(
  isAnswerCorrect("mcq", mcqCorrect, "معرفة القرآن والسنة والإجماع") === false,
  "إجابة mcq خاطئة ⇒ غير صحيحة",
);
assert(
  isAnswerCorrect("mcq", mcqCorrect, "  معرفة الله ومعرفة دينه ومعرفة نبيه محمد ﷺ  ") === true,
  "إجابة mcq بمسافات زائدة تُقارَن بعد trim ⇒ صحيحة",
);

console.log("\n=== true_false ===");
assert(isAnswerCorrect("true_false", { value: "صحيح" }, "صحيح") === true, "true_false مطابقة ⇒ صحيحة");
assert(isAnswerCorrect("true_false", { value: "صحيح" }, "خطأ") === false, "true_false معاكسة ⇒ غير صحيحة");

console.log("\n=== ordering / matching ===");
assert(
  isAnswerCorrect("ordering", ["a", "b", "c"], ["a", "b", "c"]) === true,
  "ordering بنفس الترتيب ⇒ صحيحة",
);
assert(
  isAnswerCorrect("ordering", ["a", "b", "c"], ["b", "a", "c"]) === false,
  "ordering بترتيب مختلف ⇒ غير صحيحة",
);
assert(
  isAnswerCorrect("matching", { a: "1", b: "2" }, { a: "1", b: "2" }) === true,
  "matching مطابقة تمامًا ⇒ صحيحة",
);

console.log("\n=== short_answer ===");
assert(
  isAnswerCorrect("short_answer", { accepted: ["مكة", "مكة المكرمة"] }, "مكة") === true,
  "short_answer ضمن القائمة المقبولة ⇒ صحيحة",
);
assert(
  isAnswerCorrect("short_answer", { accepted: ["مكة", "مكة المكرمة"] }, "  مكة   المكرمة ") === true,
  "short_answer مع مسافات/تطبيع بسيط ⇒ صحيحة",
);
assert(
  isAnswerCorrect("short_answer", { accepted: ["مكة"] }, "المدينة") === false,
  "short_answer خارج القائمة المقبولة ⇒ غير صحيحة",
);

console.log("\n=== essay: لا تصحيح آلي ===");
assert(
  isAnswerCorrect("essay", { value: "أي شيء" }, "إجابة مطولة من المستخدم") === false,
  "الأسئلة المقالية لا تُحتسَب صحيحة تلقائيًا أبدًا (تحتاج مراجعة يدوية)",
);

console.log("\n=== قيم مفقودة ===");
assert(isAnswerCorrect("mcq", mcqCorrect, undefined) === false, "إجابة مفقودة (undefined) ⇒ غير صحيحة");
assert(isAnswerCorrect("mcq", mcqCorrect, null) === false, "إجابة مفقودة (null) ⇒ غير صحيحة");

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
