import type { EvidenceRef, PlatformContentStatus } from "./platform-types";

export type ScholarOpinion = {
  scholar: string;
  opinion: string;
  isPrevailing?: boolean;
};

export type RulingSortMode = "newest" | "views" | "importance" | "search";

export type ShariaRulingExtended = {
  id: string;
  external_key?: string;
  slug?: string;
  title: string;
  summary?: string;
  body: string;
  category: string;
  subcategory?: string;
  subcategories?: string[];
  quran_evidence?: EvidenceRef[];
  sunnah_evidence?: EvidenceRef[];
  scholar_opinions?: ScholarOpinion[];
  prevailing_view?: string;
  evidence?: EvidenceRef[];
  references?: EvidenceRef[];
  hadith_grade?: string;
  keywords?: string[];
  benefits?: string[];
  importance_score?: number;
  popularity_score?: number;
  search_count?: number;
  view_count?: number;
  status?: PlatformContentStatus;
  verification_status?: "draft" | "pending" | "approved" | "rejected" | "archived";
  related_ids?: string[];
  linked_qa_ids?: string[];
  linked_lesson_ids?: string[];
  linked_fatwa_ids?: string[];
  linked_fiqh_ids?: string[];
  source_origin?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type RulingListOptions = {
  category?: string;
  subcategory?: string;
  search?: string;
  sort?: RulingSortMode;
  page?: number;
  limit?: number;
};

export type RulingListResult = {
  data: ShariaRulingExtended[];
  total: number;
  page: number;
  limit: number;
  usingSeed: boolean;
  /** True when DB table exists but has zero rows — run seed migration. */
  needsSeed?: boolean;
  dbError?: string;
};

export type CategoryStat = {
  category: string;
  subcategory?: string;
  count: number;
};

export const RULING_SORT_LABELS: Record<RulingSortMode, string> = {
  newest: "الأحدث",
  views: "الأكثر زيارة",
  importance: "الأكثر أهمية",
  search: "الأكثر بحثاً",
};

export type RulingImportRow = Partial<ShariaRulingExtended> & {
  title: string;
  body: string;
  category: string;
};

export type RulingValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type RulingRelationLink = {
  type: "qa" | "lesson" | "fatwa" | "fiqh" | "ruling" | "fawaid" | "article";
  id: string;
  title: string;
  href: string;
  meta?: string;
};
