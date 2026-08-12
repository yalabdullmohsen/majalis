/**
 * اختبار انحدار (regression) للمساعد العلمي.
 *
 * يتحقق من أن كل سؤال مقترح معروض في واجهة المساعد يُنتج إجابة موضوعية
 * مرتبطة بمحتواه من قاعدة المعرفة الاحتياطية — وليس رسالة عامة/ترحيبية —
 * حتى في حال عدم توفر مفتاح Anthropic (وهو السيناريو الذي كان يسبب ظهور
 * الرسالة العامة بدل الإجابة).
 *
 * التشغيل: node scripts/test-assistant-suggested.mjs
 */
import { buildFallbackAnswer, GENERIC_FALLBACK_ANSWER } from "../lib/api-handlers/assistant.js";

// جميع الأسئلة المقترحة الظاهرة للمستخدم:
// - src/components/assistant/AssistantChatView.tsx (SUGGESTED_CATEGORIES)
// - src/views/AssistantPage.tsx (QUICK_PROMPTS)
const SUGGESTED_QUESTIONS = [
  // عبادات
  "ما هي أذكار الصباح والمساء؟",
  "كيف أؤدي صلاة الفجر في وقتها؟",
  "ما حكم قراءة القرآن بدون وضوء؟",
  // فقه
  "ما حكم القروض البنكية بفائدة؟",
  "ما هي شروط الزكاة؟",
  "ما حكم صيام القضاء بعد رمضان؟",
  // معاملات
  "ما حكم البيع والشراء عبر الإنترنت؟",
  "هل يجوز العمل في البنوك؟",
  "ما حكم التأمين التجاري؟",
  // قرآن وسنة
  "ما فضل قراءة القرآن يومياً؟",
  "كيف أحفظ القرآن الكريم؟",
  "ما هي أحاديث فضل ذكر الله؟",
  // أسرة
  "ما حقوق الوالدين في الإسلام؟",
  "كيف أربّي أبنائي تربية إسلامية؟",
  "ما آداب الزواج في الإسلام؟",
  // معاصر
  "ما حكم متابعة مسلسلات التلفزيون؟",
  "هل يجوز الاستماع للموسيقى؟",
  "ما حكم العمل في شركات غير مسلمة؟",
  // QUICK_PROMPTS (AssistantPage)
  "ما فضل قراءة القرآن الكريم؟",
  "ما هي شروط صحة الصلاة؟",
  "ما حكم صيام يوم عرفة؟",
  "ما حكم الميراث في الإسلام؟",
  "ما هي أركان الإيمان الستة؟",
  "ما فضل الصلاة على النبي ﷺ؟",
  "ما هي أركان الإسلام الخمسة؟",
  "ما هي أذكار الصباح والمساء المسنونة؟",
  "ما شروط الوضوء وكيفيته؟",
  "ما هي المحرمات في الزواج في الإسلام؟",
  "ما حكم زيارة القبور وما آدابها؟",
  "ما هي فضائل شهر رمضان؟",
];

let failures = 0;
for (const q of SUGGESTED_QUESTIONS) {
  const answer = buildFallbackAnswer(q);
  const isGeneric = answer === GENERIC_FALLBACK_ANSWER;
  const tooShort = !answer || answer.trim().length < 60;
  if (isGeneric || tooShort) {
    failures += 1;
    console.error(`❌ FAIL: "${q}" → ${isGeneric ? "رسالة عامة" : "إجابة قصيرة/فارغة"}`);
  } else {
    console.log(`✓ "${q}"`);
  }
}

if (failures > 0) {
  console.error(`\n❌ فشل ${failures} من ${SUGGESTED_QUESTIONS.length} سؤالًا مقترحًا.`);
  process.exit(1);
}
console.log(`\n✅ نجح: كل الأسئلة المقترحة (${SUGGESTED_QUESTIONS.length}) تُنتج إجابة موضوعية مرتبطة.`);
