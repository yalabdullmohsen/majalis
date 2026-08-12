export type PlatformContentStatus = "draft" | "pending" | "approved" | "archived" | "rejected";

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

// اكتُشف بالفحص المباشر 2026-07-18: هذا النوع كان يعكس تصنيفاً قديماً
// (13 قيمة) لا يطابق RULINGS_CATEGORY_TREE الحالية في rulings-categories.ts
// (20 قيمة، المصدر الفعلي المُستهلَك في RulingsPage.tsx الحية) — ما سبَّب
// اختفاء 19 حكماً شرعياً صامتاً من فلاتر الصفحة الحية رغم صحة بياناتها
// (كانت مُصنَّفة "الحج"/"المواريث"/"النوازل" القديمة بدل "الحج والعمرة"/
// "المواريث والوصايا"/"النوازل المعاصرة" الحالية). حُدِّث النوع ليطابق
// التصنيف الحالي حرفياً بدل القديم — راجع RULINGS_CATEGORY_TREE للمصدر
// الأصلي إن لزم توسيع مستقبلي.
export type RulingCategory =
  | "العقيدة"
  | "الطهارة"
  | "الصلاة"
  | "الزكاة"
  | "الصيام"
  | "الحج والعمرة"
  | "المعاملات"
  | "الأطعمة والأشربة"
  | "اللباس والزينة"
  | "الأسرة"
  | "المواريث والوصايا"
  | "القضاء والحدود"
  | "الأيمان والنذور"
  | "الجهاد والسياسة الشرعية"
  | "الأخلاق والآداب"
  | "الأذكار والدعاء"
  | "القرآن والحديث"
  | "طلب العلم والدعوة"
  | "النوازل المعاصرة"
  | "الجنائز";

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
  "العقيدة",
  "الطهارة",
  "الصلاة",
  "الزكاة",
  "الصيام",
  "الحج والعمرة",
  "المعاملات",
  "الأطعمة والأشربة",
  "اللباس والزينة",
  "الأسرة",
  "المواريث والوصايا",
  "القضاء والحدود",
  "الأيمان والنذور",
  "الجهاد والسياسة الشرعية",
  "الأخلاق والآداب",
  "الأذكار والدعاء",
  "القرآن والحديث",
  "طلب العلم والدعوة",
  "النوازل المعاصرة",
  "الجنائز",
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
