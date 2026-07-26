/**
 * مخطط الاقتباس ودرجات التوثيق — المرحلة 1.
 * المرجع التحريري: docs/editorial-policy.md
 *
 * توافق خلفي: الحقول القديمة (evidence, reference, evidence_summary,
 * documentation_level في المسائل الفقهية) تبقى كما هي للاستهلاك الحالي.
 * الدرجة الصادقة للتوثيق العلمي تُسجَّل في trust_level ولا تُرفع أبداً.
 *
 * تحذير تشغيلي: documentation_level === "official_verified" بوابة عرض
 * المسائل الفقهية العامة — لا تُخفض لتفادي إخفاء المحتوى من الواجهة.
 * استخدم trust_level لعرض شارة المصدر (مؤجّل للواجهة).
 */

/** اقتباس منظَّم يستبدل النص الحر غير القابل للتحقق الآلي. */
export type Citation = {
  type: "quran" | "hadith" | "book" | "institutional_ruling";
  /** اسم السورة أو الكتاب أو الجهة */
  work: string;
  /** الكتاب داخل المصنَّف */
  book?: string;
  /** الباب */
  chapter?: string;
  /** رقم الآية أو الحديث أو القرار */
  number?: string;
  volume?: string;
  page?: string;
  grade?: "صحيح" | "حسن" | "ضعيف" | "موضوع" | "مختلف فيه";
  /** من حكم به — إلزامي مع grade */
  grader?: string;
  /** للقرارات المؤسسية */
  date?: string;
  /** "repo:<ملف>:<سطر>" أو "NEEDS_HUMAN" فقط */
  verified_from: string;
};

/**
 * خمس درجات توثيق صارمة.
 * القاعدة: لا تُرفع درجة سجل أبداً. عند الشك اخفض إلى الحقيقة.
 */
export type TrustLevel =
  | "primary_text"
  | "scholarly_source"
  | "institutional_ruling"
  | "general_reasoning"
  | "unsourced";

export const TRUST_LEVEL_DEFINITIONS: Record<
  TrustLevel,
  { ar: string; definition: string }
> = {
  primary_text: {
    ar: "نص أصلي",
    definition:
      "نص قرآني بسورة ورقم آية، أو حديث بمصنَّف ورقم وحكم وحاكم.",
  },
  scholarly_source: {
    ar: "مصدر علمي",
    definition: "نقل عن عالم أو كتاب مسمّى بجزء وصفحة (أو موضع معادل).",
  },
  institutional_ruling: {
    ar: "قرار مؤسسي",
    definition: "قرار مجمع أو هيئة برقم وتاريخ.",
  },
  general_reasoning: {
    ar: "استدلال عام",
    definition: "استدلال بقاعدة عامة بلا نص مسمّى يطابق مخطط Citation.",
  },
  unsourced: {
    ar: "بلا مصدر",
    definition: "بلا شيء يمكن التحقق منه.",
  },
};

/** حالة المراجعة التحريرية — المرحلة 7 */
export type ReviewStatus = "unreviewed" | "reviewed" | "needs_rereview";

/** بوابة نشر محتوى مشبوه أو ضعيف معروض استدلالاً — المرحلة 3 */
export type PublicationGate = "open" | "blocked";

/**
 * حقول توثيق اختيارية تُضاف إلى جانب الحقول القديمة.
 * ملاحظة توافق: بعض البذور (مثل QA) تستخدم review_status بمعانٍ
 * تشغيلية أخرى ("approved"). لذلك الحقل التحريري الجديد هو
 * editorial_review_status — لا تُستبدَل القيمة القديمة.
 */
export type CitationTrustFields = {
  citations?: Citation[];
  trust_level?: TrustLevel;
  publication_gate?: PublicationGate;
  /** وسم داخلي للمتون المشبوهة — لا يُصحَّح المتن آلياً */
  text_flags?: Array<"SUSPECT_TEXT" | "TEMPLATED_EXPLANATION">;
  reviewed_by?: string;
  reviewed_at?: string;
  last_updated_at?: string;
  /** حالة المراجعة التحريرية — الافتراضي لكل سجل موجود: unreviewed */
  editorial_review_status?: ReviewStatus;
  /**
   * alias توثيقي لسجلات بلا تعارض اسمي مع review_status التشغيلي.
   * إن وُجد review_status تشغيلي مسبقاً لا تُكتب هذه القيمة فوقه.
   */
  review_status?: ReviewStatus;
  /** علامة أن الشرح قالب آلي */
  _templated_explanation?: boolean;
};

