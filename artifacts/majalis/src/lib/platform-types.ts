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

export type QuranCircleType = "حلقة" | "ختمة" | "تجويد" | "حفظ" | "تفسير" | "برنامج";

export type QuranCircle = {
  id: string;
  external_key?: string;
  slug?: string;
  title: string;
  summary?: string;
  body?: string;
  circle_type: QuranCircleType;
  sheikh_name?: string;
  mosque?: string;
  city?: string;
  region?: string;
  country?: string;
  schedule?: ScheduleEntry[];
  day_of_week?: string;
  circle_time?: string;
  start_date?: string;
  end_date?: string;
  capacity?: number;
  registration_open?: boolean;
  registration_url?: string;
  maps_url?: string;
  live_url?: string;
  poster_image_url?: string;
  keywords?: string[];
  status?: PlatformContentStatus;
  view_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type MutoonCategory = "متن" | "نظم" | "مختصر" | "شرح" | "منظومة";
export type MutoonLevel = "مبتدئ" | "متوسط" | "متقدم";

export type MutoonText = {
  id: string;
  external_key?: string;
  slug?: string;
  title: string;
  author?: string;
  summary?: string;
  body?: string;
  category: MutoonCategory;
  level?: MutoonLevel;
  total_pages?: number;
  total_lessons?: number;
  sheikh_names?: string[];
  keywords?: string[];
  cover_image_url?: string;
  source_url?: string;
  status?: PlatformContentStatus;
  view_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type MutoonLesson = {
  id: string;
  mutoon_id: string;
  sort_order: number;
  title: string;
  summary?: string;
  body?: string;
  page_start?: number;
  page_end?: number;
  audio_url?: string;
  video_url?: string;
  explanation_url?: string;
  status?: PlatformContentStatus;
};

export type ContactMessage = {
  id?: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  category?: "general" | "content_error" | "suggestion" | "technical" | "account" | "other";
  status?: "new" | "read" | "in_progress" | "resolved" | "archived";
  admin_notes?: string;
  created_at?: string;
};

export type UserMutoonProgress = {
  id?: string;
  user_id?: string;
  mutoon_id: string;
  progress_pct: number;
  last_lesson_id?: string;
  last_page?: number;
  last_explanation?: string;
  quiz_scores?: Array<{ quiz_id: string; score: number; at: string }>;
  completed_at?: string;
};

export type UserQuranCircleEnrollment = {
  id?: string;
  user_id?: string;
  circle_id: string;
  status: "registered" | "active" | "completed" | "withdrawn" | "waitlist";
  rating?: number;
  rating_comment?: string;
  enrolled_at?: string;
};

export const QURAN_CIRCLE_TYPES: QuranCircleType[] = ["حلقة", "ختمة", "تجويد", "حفظ", "تفسير", "برنامج"];
export const MUTOON_CATEGORIES: MutoonCategory[] = ["متن", "نظم", "مختصر", "شرح", "منظومة"];
export const MUTOON_LEVELS: MutoonLevel[] = ["مبتدئ", "متوسط", "متقدم"];
export const CONTACT_CATEGORIES = [
  { value: "general", label: "استفسار عام" },
  { value: "content_error", label: "خطأ في المحتوى" },
  { value: "suggestion", label: "اقتراح محتوى" },
  { value: "technical", label: "مشكلة تقنية" },
  { value: "account", label: "الحساب" },
  { value: "other", label: "أخرى" },
] as const;
