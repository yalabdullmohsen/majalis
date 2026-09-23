/**
 * حالات تقدم وحدة الحفظ — التقنية فقط.
 * الواجهة تعرض الصياغة العربية من USER_LABELS.
 */

export const HIFZ_PROGRESS_STATES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "MEMORIZED_SELF_REPORTED",
  "DUE_FOR_REVIEW",
  "REVIEWED",
  "NEEDS_REINFORCEMENT",
] as const;

export type HifzProgressState = (typeof HIFZ_PROGRESS_STATES)[number];

/** صياغة مفهومة — لا تُعرض الأسماء التقنية للمستخدم. */
export const HIFZ_PROGRESS_USER_LABELS: Readonly<
  Record<HifzProgressState, string>
> = {
  NOT_STARTED: "لم تبدأ",
  IN_PROGRESS: "قيد الحفظ",
  MEMORIZED_SELF_REPORTED: "سجلتها ضمن محفوظاتي",
  DUE_FOR_REVIEW: "مستحقة للمراجعة",
  REVIEWED: "روجعت",
  NEEDS_REINFORCEMENT: "تحتاج تثبيتًا",
};

/** أزرار مسموحة — بلا شهادة حفظ وبلا ادعاء تحقق آلي. */
export const HIFZ_COMPLETION_CTA = {
  completedUnit: "أتممت هذه الوحدة",
  savedToMine: "سجلتها ضمن محفوظاتي",
} as const;
