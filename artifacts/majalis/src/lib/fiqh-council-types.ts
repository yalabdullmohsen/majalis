import type { EvidenceRef } from "./platform-types";

export type FiqhItemType = "resolution" | "fatwa" | "research" | "recommendation" | "ruling";

export type FiqhItemStatus =
  | "draft"
  | "imported"
  | "needs_review"
  | "review"
  | "approved"
  | "published"
  | "archived"
  | "rejected";

export type FiqhCouncilCategory =
  | "العبادات"
  | "المعاملات"
  | "الأسرة"
  | "الطب والنوازل"
  | "الاقتصاد الإسلامي"
  | "الأقليات المسلمة"
  | "القضايا المعاصرة"
  | "الأطعمة والأشربة"
  | "الزكاة والوقف"
  | "الحج والعمرة"
  | "النوازل المعاصرة";

export type FiqhConfidenceLevel = "high" | "medium" | "low" | "source_verified";
export type FiqhSummarySource = "source" | "admin" | "auto";

export type FiqhCouncilItem = {
  id: string;
  title: string;
  slug: string;
  type: FiqhItemType;
  category: FiqhCouncilCategory | string;
  subcategory?: string;
  category_id?: string;
  subcategory_id?: string;
  summary?: string;
  content?: string;
  ruling_text?: string;
  evidence?: EvidenceRef[];
  key_points?: string[];
  source_name?: string;
  source_url?: string;
  council_name?: string;
  session_number?: string;
  session_date?: string;
  decision_number?: string;
  tags?: string[];
  status?: FiqhItemStatus;
  views_count?: number;
  published_at?: string;
  archived_at?: string;
  external_id?: string;
  source_id?: string;
  content_hash?: string;
  validation_status?: "pending" | "valid" | "invalid" | "needs_review";
  validation_errors?: string[];
  last_synced_at?: string;
  sync_job_id?: string;
  confidence_level?: FiqhConfidenceLevel;
  summary_source?: FiqhSummarySource;
  imported_content?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  nawazil_topic?: string;
  created_at?: string;
  updated_at?: string;
  /** Search relevance rank from RPC */
  rank?: number;
};

export type FiqhCouncilSource = {
  id: string;
  slug: string;
  name: string;
  organization: string;
  source_type: "json_manifest" | "rss" | "api" | "manual";
  base_url: string;
  official_url?: string;
  feed_url?: string;
  trust_level: "official" | "verified" | "disabled";
  is_active: boolean;
  items_imported_count?: number;
  last_error_log?: unknown[];
  last_sync_at?: string;
  last_sync_status?: string;
};

export type FiqhSyncJob = {
  id: string;
  source_id?: string;
  trigger_type: "cron" | "manual" | "retry";
  status: "pending" | "running" | "completed" | "failed" | "partial";
  started_at?: string;
  finished_at?: string;
  total_fetched: number;
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
  duplicate_count: number;
  error_count: number;
  summary?: Record<string, unknown>;
  created_at?: string;
};

export type FiqhDuplicateRecord = {
  id: string;
  item_id: string;
  candidate_id: string;
  similarity_score: number;
  match_reasons: string[];
  status: "pending" | "merged" | "ignored";
  created_at?: string;
  item?: FiqhCouncilItem;
  candidate?: FiqhCouncilItem;
};

export type FiqhAuditEntry = {
  id: string;
  item_id?: string;
  action: string;
  actor_email?: string;
  from_status?: string;
  to_status?: string;
  notes?: string;
  created_at?: string;
};

export type FiqhAdvancedSearchOptions = {
  query?: string;
  type?: FiqhItemType | "الكل";
  category?: string;
  subcategory?: string;
  source?: string;
  year?: number | "الكل";
  tags?: string[];
  nawazilTopic?: string;
  decisionNumber?: string;
  limit?: number;
};

export const FIQH_COUNCIL_CATEGORIES: FiqhCouncilCategory[] = [
  "العبادات",
  "المعاملات",
  "الأسرة",
  "الطب والنوازل",
  "الاقتصاد الإسلامي",
  "الأقليات المسلمة",
  "القضايا المعاصرة",
  "الأطعمة والأشربة",
  "الزكاة والوقف",
  "الحج والعمرة",
  "النوازل المعاصرة",
];

export const FIQH_ITEM_TYPES: FiqhItemType[] = [
  "resolution",
  "fatwa",
  "research",
  "recommendation",
  "ruling",
];

export const FIQH_ITEM_TYPE_LABELS: Record<FiqhItemType, string> = {
  resolution: "قرار",
  fatwa: "فتوى جماعية",
  research: "بحث",
  recommendation: "توصية",
  ruling: "حكم",
};

export const FIQH_ITEM_STATUS_LABELS: Record<FiqhItemStatus, string> = {
  draft: "مسودة",
  imported: "مستورد",
  needs_review: "يحتاج مراجعة",
  review: "قيد المراجعة",
  approved: "معتمد",
  published: "منشور",
  archived: "مؤرشف",
  rejected: "مرفوض",
};

export const FIQH_CONFIDENCE_LABELS: Record<FiqhConfidenceLevel, string> = {
  high: "ثقة عالية",
  medium: "ثقة متوسطة",
  low: "ثقة منخفضة",
  source_verified: "من المصدر الرسمي",
};

export const FIQH_SUMMARY_SOURCE_LABELS: Record<FiqhSummarySource, string> = {
  source: "منقول من المصدر",
  admin: "ملخص إداري",
  auto: "تلخيص آلي — يحتاج مراجعة",
};

/** Statuses visible to public */
export const FIQH_PUBLIC_STATUSES: FiqhItemStatus[] = ["published"];

/** Statuses in review queue */
export const FIQH_REVIEW_STATUSES: FiqhItemStatus[] = ["imported", "needs_review", "review", "approved"];

export const FIQH_COUNCIL_INTRO =
  "المجمع الفقهي الإسلامي مرجع منظم للقرارات والفتاوى الجماعية والبحوث والتوصيات الشرعية، " +
  "يُعنى بقضايا العصر مع الالتزام بضوابط الفقه الإسلامي والمراجع المعتمدة.";

export function fiqhItemHref(slug: string) {
  return `/fiqh-council/${slug}`;
}

export function fiqhCompareHref(slugs: string[]) {
  return `/fiqh-council/compare?items=${slugs.map(encodeURIComponent).join(",")}`;
}

export function normalizeFiqhStatus(status?: string): FiqhItemStatus {
  if (status === "review") return "needs_review";
  return (status as FiqhItemStatus) || "draft";
}

export function isPublicFiqhItem(item: Pick<FiqhCouncilItem, "status">) {
  return item.status === "published";
}

export function formatFiqhItemMeta(
  item: Pick<
    FiqhCouncilItem,
    "type" | "category" | "subcategory" | "session_date" | "session_number" | "source_name" | "decision_number"
  >,
) {
  return [
    FIQH_ITEM_TYPE_LABELS[item.type],
    item.category,
    item.subcategory,
    item.decision_number ? `رقم ${item.decision_number}` : "",
    item.session_date,
    item.session_number ? `الجلسة ${item.session_number}` : "",
    item.source_name,
  ].filter(Boolean).join(" · ");
}
