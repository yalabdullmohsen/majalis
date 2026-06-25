/** Unified CMS content kinds — maps to DB tables via content-registry. */
export type CmsContentKind =
  | "lesson"
  | "lecture"
  | "course"
  | "sheikh"
  | "book"
  | "fatwa"
  | "article"
  | "news"
  | "announcement"
  | "fawaid"
  | "qa"
  | "miracle"
  | "fiqh_decision"
  | "sharia_ruling"
  | "annual_course";

export type CmsWorkflowStatus =
  | "draft"
  | "pending"
  | "approved"
  | "published"
  | "archived"
  | "rejected";

export type ImportJobStatus = "pending" | "running" | "completed" | "failed" | "partial";

export type ImportRowAction = "insert" | "update" | "skip" | "duplicate" | "error";

export type ContentSourceType = "manual" | "json" | "api" | "rss" | "csv" | "cron";

export type CmsContentRecord = {
  kind: CmsContentKind;
  id?: string;
  external_key?: string;
  slug?: string;
  title: string;
  summary?: string;
  body?: string;
  speaker_name?: string;
  category?: string;
  status?: CmsWorkflowStatus;
  published_at?: string;
  scheduled_at?: string;
  archived_at?: string;
  source_urls?: string[];
  metadata?: Record<string, unknown>;
  /** Original row from import source */
  raw?: Record<string, unknown>;
};

export type DedupMatch = {
  matchType: "external_key" | "slug" | "hash" | "title_speaker" | "fuzzy_title";
  existingId: string;
  existingTable: string;
  score: number;
  external_key?: string;
};

export type DedupResult = {
  isDuplicate: boolean;
  matches: DedupMatch[];
  contentHash: string;
  slug: string;
  titleNorm: string;
  speakerNorm: string;
};

export type ImportJobSummary = {
  id?: string;
  sourceSlug: string;
  contentKind: CmsContentKind;
  status: ImportJobStatus;
  totalRows: number;
  inserted: number;
  updated: number;
  skipped: number;
  duplicates: number;
  errors: number;
  startedAt?: string;
  finishedAt?: string;
  rowLog: ImportRowLog[];
};

export type ImportRowLog = {
  rowIndex: number;
  action: ImportRowAction;
  external_key?: string;
  record_id?: string;
  duplicate_of?: string;
  message?: string;
};

export type AggregatorPipelineResult = {
  record: CmsContentRecord;
  dedup: DedupResult;
  cleaned: boolean;
  linkErrors: string[];
};

export const CMS_CONTENT_KINDS: CmsContentKind[] = [
  "lesson", "lecture", "course", "sheikh", "book", "fatwa", "article",
  "news", "announcement", "fawaid", "qa", "miracle",
  "fiqh_decision", "sharia_ruling", "annual_course",
];

export const CMS_KIND_LABELS: Record<CmsContentKind, string> = {
  lesson: "درس",
  lecture: "محاضرة",
  course: "دورة",
  sheikh: "شيخ",
  book: "كتاب",
  fatwa: "فتوى",
  article: "مقال",
  news: "خبر علمي",
  announcement: "إعلان",
  fawaid: "فائدة",
  qa: "سؤال وجواب",
  miracle: "إعجاز علمي",
  fiqh_decision: "قرار فقهي",
  sharia_ruling: "حكم شرعي",
  annual_course: "دورة علمية",
};
