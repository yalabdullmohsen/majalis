/**
 * مخطط السجل الموثّق للمناسبات والأحداث والتوصيات الشرعية/التاريخية.
 * لا يُعرض محتوى للعامة إلا عبر سجل يجتاز ReligiousContentValidator.
 */

export type ReligiousEventType =
  | "sacred_month"       // شهر له وصف شرعي ثابت (كالأشهر الحرم)
  | "fixed_ritual"       // مناسبة شرعية ثابتة بعبادة منصوصة (عاشوراء، عرفة…)
  | "historical_event"   // حدث تاريخي (هجرة، غزوة…)
  | "calendar_marker"    // علامة تقويمية (بداية السنة الهجرية) بلا عبادة مخصوصة
  | "personal_suggestion" // اقتراح تنظيمي/تعليمي شخصي — ليس حكمًا شرعيًا
  | "disputed";          // محل خلاف علمي

export type ReligiousContentKind =
  | "verified_fact"        // معلومة موثقة
  | "recommended_deed"     // عمل مستحب بدليل
  | "personal_suggestion"  // اقتراح تنظيمي شخصي
  | "historical_event";    // حدث تاريخي

export type ReviewStatus = "draft" | "needs_review" | "approved" | "rejected";

export type ConfidenceLevel = "high" | "medium" | "low" | "disputed";

export type TrustedSourceTier =
  | "quran"
  | "sahih_hadith"
  | "sunnah_books"
  | "verified_seerah"
  | "trusted_fatwa"
  | "other";

export type VerifiedReligiousRecord = {
  id: string;
  eventName: string;
  hijriMonth: number | null; // 1–12 أو null إن لم يُقيَّد بشهر
  hijriDay: number | null;
  eventType: ReligiousEventType;
  contentKind: ReligiousContentKind;
  verifiedDescription: string;
  recommendedActions: string[];
  evidence: string;
  sourceName: string;
  sourceUrl: string | null;
  reviewStatus: ReviewStatus;
  reviewedBy: string;
  lastReviewedAt: string; // ISO date
  confidenceLevel: ConfidenceLevel;
  /** هل التاريخ قطعي أم تقريبي/خلافى */
  dateCertainty: "certain" | "approximate" | "disputed" | "not_applicable";
  /** تحفظ يُعرض مع المعلومة عند الخلاف أو عدم الثبوت */
  caveat: string | null;
  /** روابط صريحة حدث↔شهر مسموح بها فقط إن وُجدت هنا */
  allowedMonthLinks: number[];
  /** هل يجوز عرض اقتراحات أفعال كـ«أعمال مستحبة» */
  actionsAreRitualClaims: boolean;
};

export type ValidationRejection = {
  recordId: string;
  reason: string;
  rule: string;
  at: string;
};

export type ValidationResult = {
  ok: boolean;
  publishable: boolean;
  record: VerifiedReligiousRecord | null;
  rejections: ValidationRejection[];
};
