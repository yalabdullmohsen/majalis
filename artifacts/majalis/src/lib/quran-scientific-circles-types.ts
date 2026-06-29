export type CircleTabGroup = "quran" | "mutoon" | "sharia" | "opportunities";

export type CircleStatus =
  | "draft"
  | "review"
  | "published"
  | "registration_open"
  | "registration_closed"
  | "ongoing"
  | "completed"
  | "archived";

export type RegistrationStatus = "open" | "closed" | "soon" | "full";

export type SortOption =
  | "nearest"
  | "newest"
  | "views"
  | "country"
  | "type";

export type QuranScientificCircle = {
  id: string;
  external_key?: string;
  title: string;
  summary?: string;
  description?: string;
  requirements?: string;
  registration_method?: string;
  category_slug?: string;
  subcategory_slug?: string;
  tab_group: CircleTabGroup;
  circle_type?: string;
  country: string;
  governorate?: string;
  region?: string;
  venue_name?: string;
  organizer?: string;
  sheikh_name?: string;
  supervisor_name?: string;
  target_audience?: string;
  gender_access?: string;
  level?: string;
  days?: string[];
  start_date?: string;
  end_date?: string;
  lesson_time?: string;
  start_time?: string;
  end_time?: string;
  duration_text?: string;
  has_live?: boolean;
  has_attendance?: boolean;
  is_online?: boolean;
  registration_url?: string;
  contact_phone?: string;
  whatsapp_url?: string;
  map_url?: string;
  announcement_url?: string;
  poster_image_url?: string;
  notes?: string;
  has_certificate?: boolean;
  has_ijazah?: boolean;
  has_exam?: boolean;
  is_free?: boolean;
  is_pinned?: boolean;
  is_featured?: boolean;
  status: CircleStatus;
  registration_status?: RegistrationStatus;
  view_count?: number;
  keywords?: string[];
  data_incomplete?: boolean;
  created_at?: string;
  updated_at?: string;
  /** computed */
  timeDisplay?: string;
  prayerRank?: string;
  sortKey?: number;
};

export type CircleFilters = {
  tab: CircleTabGroup | "all";
  search?: string;
  country?: string;
  governorate?: string;
  region?: string;
  category?: string;
  level?: string;
  gender?: string;
  delivery?: "all" | "online" | "offline";
  freeOnly?: boolean;
  hasCertificate?: boolean;
  hasIjazah?: boolean;
  day?: string;
  sort?: SortOption;
  womenOnly?: boolean;
  childrenOnly?: boolean;
};

export const CIRCLE_TABS: { id: CircleTabGroup | "all"; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "quran", label: "حفظ القرآن" },
  { id: "mutoon", label: "حفظ المتون" },
  { id: "sharia", label: "دراسة شرعية" },
  { id: "opportunities", label: "فرص دراسة الشريعة" },
];

export const CIRCLE_COUNTRIES = [
  "الكل",
  "الكويت",
  "السعودية",
  "قطر",
  "الإمارات",
  "البحرين",
  "عُمان",
  "مصر",
  "الأردن",
  "المغرب",
  "تونس",
  "الجزائر",
  "السودان",
  "فلسطين",
  "لبنان",
  "العراق",
  "اليمن",
  "ليبيا",
  "موريتانيا",
  "أخرى",
];

export const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "nearest", label: "الأقرب موعدًا" },
  { id: "newest", label: "الأحدث" },
  { id: "views", label: "الأكثر مشاهدة" },
  { id: "country", label: "حسب الدولة" },
  { id: "type", label: "حسب النوع" },
];

export const STATUS_LABELS: Record<CircleStatus, string> = {
  draft: "مسودة",
  review: "قيد المراجعة",
  published: "منشور",
  registration_open: "التسجيل مفتوح",
  registration_closed: "التسجيل مغلق",
  ongoing: "جاري",
  completed: "مكتمل",
  archived: "مؤرشف",
};

export const REGISTRATION_LABELS: Record<RegistrationStatus, string> = {
  open: "التسجيل مفتوح",
  closed: "التسجيل مغلق",
  soon: "قريبًا",
  full: "مكتمل",
};
