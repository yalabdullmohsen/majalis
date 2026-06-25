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
  session_id?: string;
  documentation_level?: "official_verified" | "imported_needs_review" | "admin_summary" | "rejected" | "archived";
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

export type FiqhCouncilSession = {
  id: string;
  slug: string;
  council_source_id?: string;
  session_title: string;
  session_number?: string;
  session_type?: string;
  status: "upcoming" | "active" | "completed" | "archived" | "unknown";
  start_date?: string;
  end_date?: string;
  location?: string;
  country?: string;
  city?: string;
  agenda?: string;
  topics?: string[];
  resolutions_count?: number;
  recommendations_count?: number;
  fatwas_count?: number;
  official_source_url?: string;
  official_document_url?: string;
  verification_status: "verified" | "pending" | "unavailable";
  publish_status?: "draft" | "needs_review" | "verified_pending_publish" | "published" | "archived";
  published_at?: string;
  updated_at?: string;
  created_at?: string;
  /** Populated on detail */
  items?: FiqhCouncilItem[];
};

export type FiqhLiveData = {
  last_session: FiqhCouncilSession | null;
  upcoming_session: FiqhCouncilSession | null;
  latest_resolutions: Array<{ slug: string; title: string; category?: string; session_date?: string }>;
  latest_recommendations: Array<{ slug: string; title: string; category?: string; session_date?: string }>;
  latest_fatwas: Array<{ slug: string; title: string; category?: string; session_date?: string }>;
};

export type FiqhAdminAlert = {
  id: string;
  alert_type: string;
  title: string;
  message?: string;
  entity_type?: string;
  entity_id?: string;
  severity: "info" | "warning" | "error";
  is_read: boolean;
  created_at?: string;
};

export const FIQH_SESSION_STATUS_LABELS: Record<FiqhCouncilSession["status"], string> = {
  upcoming: "قادمة",
  active: "جارية",
  completed: "منعقدة",
  archived: "مؤرشفة",
  unknown: "غير محددة",
};

export const FIQH_VERIFICATION_STATUS_LABELS: Record<FiqhCouncilSession["verification_status"], string> = {
  verified: "مؤكد من مصدر رسمي",
  pending: "بانتظار التحديث",
  unavailable: "غير متوفر",
};

export function fiqhSessionHref(slug: string) {
  return `/fiqh-council/sessions/${slug}`;
}

export type FiqhCouncilIssue = {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  description?: string;
  category: string;
  subcategory?: string;
  ruling_summary?: string;
  evidence_summary?: string;
  documentation_level?: "official_verified" | "imported_needs_review" | "admin_summary" | "rejected" | "archived";
  status?: "draft" | "review" | "published" | "archived";
  views_count?: number;
  published_at?: string;
  updated_at?: string;
  created_at?: string;
  /** Populated on detail fetch */
  items?: FiqhCouncilItem[];
  timeline?: FiqhTimelineEvent[];
};

export type FiqhTimelineEvent = {
  id: string;
  issue_id?: string;
  event_type: "first_research" | "first_resolution" | "later_resolution" | "recommendation" | "update" | "statement" | "other";
  title: string;
  description?: string;
  event_date?: string;
  item_id?: string;
  sort_order?: number;
  /** Populated from item */
  item?: FiqhCouncilItem;
};

export type FiqhSuggestedRelation = {
  id: string;
  item_id: string;
  related_item_id: string;
  similarity_score: number;
  match_reasons: string[];
  status: "pending" | "approved" | "rejected" | "merged";
  reviewed_by?: string;
  review_notes?: string;
  created_at?: string;
  reviewed_at?: string;
  item?: FiqhCouncilItem;
  related_item?: FiqhCouncilItem;
};

export type FiqhApprovedRelation = {
  id: string;
  item_id: string;
  related_item_id: string;
  relation_type: "similar" | "related" | "same_topic" | "same_source" | "same_category";
  source?: "manual" | "auto_approved";
  created_at?: string;
  related_item?: FiqhCouncilItem;
};

export type FiqhPublicStats = {
  resolutions: number;
  fatwas: number;
  recommendations: number;
  research: number;
  issues: number;
  pending_review: number;
  top_categories: Array<{ category: string; cnt: number }>;
  top_viewed: Array<{ slug: string; title: string; views_count: number; type: string; category: string }>;
  latest: Array<{ slug: string; title: string; published_at: string; type: string; category: string }>;
  top_sources: Array<{ source_name: string; cnt: number }>;
};

export const FIQH_TIMELINE_EVENT_LABELS: Record<FiqhTimelineEvent["event_type"], string> = {
  first_research: "أول بحث",
  first_resolution: "أول قرار",
  later_resolution: "قرار لاحق",
  recommendation: "توصية",
  update: "تحديث",
  statement: "بيان",
  other: "حدث",
};

export const FIQH_TOPIC_INDEX_SECTIONS = [
  { key: "worship", label: "العبادات", categories: ["العبادات", "الحج والعمرة", "الزكاة والوقف"] },
  { key: "transactions", label: "المعاملات", categories: ["المعاملات", "الاقتصاد الإسلامي"] },
  { key: "family", label: "الأسرة", categories: ["الأسرة"] },
  { key: "nawazil", label: "النوازل", categories: ["النوازل المعاصرة", "القضايا المعاصرة", "الطب والنوازل"] },
  { key: "economy", label: "الاقتصاد", categories: ["الاقتصاد الإسلامي", "الزكاة والوقف"] },
  { key: "medicine", label: "الطب", categories: ["الطب والنوازل"] },
  { key: "minorities", label: "الأقليات", categories: ["الأقليات المسلمة"] },
  { key: "technology", label: "التقنية", nawazilTopics: ["crypto", "ai", "digital"] },
  { key: "ai", label: "الذكاء الاصطناعي", nawazilTopics: ["ai"] },
] as const;

export function fiqhIssueHref(slug: string) {
  return `/fiqh-council/issues/${slug}`;
}

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
