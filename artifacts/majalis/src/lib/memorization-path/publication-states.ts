/**
 * حالات نشر/مراجعة مسارات الحفظ.
 * لا يُعرض للعامة إلا PUBLISHED بعد مراجعة بشرية + مصدر/ترخيص.
 */

export const HIFZ_PUBLICATION_STATES = [
  "DRAFT",
  "NEEDS_SOURCE",
  "SOURCE_VERIFIED",
  "NEEDS_LICENSE_REVIEW",
  "NEEDS_CONTENT_REVIEW",
  "BLOCKED_LICENSE",
  "BLOCKED_SOURCE",
  "HUMAN_REVIEWED",
  "PUBLISHED",
  "ARCHIVED",
  "REJECTED",
] as const;

export type HifzPublicationStatus = (typeof HIFZ_PUBLICATION_STATES)[number];

export const HIFZ_PUBLIC_VISIBLE_STATES = ["PUBLISHED"] as const;

export const HIFZ_REVIEW_STATES = [
  "PENDING",
  "APPROVED",
  "APPROVED_WITH_CORRECTION",
  "NEEDS_MORE_EVIDENCE",
  "BLOCKED_LICENSE",
  "BLOCKED_SOURCE",
  "REJECTED",
] as const;

export type HifzReviewStatus = (typeof HIFZ_REVIEW_STATES)[number];

export const HIFZ_LICENSE_STATES = [
  "UNKNOWN",
  "PROJECT_QURAN",
  "PROJECT_LICENSED",
  "EXTERNAL_PERMITTED",
  "BLOCKED",
] as const;

export type HifzLicenseStatus = (typeof HIFZ_LICENSE_STATES)[number];

export function isHifzPathPubliclyVisible(
  status: HifzPublicationStatus,
): boolean {
  return (HIFZ_PUBLIC_VISIBLE_STATES as readonly string[]).includes(status);
}

export function canPublishHifzPath(input: {
  publicationStatus: HifzPublicationStatus;
  reviewStatus: HifzReviewStatus;
  licenseStatus: HifzLicenseStatus;
  hasSourceReference: boolean;
}): boolean {
  if (!input.hasSourceReference) return false;
  if (input.licenseStatus === "UNKNOWN" || input.licenseStatus === "BLOCKED") {
    return false;
  }
  if (input.publicationStatus !== "PUBLISHED") return false;
  return (
    input.reviewStatus === "APPROVED" ||
    input.reviewStatus === "APPROVED_WITH_CORRECTION"
  );
}
