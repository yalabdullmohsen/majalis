/**
 * عقد بنك تحدي الأسئلة — فئات وأسئلة مع مسار مراجعة إلزامي.
 * لا يظهر للعامة إلا publicationStatus === "PUBLISHED".
 * الذكاء الاصطناعي لا يضع HUMAN_REVIEWED ولا PUBLISHED.
 */

export const QUIZ_BANK_SCHEMA_VERSION = 1 as const;

/** حالات مسار النشر — المصدر: قرار المنتج 2026-09-20 */
export type QuizPublicationStatus =
  | "DRAFT"
  | "NEEDS_SOURCE"
  | "SOURCE_VERIFIED"
  | "NEEDS_SHARIA_REVIEW"
  | "NEEDS_LANGUAGE_REVIEW"
  | "CONFLICTING_SOURCES"
  | "BLOCKED_LICENSE"
  | "HUMAN_REVIEWED"
  | "PUBLISHED"
  | "REJECTED";

export type QuizShariaReviewStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_MORE_EVIDENCE";

export type QuizLanguageReviewStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_MORE_EVIDENCE";

export type QuizFactualReviewStatus =
  | "PENDING"
  | "VERIFIED"
  | "CONFLICTING"
  | "REJECTED";

export type QuizSourceType =
  | "quran"
  | "hadith"
  | "tafsir"
  | "fiqh"
  | "aqeeda"
  | "seerah"
  | "history"
  | "adhkar"
  | "linguistics"
  | "glossary"
  | "project_internal"
  | "other";

export type QuizQuotationStatus =
  | "NONE"
  | "PARAPHRASE"
  | "QUOTED_VERIFIED"
  | "BLOCKED";

export type QuizLicenseStatus =
  | "UNKNOWN"
  | "ALLOWED"
  | "LINK_OUT_ONLY"
  | "BLOCKED";

/** أنواع الأسئلة المسموحة في المنتج */
export type QuizQuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "COMPLETE_TERM"
  | "ORDER_ITEMS"
  | "MATCH_ITEMS"
  | "OPEN";

export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizCategoryIcon =
  | "book-open"
  | "scroll-text"
  | "moon"
  | "star"
  | "scale"
  | "building-2"
  | "landmark"
  | "gem"
  | "book-marked"
  | "library"
  | "users"
  | "heart"
  | "sparkles"
  | "languages"
  | "pen-line"
  | "compass"
  | "map"
  | "message-circle"
  | "droplets"
  | "hands-praying"
  | "coins"
  | "sunrise";

export interface QuizCategory {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: QuizCategoryIcon;
  colorToken: string;
  parentCategoryId: string | null;
  order: number;
  /** إن false لا تظهر حتى لو وُجدت أسئلة منشورة */
  enabled: boolean;
  sourcePolicy: string;
  reviewPolicy: "sharia" | "language" | "sharia_and_language" | "factual";
  /** Batch تأسيسي — للتوثيق الداخلي فقط */
  batch?: 1 | 2 | 3;
  createdAt: string;
  updatedAt: string;
}

export interface QuizBankQuestion {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  type: QuizQuestionType;
  difficulty: QuizDifficulty;
  questionText: string;
  choices?: string[];
  correctChoiceId?: string;
  /** فهرس صحيح للتوافق مع محرّك اللعبة الحالي */
  correctIndex?: number;
  acceptedAnswers?: string[];
  explanation: string;
  hint?: string;
  items?: string[];
  pairs?: Array<[string, string]>;
  /** نقاط اللوحة الكلاسيكية */
  pointValue?: 200 | 400 | 600;
  sourceTitle?: string;
  sourceAuthor?: string;
  sourceReference?: string;
  sourceUrl?: string;
  sourceType?: QuizSourceType;
  quotationStatus: QuizQuotationStatus;
  licenseStatus: QuizLicenseStatus;
  shariaReviewStatus: QuizShariaReviewStatus;
  languageReviewStatus: QuizLanguageReviewStatus;
  factualReviewStatus: QuizFactualReviewStatus;
  reviewer?: string;
  reviewedAt?: string;
  publicationStatus: QuizPublicationStatus;
  createdAt: string;
  updatedAt: string;
  schemaVersion: typeof QUIZ_BANK_SCHEMA_VERSION;
}

/** شروط الظهور للعامة — لا يُخفَّف في البوابات */
export function canPublishQuestion(q: Pick<
  QuizBankQuestion,
  | "publicationStatus"
  | "shariaReviewStatus"
  | "languageReviewStatus"
  | "factualReviewStatus"
  | "licenseStatus"
  | "sourceReference"
  | "sourceTitle"
>): { ok: true } | { ok: false; reason: string } {
  if (q.licenseStatus === "BLOCKED") {
    return { ok: false, reason: "BLOCKED_LICENSE" };
  }
  if (!q.sourceTitle && !q.sourceReference) {
    return { ok: false, reason: "NEEDS_SOURCE" };
  }
  if (q.factualReviewStatus !== "VERIFIED") {
    return { ok: false, reason: "factual not VERIFIED" };
  }
  if (
    q.shariaReviewStatus !== "APPROVED" &&
    q.shariaReviewStatus !== "NOT_REQUIRED"
  ) {
    return { ok: false, reason: "sharia review incomplete" };
  }
  if (
    q.languageReviewStatus !== "APPROVED" &&
    q.languageReviewStatus !== "NOT_REQUIRED"
  ) {
    return { ok: false, reason: "language review incomplete" };
  }
  if (q.publicationStatus !== "HUMAN_REVIEWED" && q.publicationStatus !== "PUBLISHED") {
    return { ok: false, reason: "requires HUMAN_REVIEWED before PUBLISHED" };
  }
  return { ok: true };
}

export function isPubliclyVisible(
  q: Pick<QuizBankQuestion, "publicationStatus">,
): boolean {
  return q.publicationStatus === "PUBLISHED";
}

/** توافق الأنواع القديمة → العقد الجديد */
export function mapLegacyKindToType(
  kind?: string,
): QuizQuestionType {
  switch (kind) {
    case "mcq":
      return "MULTIPLE_CHOICE";
    case "true_false":
      return "TRUE_FALSE";
    case "fill_blank":
      return "COMPLETE_TERM";
    case "order":
      return "ORDER_ITEMS";
    case "match":
      return "MATCH_ITEMS";
    default:
      return "OPEN";
  }
}

export function mapTypeToLegacyKind(
  type: QuizQuestionType,
): "open" | "mcq" | "true_false" | "fill_blank" | "order" | "match" {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return "mcq";
    case "TRUE_FALSE":
      return "true_false";
    case "COMPLETE_TERM":
      return "fill_blank";
    case "ORDER_ITEMS":
      return "order";
    case "MATCH_ITEMS":
      return "match";
    default:
      return "open";
  }
}
