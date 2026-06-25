export type PlatformContentStatus = "draft" | "pending" | "approved" | "archived" | "rejected";

export type FiqhDecisionType = "قرار" | "بحث" | "توصية" | "بيان" | "فتوى جماعية";

export type FiqhCategory =
  | "العبادات"
  | "المعاملات"
  | "الأسرة"
  | "الطب"
  | "الاقتصاد"
  | "قضايا معاصرة"
  | "الأقليات المسلمة";

export type FiqhDecision = {
  id: string;
  external_key?: string;
  title: string;
  summary?: string;
  body?: string;
  decision_type: FiqhDecisionType;
  category: FiqhCategory;
  session_number?: string;
  decision_date?: string;
  source_urls?: string[];
  references?: EvidenceRef[];
  keywords?: string[];
  status?: PlatformContentStatus;
  view_count?: number;
  search_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type FatwaFormat = "written" | "audio" | "both";

export type Fatwa = {
  id: string;
  external_key?: string;
  question: string;
  answer: string;
  summary?: string;
  category: string;
  format: FatwaFormat;
  audio_url?: string;
  mufti_name?: string;
  source_urls?: string[];
  references?: EvidenceRef[];
  keywords?: string[];
  status?: PlatformContentStatus;
  view_count?: number;
  search_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type RulingCategory =
  | "العبادات"
  | "الطهارة"
  | "الصلاة"
  | "الزكاة"
  | "الصيام"
  | "الحج"
  | "الأسرة"
  | "البيوت"
  | "المعاملات"
  | "القضاء"
  | "المواريث"
  | "النوازل"
  | "السياسة الشرعية";

export type ShariaRuling = {
  id: string;
  external_key?: string;
  title: string;
  summary?: string;
  body: string;
  category: RulingCategory;
  evidence?: EvidenceRef[];
  references?: EvidenceRef[];
  keywords?: string[];
  status?: PlatformContentStatus;
  view_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type CourseType = "سنوية" | "موسمية" | "برنامج" | "متن";

export type ScheduleEntry = {
  day?: string;
  time?: string;
  topic?: string;
  sheikh?: string;
};

export type AnnualCourse = {
  id: string;
  external_key?: string;
  title: string;
  summary?: string;
  body?: string;
  course_type: CourseType;
  season?: string;
  year?: number;
  sheikh_names?: string[];
  mutoon?: string[];
  schedule?: ScheduleEntry[];
  venue_name?: string;
  venue_address?: string;
  venue_city?: string;
  map_url?: string;
  registration_url?: string;
  registration_open?: boolean;
  start_date?: string;
  end_date?: string;
  keywords?: string[];
  status?: PlatformContentStatus;
  view_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type UpdateType = "قرار" | "فتوى" | "درس" | "دورة" | "كتاب" | "إعلان" | "خبر علمي";

export type PlatformUpdate = {
  id: string;
  external_key?: string;
  title: string;
  summary?: string;
  body?: string;
  update_type: UpdateType;
  source_type?: string;
  source_id?: string;
  source_url?: string;
  published_at?: string;
  status?: PlatformContentStatus;
  created_at?: string;
  updated_at?: string;
};

export type EvidenceRef = {
  type?: string;
  text: string;
  source?: string;
  url?: string;
};

export const FIQH_CATEGORIES: FiqhCategory[] = [
  "العبادات",
  "المعاملات",
  "الأسرة",
  "الطب",
  "الاقتصاد",
  "قضايا معاصرة",
  "الأقليات المسلمة",
];

export const FIQH_DECISION_TYPES: FiqhDecisionType[] = [
  "قرار",
  "بحث",
  "توصية",
  "بيان",
  "فتوى جماعية",
];

export const FATWA_CATEGORIES = [
  "العبادات",
  "الطهارة",
  "الصلاة",
  "الزكاة",
  "الصيام",
  "الحج",
  "المعاملات",
  "الأسرة",
  "الأطعمة",
  "اللباس",
  "الطب",
  "النوازل",
  "فقه عام",
] as const;

export const RULING_CATEGORIES: RulingCategory[] = [
  "العبادات",
  "الطهارة",
  "الصلاة",
  "الزكاة",
  "الصيام",
  "الحج",
  "الأسرة",
  "البيوت",
  "المعاملات",
  "القضاء",
  "المواريث",
  "النوازل",
  "السياسة الشرعية",
];

export const COURSE_TYPES: CourseType[] = ["سنوية", "موسمية", "برنامج", "متن"];

export const UPDATE_TYPES: UpdateType[] = [
  "قرار",
  "فتوى",
  "درس",
  "دورة",
  "كتاب",
  "إعلان",
  "خبر علمي",
];
