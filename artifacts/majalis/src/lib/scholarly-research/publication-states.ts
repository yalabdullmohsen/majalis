/**
 * حالات نشر البحوث الشرعية — لا نشر مباشر من المستخدم.
 */

export const SCHOLARLY_RESEARCH_PUBLICATION_STATES = [
  "DRAFT",
  "SUBMITTED",
  "SOURCE_CHECK_REQUIRED",
  "ACADEMIC_REVIEW_REQUIRED",
  "METHODOLOGY_REVIEW_REQUIRED",
  "RIGHTS_REVIEW_REQUIRED",
  "APPROVED_METADATA_ONLY",
  "APPROVED_EXTERNAL_LINK",
  "REJECTED",
  "ARCHIVED",
  "BROKEN_SOURCE",
] as const;

export type ScholarlyResearchPublicationStatus =
  (typeof SCHOLARLY_RESEARCH_PUBLICATION_STATES)[number];

/** الظهور للعامة / البحث / SEO */
export const SCHOLARLY_RESEARCH_PUBLIC_VISIBLE_STATES = [
  "APPROVED_METADATA_ONLY",
  "APPROVED_EXTERNAL_LINK",
] as const;

export function isScholarlyResearchPubliclyVisible(
  status: ScholarlyResearchPublicationStatus,
): boolean {
  return (SCHOLARLY_RESEARCH_PUBLIC_VISIBLE_STATES as readonly string[]).includes(
    status,
  );
}

export const SCHOLARLY_REVIEW_KINDS = [
  "source",
  "academic",
  "rights",
  "methodology",
] as const;

export type ScholarlyReviewKind = (typeof SCHOLARLY_REVIEW_KINDS)[number];

export const SCHOLARLY_REVIEW_OUTCOMES = [
  "PENDING",
  "PASSED",
  "FAILED",
  "NEEDS_MORE_INFO",
] as const;

export type ScholarlyReviewOutcome = (typeof SCHOLARLY_REVIEW_OUTCOMES)[number];

/** تنبيه واجهة التفاصيل — إلزامي للمنشور. */
export const SCHOLARLY_RESEARCH_DISCLAIMER =
  "إدراج البحث لأغراض الفهرسة والاستفادة العلمية، ولا يعني اعتماد جميع نتائجه أو آراء مؤلفه." as const;

/** عبارات مسموحة للحالة المنهجية — بلا ادّعاء موافقة مطلقة للمنهج دون سجل. */
export const SCHOLARLY_METHODOLOGY_PUBLIC_PHRASES = [
  "تم التحقق من بيانات المصدر",
  "رابط المصدر الأصلي متاح",
  "خضع لفحص منهجي وفق سياسة المحتوى",
] as const;

export const SCHOLARLY_METHODOLOGY_FORBIDDEN_PHRASE =
  "هذا البحث موافق لأهل السنة والجماعة" as const;
