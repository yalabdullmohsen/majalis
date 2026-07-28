/**
 * Types for Majlisilm Admin Review & Moderation Hub (خانة المراجعة).
 */

export type ReviewStatus =
  | "pending"
  | "high_priority"
  | "flagged_ai"
  | "approved"
  | "rejected";

export type ReviewStream = "recitation" | "content";

export type ContentCategory =
  | "question"
  | "forum"
  | "article"
  | "tafsir_edit";

export type RecitationReviewItem = {
  id: string;
  stream: "recitation";
  status: ReviewStatus;
  priority: "normal" | "high";
  flaggedByAi: boolean;
  userId: string;
  userName: string;
  surah: number;
  ayah: number;
  verseRef: string;
  expectedText: string;
  aiScore: number;
  audioUrl: string;
  /** Normalized waveform peaks 0..1 for custom player. */
  waveform: number[];
  submittedAt: string;
  notes?: string;
  feedback?: string;
  overriddenScore?: number;
};

export type ContentReviewItem = {
  id: string;
  stream: "content";
  status: ReviewStatus;
  priority: "normal" | "high";
  flaggedByAi: boolean;
  userId: string;
  userName: string;
  category: ContentCategory;
  title: string;
  originalText: string;
  editedText: string;
  submittedAt: string;
  notes?: string;
  feedback?: string;
};

export type ReviewItem = RecitationReviewItem | ContentReviewItem;

export type ReviewFilterTab =
  | "pending"
  | "high_priority"
  | "flagged_ai"
  | "approved"
  | "rejected";

export type ReviewHubMetrics = {
  totalPending: number;
  dailyRecitationVerifications: number;
  activeScholars: number;
  systemAccuracyRate: number;
};

export type ReviewHubSnapshot = {
  items: ReviewItem[];
  filter: ReviewFilterTab;
  streamFocus: "all" | ReviewStream;
  searchQuery: string;
  selectedIds: string[];
  metrics: ReviewHubMetrics;
  darkMode: boolean;
  sidebarCollapsed: boolean;
};

export const CONTENT_CATEGORY_LABELS: Record<ContentCategory, string> = {
  question: "سؤال مجتمعي",
  forum: "نقاش منتدى",
  article: "مقال علمي",
  tafsir_edit: "تعديل تفسير",
};

export const FILTER_TAB_LABELS: Record<ReviewFilterTab, string> = {
  pending: "قيد الانتظار",
  high_priority: "أولوية عالية",
  flagged_ai: "مُعلَّم بالذكاء",
  approved: "مقبول",
  rejected: "مرفوض",
};
