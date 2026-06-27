/**
 * QA category classifier — prevents misclassification and auto-corrects.
 */
import {
  resolveCategorySlug,
  type QaCategorySlug,
  getCategoryBySlug,
} from "./qa-categories";

export type QaClassificationInput = {
  question: string;
  answer?: string;
  category_slug?: string | null;
  category_name?: string | null;
};

export type QaClassificationResult = {
  suggestedSlug: QaCategorySlug;
  currentSlug: QaCategorySlug;
  corrected: boolean;
  confidence: number;
  reason: string;
};

/** Keyword rules — first match wins (ordered by specificity). */
const CLASSIFICATION_RULES: { slug: QaCategorySlug; patterns: RegExp[] }[] = [
  {
    slug: "anbiya",
    patterns: [
      /(?:من\s+(?:أول\s+)?(?:ال)?(?:رسل|نبي|الأنبياء)|النبي الذي|إلى قوم (?:عاد|ثمود|لوط)|ابتلعه الحوت|كلمه الله|اتخذه.*خليل|نوح|إبراهيم|موسى|عيسى|يونس|هود|صالح|لوط|شعيب|ذو الكفل)/i,
      /(?:قصص? )?(?:الأنبياء|المرسلين)/,
      /عليه(?:ه)?\s*السلام/,
    ],
  },
  { slug: "sahabah", patterns: [/صحاب(?:ي|ة)|رضي الله عن(?:ه|ها|هم)?|الخلفاء الراشد|أبو بكر|عمر بن|عثمان بن|علي بن|أمهات المؤمنين|من (?:أول|ثاني|ثالث|رابع) الخلفاء/i] },
  { slug: "tabiin", patterns: [/تابع(?:ي|ين)|تابع(?:ة)?\s/i] },
  { slug: "taharah", patterns: [/وضوء|غسل|طهارة|جنابة|استنجاء|تيمم/i] },
  { slug: "salah", patterns: [/صلا(?:ة|ة)|جماعة|ركوع|سجود|تشهد|إمام(?:ة)?|مسجد/i] },
  { slug: "zakat", patterns: [/زك(?:اة|وة)|نصاب|صدقة/i] },
  { slug: "sawm", patterns: [/ص(?:يام|وم)|رمضان|فطر|سحور|إفطار/i] },
  { slug: "hajj", patterns: [/ح(?:ج|ج)|عمر(?:ة)?|نسك|طواف|سعي|عرف(?:ة|ات)/i] },
  { slug: "seerah", patterns: [/س(?:ي|ي)ر(?:ة)?(?:\s|$)|هجر(?:ة|ة)|غزو(?:ة|ات)|بدر|أحد|النبي ﷺ/i] },
  { slug: "tafsir", patterns: [/تفسير|سبب(?:\s)?(?:ال)?نزول|آية|سورة/i] },
  { slug: "quran", patterns: [/قر(?:آ|ا)ن|تلاو(?:ة)?|حفظ|تجويد|مصحف/i] },
  { slug: "hadith", patterns: [/حديث|سنة|رو(?:ا|ا)ة|إسناد|صحيح|ضعيف|موضوع/i] },
  { slug: "adhkar", patterns: [/ذكر|أذكار|دع(?:ا|اء)|تسبيح|تحميد|تكبير/i] },
  { slug: "adab", patterns: [/آداب|أدب|خلق|بر(?:\s|$)|إحسان/i] },
  { slug: "family", patterns: [/زواج|نكاح|طلاق|أسرة|والد|والدة|بر(?:\s|$)|تربية/i] },
  { slug: "women", patterns: [/مرأ(?:ة|ة)|نس(?:ا|اء)|ح(?:ي|ي)ض|نفاس|عدة/i] },
  { slug: "muamalat", patterns: [/بيع|رب(?:ا|ى)|معامل(?:ة|ات)|قرض|دين(?:\s|$)|مال/i] },
  { slug: "rulings", patterns: [/ح(?:ل|ر)ام|مكروه|مباح|سنة|واجب|فرض|حكم/i] },
  { slug: "history", patterns: [/تاريخ|خل(?:ا|ا)ف(?:ة)?|أموي|عباس/i] },
  {
    slug: "aqeedah",
    patterns: [/توحيد|إيمان|قد(?:ر|ر)|شر(?:ك|ك)|مل(?:ا|ا)ئ(?:ك|ك)ة|يوم(?:\s)?(?:ال)?قي(?:ا|ا)مة|جنة|ن(?:ا|ا)ر/i],
  },
];

export function classifyQuestion(input: QaClassificationInput): QaClassificationResult {
  const text = `${input.question || ""} ${input.answer || ""}`.trim();
  const currentSlug = resolveCategorySlug(input.category_slug);

  for (const rule of CLASSIFICATION_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        const corrected = rule.slug !== currentSlug;
        return {
          suggestedSlug: rule.slug,
          currentSlug,
          corrected,
          confidence: corrected ? 0.88 : 0.95,
          reason: corrected
            ? `تصنيف "${getCategoryBySlug(currentSlug)?.name}" → "${getCategoryBySlug(rule.slug)?.name}" (قاعدة: ${pattern.source?.slice(0, 40)})`
            : "التصنيف صحيح",
        };
      }
    }
  }

  return {
    suggestedSlug: currentSlug,
    currentSlug,
    corrected: false,
    confidence: 0.5,
    reason: "لم تُطابق قاعدة — يُبقى التصنيف الحالي",
  };
}

export function validateQaCategory(input: QaClassificationInput): {
  valid: boolean;
  result: QaClassificationResult;
  errors: string[];
} {
  const result = classifyQuestion(input);
  const errors: string[] = [];

  if (result.corrected) {
    errors.push(`تصنيف خاطئ: ${result.reason}`);
  }

  if (result.currentSlug === "aqeedah" && result.suggestedSlug === "anbiya") {
    errors.push("سؤال عن الأنبياء لا ينتمي لتصنيف العقيدة");
  }

  return {
    valid: errors.length === 0,
    result,
    errors,
  };
}

/** Apply correction to a question record (client-side / import). */
export function applyCategoryCorrection<T extends { category_slug?: string; qa_categories?: { slug?: string } }>(
  item: T,
  classification: QaClassificationResult,
): T & { category_slug: string; _categoryCorrected?: boolean; _correctionReason?: string } {
  if (!classification.corrected) {
    return { ...item, category_slug: classification.currentSlug };
  }
  const cat = getCategoryBySlug(classification.suggestedSlug);
  return {
    ...item,
    category_slug: classification.suggestedSlug,
    qa_categories: { slug: classification.suggestedSlug, name: cat?.name || classification.suggestedSlug },
    _categoryCorrected: true,
    _correctionReason: classification.reason,
  };
}
