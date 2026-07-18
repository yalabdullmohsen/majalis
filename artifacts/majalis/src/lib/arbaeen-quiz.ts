/**
 * أسئلة الأربعون النووية — مُشتقّة حرفيًا من src/lib/arbaeen-nawawi-seed.ts فقط
 * (المرحلة 11، 2026-07-18). لا توليد بالذكاء الاصطناعي إطلاقًا — كل خيار/مموِّه
 * في كل سؤال هو نص حقيقي منقول من حديث آخر في نفس البنك المعتمد، أو استخراج
 * حتمي (deterministic) من نص الحديث نفسه (حذف كلمة، تقسيم إلى شطرين).
 *
 * التصحيح عبر src/lib/answer-grading.ts (مرآة آمنة للعميل لنفس منطق
 * lib/api-handlers/learning-assessment.js::isAnswerCorrect المُختبَر بـ
 * test:learning-assessment-grading — راجع تعليق answer-grading.ts لسبب عدم
 * استيراد ملف الخادم مباشرة) — لا محرك تصحيح مواز جديد.
 *
 * أنواع مُنفَّذة: صح-خطأ، إكمال (اختيار من متعدد)، بداية-نهاية، ربط (فائدة).
 * غير مُنفَّذ عمدًا: "راوٍ" (لا حقل راوٍ منفصل في البيانات، فقط "source" نصي
 * مدمج مثل "متفق عليه — البخاري ومسلم" لا يصلح لاستخراج راوٍ فردي موثوق بلا
 * تخمين) — موثَّق كعمل متبقٍ صريح لا سؤال مُخترَع.
 */
import { ARBAEEN_NAWAWI, type NawawiHadith } from "@/lib/arbaeen-nawawi-seed";

export type ArbaeenQuestionType = "true_false" | "fill_blank" | "ending" | "benefit_match";

export type ArbaeenQuestion = {
  id: string; // `${type}:${hadithId}` — ثابت لنفس الحديث/النوع
  type: ArbaeenQuestionType;
  hadithId: number;
  prompt: string;
  options: string[];
  correctAnswer: { value: string };
  gradingType: "mcq" | "true_false";
};

/** اختيار حتمي غير عشوائي من مصفوفة بحجم n بالاعتماد على seed (رقم الحديث عادة)
 *  — نفس السؤال لنفس الحديث دومًا، لا يتغيّر بين عمليات تحميل مختلفة. */
function pick<T>(arr: T[], seed: number, exclude?: number): T {
  let idx = Math.abs(seed) % arr.length;
  if (exclude !== undefined && arr.length > 1) {
    while (idx === exclude) idx = (idx + 1) % arr.length;
  }
  return arr[idx];
}

function shuffleDeterministic<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function otherHadiths(hadithId: number): NawawiHadith[] {
  return ARBAEEN_NAWAWI.filter((h) => h.id !== hadithId);
}

/** صح-خطأ: عرض نص الحديث مع عنوان — إما عنوانه الصحيح أو عنوان حديث آخر. */
export function generateTrueFalseQuestion(hadith: NawawiHadith): ArbaeenQuestion {
  const others = otherHadiths(hadith.id);
  const useWrongTitle = hadith.id % 2 === 0; // حتمي: نصف الأحاديث تُعرَض بعنوان خاطئ عمدًا للاختبار
  const shownTitle = useWrongTitle ? pick(others, hadith.id).title : hadith.title;
  return {
    id: `true_false:${hadith.id}`,
    type: "true_false",
    hadithId: hadith.id,
    prompt: `هل عنوان «${shownTitle}» يطابق هذا الحديث؟\n«${hadith.text.slice(0, 140)}${hadith.text.length > 140 ? "…" : ""}»`,
    options: ["صحيح", "خطأ"],
    correctAnswer: { value: useWrongTitle ? "خطأ" : "صحيح" },
    gradingType: "true_false",
  };
}

