/**
 * اختبارات وحدة — classifyIslamicQuery (حراسة المساعد العلمي)
 * يمنع رجوع الأنماط الحساسة إلى الاعتماد على تشكيل حرفي نادر (باغ حقيقي أُصلح:
 * "طلّق" بالشدة لم يكن يطابق "طلقت" العادية، ولم تكن المواريث/النوازل الطبية
 * مغطاة إطلاقًا).
 *
 * تُشغَّل عبر: node lib/__tests__/islamic-answer-guardrails.test.mjs
 */

import { classifyIslamicQuery } from "../islamic-answer-guardrails.mjs";

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

console.log("\n=== مسائل يجب حجبها (blocked_sensitive_fatwa) ===");

assert(
  classifyIslamicQuery("طلقت زوجتي وأنا غاضب ثلاث مرات، هل يقع الطلاق؟") === "blocked_sensitive_fatwa",
  "طلاق بصياغة عادية بلا تشكيل يُحجب"
);
assert(
  classifyIslamicQuery("طلّقت زوجتي وأنا غاضب") === "blocked_sensitive_fatwa",
  "طلاق بتشكيل (شدة) يُحجب أيضًا"
);
assert(
  classifyIslamicQuery("توفي والدي وترك زوجتين و5 أبناء و3 بنات، كيف نقسم التركة؟") === "blocked_sensitive_fatwa",
  "مسألة ميراث شخصية بتفاصيل عائلية تُحجب"
);
assert(
  classifyIslamicQuery("ما نصيبي من ميراث أبي؟") === "blocked_sensitive_fatwa",
  "سؤال نصيب شخصي من الميراث يُحجب"
);
assert(
  classifyIslamicQuery("هل يجوز إجهاض الجنين المشوه في الشهر الرابع؟") === "blocked_sensitive_fatwa",
  "نازلة طبية (إجهاض) تُحجب"
);
assert(
  classifyIslamicQuery("هل يجوز فصل جهاز التنفس عن أمي المتوفاة دماغيًا؟") === "blocked_sensitive_fatwa",
  "نازلة طبية (وفاة دماغية) تُحجب"
);

console.log("\n=== أسئلة تعليمية عامة يجب ألا تُحجب ===");

assert(
  classifyIslamicQuery("ما هي شروط الصلاة؟") === "general_guidance",
  "سؤال عام عن الصلاة لا يُحجب"
);
assert(
  classifyIslamicQuery("ما هي أحكام المواريث في الإسلام بشكل عام؟") === "general_guidance",
  "سؤال تعليمي عام عن أحكام المواريث لا يُحجب"
);
assert(
  classifyIslamicQuery("ما حكم الطلاق في الإسلام؟") === "general_guidance",
  "سؤال تعليمي عام عن حكم الطلاق (بلا تفاصيل شخصية) لا يُحجب"
);
assert(
  classifyIslamicQuery("كيف أحفظ القرآن؟") === "general_guidance",
  "سؤال عام غير متعلق بالحساسية لا يُحجب"
);

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
