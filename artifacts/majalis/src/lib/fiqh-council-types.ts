import type { EvidenceRef } from "./platform-types";

export type FiqhItemType = "resolution" | "fatwa" | "research" | "recommendation" | "ruling";

export type FiqhItemStatus = "draft" | "review" | "published" | "archived";

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
  | "الحج والعمرة";

export type FiqhCouncilItem = {
  id: string;
  title: string;
  slug: string;
  type: FiqhItemType;
  category: FiqhCouncilCategory;
  summary?: string;
  content?: string;
  ruling_text?: string;
  evidence?: EvidenceRef[];
  source_name?: string;
  source_url?: string;
  council_name?: string;
  session_number?: string;
  session_date?: string;
  tags?: string[];
  status?: FiqhItemStatus;
  views_count?: number;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
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
  review: "قيد المراجعة",
  published: "منشور",
  archived: "مؤرشف",
};

export const FIQH_COUNCIL_INTRO =
  "المجمع الفقهي الإسلامي مرجع منظم للقرارات والفتاوى الجماعية والبحوث والتوصيات الشرعية، " +
  "يُعنى بقضايا العصر مع الالتزام بضوابط الفقه الإسلامي والمراجع المعتمدة.";

export function fiqhItemHref(slug: string) {
  return `/fiqh-council/${slug}`;
}

export function formatFiqhItemMeta(item: Pick<FiqhCouncilItem, "type" | "category" | "session_date" | "session_number" | "source_name">) {
  return [
    FIQH_ITEM_TYPE_LABELS[item.type],
    item.category,
    item.session_date,
    item.session_number ? `الجلسة ${item.session_number}` : "",
    item.source_name,
  ].filter(Boolean).join(" · ");
}
