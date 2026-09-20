/**
 * حالات نشر ومراجعة قسم الفرق الإسلامية.
 * لا يُعرض للعامة إلا PUBLISHED بعد مراجعة بشرية — الذكاء الاصطناعي لا يضع PUBLISHED.
 */

export const ISLAMIC_SECTS_PUBLICATION_STATES = [
  "DRAFT",
  "NEEDS_SOURCE",
  "SOURCE_VERIFIED",
  "NEEDS_HISTORICAL_REVIEW",
  "NEEDS_SHARIA_REVIEW",
  "NEEDS_LANGUAGE_REVIEW",
  "CONFLICTING_SOURCES",
  "BLOCKED_LICENSE",
  "HUMAN_REVIEWED",
  "PUBLISHED",
  "REJECTED",
] as const;

export type IslamicSectsPublicationStatus =
  (typeof ISLAMIC_SECTS_PUBLICATION_STATES)[number];

/** الحالات المسموح ظهورها في البحث والواجهة العامة */
export const ISLAMIC_SECTS_PUBLIC_VISIBLE_STATES = ["PUBLISHED"] as const;

export const ISLAMIC_SECTS_HUMAN_REVIEW_DECISIONS = [
  "APPROVED",
  "APPROVED_WITH_CORRECTION",
  "NEEDS_MORE_EVIDENCE",
  "REJECTED",
] as const;

export type IslamicSectsHumanReviewDecision =
  (typeof ISLAMIC_SECTS_HUMAN_REVIEW_DECISIONS)[number];

export function isIslamicSectsPubliclyVisible(
  status: IslamicSectsPublicationStatus,
): boolean {
  return (ISLAMIC_SECTS_PUBLIC_VISIBLE_STATES as readonly string[]).includes(
    status,
  );
}

/**
 * اكتمال الحقول وحده لا يكفي للنشر.
 * النشر يتطلب PUBLISHED صراحةً + قرار بشري APPROVED|APPROVED_WITH_CORRECTION.
 */
export function canPublishIslamicSectsRecord(input: {
  publicationStatus: IslamicSectsPublicationStatus;
  humanDecision: IslamicSectsHumanReviewDecision | null | undefined;
  hasPrimaryOrSecondarySource: boolean;
}): boolean {
  if (!input.hasPrimaryOrSecondarySource) return false;
  if (input.publicationStatus !== "PUBLISHED") return false;
  return (
    input.humanDecision === "APPROVED" ||
    input.humanDecision === "APPROVED_WITH_CORRECTION"
  );
}
