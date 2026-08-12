/**
 * منطق تصحيح إجابات اختيار من متعدد/صح-خطأ — للاستخدام من طرف العميل فقط
 * (المرحلة 11، اختبارات الأربعين النووية).
 *
 * ⚠️ هذا يُرآة (mirror) عمدية لنفس منطق isAnswerCorrect في
 * lib/api-handlers/learning-assessment.js (المُختبَر بـ
 * test:learning-assessment-grading، 14/14 ناجح) — لم يُستورَد ذلك الملف مباشرةً
 * لأنه يستورد في أعلاه ../supabase-admin.mjs (مفتاح service-role) و../api/_http.mjs
 * (اعتمادات Node خادمية)؛ استيراده من كود العميل (حزمة Vite للمتصفح) قد يُسرّب
 * كودًا خادميًا حسّاسًا إلى الحزمة المُرسَلة للمستخدم أو يفشل التجميع لاعتماده
 * على وحدات Node غير متاحة بالمتصفح. الفصل هنا مقصود، لا تكرار كسول — أي تعديل
 * لقواعد التصحيح يجب أن يُطبَّق في كلا الملفين معًا.
 */

export type MCQCorrectAnswer = { value: string };

export function isMcqAnswerCorrect(correctAnswer: MCQCorrectAnswer, userAnswer: string | null | undefined): boolean {
  if (userAnswer === undefined || userAnswer === null) return false;
  return String(userAnswer).trim() === String(correctAnswer.value).trim();
}