/** إكمال: حذف كلمة محورية من نص الحديث، اختيار من 4 (3 مموِّهات من كلمات أحاديث أخرى). */
export function generateFillBlankQuestion(hadith: NawawiHadith): ArbaeenQuestion {
  const words = hadith.text.split(/\s+/).filter((w) => w.replace(/[،.؛:»«]/g, "").length >= 4);
  if (words.length === 0) {
    // نص قصير جدًا بلا كلمة صالحة للحذف — احتياط آمن، لا يحدث فعليًا في بنك 42 حديثًا لكن للأمان
    return generateTrueFalseQuestion(hadith);
  }
  const wordIdx = hadith.id % words.length;
  const target = words[wordIdx].replace(/[،.؛:»«]/g, "");
  const blanked = hadith.text.replace(words[wordIdx], "‌‌ـــــ");

  const others = otherHadiths(hadith.id);
  const distractorPool = others
    .flatMap((h) => h.text.split(/\s+/))
    .map((w) => w.replace(/[،.؛:»«]/g, ""))
    .filter((w) => w.length >= 4 && w !== target);
  const distractors = shuffleDeterministic([...new Set(distractorPool)], hadith.id).slice(0, 3);

  const options = shuffleDeterministic([target, ...distractors], hadith.id + 1);
  return {
    id: `fill_blank:${hadith.id}`,
    type: "fill_blank",
    hadithId: hadith.id,
    prompt: `أكمل الفراغ في الحديث:\n«${blanked}»`,
    options,
    correctAnswer: { value: target },
    gradingType: "mcq",
  };
}

/** بداية-نهاية: عرض الشطر الأول من الحديث، اختيار الشطر الثاني الصحيح من بين شطرات أحاديث أخرى. */
export function generateEndingQuestion(hadith: NawawiHadith): ArbaeenQuestion | null {
  const midpoint = Math.floor(hadith.text.length / 2);
  // ابحث عن أقرب فاصل كلمة قرب المنتصف كي لا يُقطَع حرف من كلمة
  const spaceIdx = hadith.text.indexOf(" ", midpoint);
  if (spaceIdx === -1 || spaceIdx > hadith.text.length - 15) return null; // نص لا يصلح للتقسيم بأمان
  const beginning = hadith.text.slice(0, spaceIdx).trim();
  const correctEnding = hadith.text.slice(spaceIdx).trim();

  const others = otherHadiths(hadith.id).filter((h) => h.text.length > 30);
  const distractorEndings = shuffleDeterministic(others, hadith.id).slice(0, 3).map((h) => {
    const mid = Math.floor(h.text.length / 2);
    const sp = h.text.indexOf(" ", mid);
    return sp === -1 ? h.text.slice(mid) : h.text.slice(sp).trim();
  });

  const options = shuffleDeterministic([correctEnding, ...distractorEndings], hadith.id + 2);
  return {
    id: `ending:${hadith.id}`,
    type: "ending",
    hadithId: hadith.id,
    prompt: `أكمل نهاية الحديث:\n«${beginning} ...»`,
    options,
    correctAnswer: { value: correctEnding },
    gradingType: "mcq",
  };
}

/** ربط: عرض عنوان حديث، اختيار الفائدة الصحيحة المستخرجة منه من بين 4 فوائد. */
export function generateBenefitMatchQuestion(hadith: NawawiHadith): ArbaeenQuestion {
  const others = otherHadiths(hadith.id);
  const distractors = shuffleDeterministic(others, hadith.id).slice(0, 3).map((h) => h.benefits);
  const options = shuffleDeterministic([hadith.benefits, ...distractors], hadith.id + 3);
  return {
    id: `benefit_match:${hadith.id}`,
    type: "benefit_match",
    hadithId: hadith.id,
    prompt: `أي فائدة تُستخلَص من حديث «${hadith.title}»؟`,
    options,
    correctAnswer: { value: hadith.benefits },
    gradingType: "mcq",
  };
}

/** كل أنواع الأسئلة الممكنة لحديث واحد — تُستخدَم لمراجعة SM-2 لحديث بعينه. */
export function generateAllQuestionsForHadith(hadith: NawawiHadith): ArbaeenQuestion[] {
  const questions = [
    generateTrueFalseQuestion(hadith),
    generateFillBlankQuestion(hadith),
    generateBenefitMatchQuestion(hadith),
  ];
  const ending = generateEndingQuestion(hadith);
  if (ending) questions.push(ending);
  return questions;
}

/** اختبار تراكمي/نهائي: سؤال واحد لكل حديث ضمن مجموعة الأحاديث المطلوبة (hadithIds)،
 *  بأنواع متنوّعة تتناوب حتميًا لا عشوائيًا. count=42 مع كل الأحاديث ⇒ "الاختبار النهائي". */
export function generateReviewSet(hadithIds: number[]): ArbaeenQuestion[] {
  const generators = [generateTrueFalseQuestion, generateFillBlankQuestion, generateBenefitMatchQuestion];
  return hadithIds
    .map((id) => ARBAEEN_NAWAWI.find((h) => h.id === id))
    .filter((h): h is NawawiHadith => Boolean(h))
    .map((h, i) => {
      if (i % 4 === 3) {
        const ending = generateEndingQuestion(h);
        if (ending) return ending;
      }
      return generators[i % generators.length](h);
    });
}
