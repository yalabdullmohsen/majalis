/**
 * نموذج كيان محتوى موحّد — عرض/تنقّل فقط.
 * لا يمسّ نص القرآن ولا متن الحديث؛ لا يخزّن أحكامًا شرعية.
 */

export const CONTENT_ENTITY_KINDS = [
  "quran_surah",
  "quran_ayah",
  "quran_page",
  "tafsir",
  "hadith",
  "hadith_book",
  "fiqh_topic",
  "aqeedah_topic",
  "seerah_event",
  "history_event",
  "prophet_story",
  "scholar",
  "lecturer",
  "lesson",
  "lecture",
  "series",
  "institution",
  "mosque",
  "university",
  "article",
  "dhikr",
  "dua",
  "fawaid",
  "app_route",
] as const;

export type ContentEntityKind = (typeof CONTENT_ENTITY_KINDS)[number];

export const VERIFICATION_STATUSES = [
  "draft",
  "needs_source",
  "needs_review",
  "proposed",
  "pending_review",
  "verified",
  "published",
  "rejected",
  "archived",
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export type ContentProvenance = {
  sourceId?: string;
  sourceType?: string;
  sourceReference?: string;
  verificationStatus: VerificationStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  confidenceStatus?: "low" | "medium" | "high" | "n/a";
  provenance?: string;
};

export type ContentEntityRef = {
  kind: ContentEntityKind;
  id: string;
};

export type ContentEntityCard = ContentEntityRef & {
  title: string;
  href: string;
  shortDescription?: string;
  language: "ar";
  publishStatus: "published" | "hidden";
  tags?: string[];
} & ContentProvenance;

export function isPubliclyVisible(
  card: Pick<ContentEntityCard, "publishStatus" | "verificationStatus">,
): boolean {
  if (card.publishStatus !== "published") return false;
  return card.verificationStatus === "verified" || card.verificationStatus === "published";
}

export const SEARCH_KIND_TO_ENTITY: Record<string, ContentEntityKind> = {
  quran: "quran_surah",
  surah: "quran_surah",
  ayah: "quran_ayah",
  tafsir: "tafsir",
  hadith: "hadith",
  fiqh: "fiqh_topic",
  fatwa: "fiqh_topic",
  aqeedah: "aqeedah_topic",
  tawhid: "aqeedah_topic",
  seerah: "seerah_event",
  history: "history_event",
  prophet: "prophet_story",
  scholar: "scholar",
  lecturer: "lecturer",
  lesson: "lesson",
  lecture: "lecture",
  series: "series",
  institution: "institution",
  mosque: "mosque",
  university: "university",
  article: "article",
  adhkar: "dhikr",
  dhikr: "dhikr",
  dua: "dua",
  fawaid: "fawaid",
  book: "article",
  app: "app_route",
};
