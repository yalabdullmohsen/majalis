/** Supported personal library content types */
export type LibraryContentType =
  | "lesson"
  | "book"
  | "mutoon"
  | "research"
  | "benefit"
  | "fatwa"
  | "circle"
  | "ayah"
  | "hadith"
  | "mushaf_page"
  | "qa"
  | "scholar"
  | "course"
  | "episode";

export type LibraryFolder = {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  sort_order: number;
  is_system: boolean;
};

export type LibraryItem = {
  id: string;
  user_id: string;
  content_type: LibraryContentType | string;
  content_id: string;
  title?: string;
  content_url?: string;
  note?: string;
  folder_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
};

export type ContentNote = {
  id: string;
  content_type: string;
  content_id: string;
  title?: string;
  body: string;
  highlights?: string[];
  tags?: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type LearningPlan = {
  id: string;
  level: string;
  interests: string[];
  daily_minutes: number;
  goal: string;
  plan_data: Record<string, unknown>;
  weekly_goals: unknown[];
  monthly_goals: unknown[];
  progress: Record<string, unknown>;
  reminders_enabled: boolean;
  onboarding_done: boolean;
};

export type AcademicProfileStats = {
  completed_lessons: number;
  saved_lessons: number;
  study_hours: number;
  total_platform_minutes: number;
  books_read: number;
  mutoon_studied: number;
  research_read: number;
  questions_answered: number;
  qa_success_rate: number;
  last_activity?: string;
  top_subjects: Array<{ name: string; count: number }>;
  top_scholars: Array<{ name: string; count: number }>;
  achievements: Array<{ key: string; title: string; earned_at?: string }>;
  certificates: Array<{ code: string; title: string; issued_at: string }>;
  current_streak: number;
  longest_streak: number;
  scientific_level: number;
  library_total: number;
  notes_total: number;
  followed_scholars: number;
};

export const DEFAULT_FOLDERS: Array<{ name: string; slug: string; icon: string }> = [
  { name: "العقيدة", slug: "aqeedah", icon: "📿" },
  { name: "الفقه", slug: "fiqh", icon: "⚖️" },
  { name: "التفسير", slug: "tafsir", icon: "📖" },
  { name: "السيرة", slug: "seerah", icon: "🕌" },
  { name: "للقراءة لاحقًا", slug: "read-later", icon: "⏳" },
  { name: "المفضلة", slug: "favorites", icon: "⭐" },
];

export const LIBRARY_TYPE_LABELS: Record<string, string> = {
  lesson: "درس",
  book: "كتاب",
  mutoon: "متن",
  research: "بحث",
  benefit: "فائدة",
  fatwa: "فتوى",
  circle: "حلقة",
  ayah: "آية",
  hadith: "حديث",
  mushaf_page: "صفحة مصحف",
  qa: "سؤال",
  scholar: "شيخ",
  course: "دورة",
  episode: "حلقة إذاعية",
};

export const REPORT_TYPES = [
  { value: "خطأ_علمي", label: "خطأ علمي" },
  { value: "خطأ_إملائي", label: "خطأ إملائي" },
  { value: "رابط_مكسور", label: "رابط معطل" },
  { value: "اقتراح_إضافة", label: "اقتراح إضافة" },
  { value: "تصحيح_معلومة", label: "تصحيح معلومة" },
  { value: "تحديث_شيخ", label: "تحديث بيانات شيخ" },
  { value: "إضافة_مرجع", label: "إضافة مرجع" },
  { value: "محتوى_غير_لائق", label: "محتوى غير لائق" },
  { value: "أخرى", label: "أخرى" },
] as const;

export const CONTENT_ROUTE_MAP: Record<string, (id: string) => string> = {
  lesson: (id) => `/lessons/${id}`,
  book: (id) => `/library/${id}`,
  research: (id) => `/research/${id}`,
  benefit: () => `/fawaid`,
  fatwa: () => `/fatwa`,
  qa: () => `/qa`,
  scholar: (id) => `/sheikhs/${id}`,
  course: (id) => `/lessons/${id}`,
  circle: () => `/quran-scientific-circles`,
  ayah: () => `/quran`,
  hadith: () => `/arbaeen-nawawi`,
  mushaf_page: () => `/quran/mushaf`,
};