export function isValidVerifiedFrom(value: string | undefined | null): boolean {
  if (!value || typeof value !== "string") return false;
  if (value === "NEEDS_HUMAN") return true;
  return value.startsWith("repo:") && value.length > "repo:".length;
}

export function citationIsPrimaryComplete(c: Citation): boolean {
  if (!c.work || !c.number) return false;
  if (c.type === "hadith") {
    if (c.grade && !c.grader) return false;
    if (c.grader && !c.grade) return false;
  }
  return isValidVerifiedFrom(c.verified_from);
}

/**
 * تقدير درجة التوثيق من نص دليل حر (للتوافق والجرد فقط).
 * لا يرفع الدرجة فوق ما يدعمه النص صراحةً.
 */
export function inferTrustLevelFromFreeText(
  text: string | null | undefined,
): TrustLevel {
  const t = (text ?? "").trim();
  if (!t) return "unsourced";

  const hasQuranPin =
    /(?:سورة|الآية|آية)\s+\S+/.test(t) && /\[\s*\d+\s*:\s*\d+\s*\]|\d+\s*:\s*\d+/.test(t);
  const hasHadithPin =
    /(?:صحيح|سنن|مسند|موطأ|الترمذي|النسائي|أبو داود|ابن ماجه|البخاري|مسلم)/.test(t) &&
    /(?:رقم|حديث)\s*\d+|\(\s*\d+\s*\)/.test(t);

  if (hasQuranPin || hasHadithPin) {
    // بلا حكم وحاكم لا نرفع إلى primary_text من نص حر
    const hasGrade =
      /(?:صححه|حسّنه|ضعّفه|حكم|صحيح|حسن|ضعيف|موضوع)/.test(t) &&
      /(?:الألباني|الذهبي|ابن حجر|النووي|الحاكم|الترمذي)/.test(t);
    if (hasGrade || hasQuranPin) return "primary_text";
    return "scholarly_source";
  }

  if (
    /(?:قرار|مجمع|هيئة|اللجنة الدائمة|مجمع الفقه)/.test(t) &&
    /(?:رقم|بتاريخ|هـ|م\b)/.test(t)
  ) {
    return "institutional_ruling";
  }

  if (
    /(?:جزء|ج\s*\d+|ص\s*\d+|صفحة\s*\d+|المغني|المجموع|الأم|نيل الأوطار|زاد المعاد|فتح الباري)/.test(
      t,
    )
  ) {
    return "scholarly_source";
  }

  // قاعدة عامة / مقاصد / غرر / ضرورة بلا نص مسمّى
  if (
    /(?:قاعدة|مقاصد|الضرورات|الغرر|أكل المال بالباطل|لا ضرر|اليقين لا يزول|المشقة تجلب)/.test(
      t,
    ) ||
    t.length < 80
  ) {
    // نص قصير بلا اسم مصنَّف = استدلال عام أو بلا مصدر
    if (
      /(?:البخاري|مسلم|القرآن|سورة|ابن|الشافعي|أبو حنيفة|مالك|أحمد|الألباني)/.test(t)
    ) {
      return "general_reasoning";
    }
    return t.length < 20 ? "unsourced" : "general_reasoning";
  }

  return "general_reasoning";
}

/** القيمة الافتراضية لحالة المراجعة لكل سجل موجود */
export function defaultReviewStatus(
  explicit?: ReviewStatus,
): ReviewStatus {
  return explicit ?? "unreviewed";
}

export function defaultTrustLevel(
  explicit: TrustLevel | undefined,
  freeText?: string | null,
): TrustLevel {
  if (explicit) return explicit;
  return inferTrustLevelFromFreeText(freeText);
}
