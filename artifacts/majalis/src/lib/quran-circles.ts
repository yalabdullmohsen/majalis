/** حلقات القرآن — types, seed, filter/search */

export const QURAN_CIRCLE_CATEGORIES = [
  "حفظ",
  "مراجعة",
  "إجازة",
  "تصحيح تلاوة",
  "براعم",
  "نساء",
  "رجال",
  "أطفال",
] as const;

export type QuranCircleCategory = (typeof QURAN_CIRCLE_CATEGORIES)[number];

export type QuranCircleLevel = "مبتدئ" | "متوسط" | "متقدم" | "حفظ كامل";

export type QuranCircle = {
  id: string;
  external_key?: string;
  name: string;
  sheikh_name: string;
  level: QuranCircleLevel;
  city: string;
  days: string;
  time: string;
  age_group: string;
  registration_method: string;
  seats_total?: number;
  seats_available?: number;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  description: string;
  categories: QuranCircleCategory[];
  mosque_name?: string;
  registration_url?: string;
  status: "open" | "full" | "closed";
};

export const QURAN_CIRCLES_SEED: QuranCircle[] = [
  {
    id: "halaqa-hifz-kuwait-city",
    external_key: "halaqa-hifz-kuwait-city",
    name: "حلقة حفظ القرآن — الكويت",
    sheikh_name: "الشيخ فهد الدوسري",
    level: "متوسط",
    city: "الكويت",
    days: "الأحد — الخميس",
    time: "بعد صلاة العصر",
    age_group: "12 — 25 سنة",
    registration_method: "تسجيل مسبق في المسجد",
    seats_total: 30,
    seats_available: 8,
    start_date: "2026-09-01",
    end_date: "2027-06-30",
    image_url: "/logo.png",
    description: "حلقة منتظمة لحفظ القرآن الكريم مع مراجعة أسبوعية وتسميع يومي. تُركّز على تصحيح التلاوة وبناء الحفظ المتقن.",
    categories: ["حفظ", "رجال"],
    mosque_name: "مسجد الصباح",
    registration_url: "/contact",
    status: "open",
  },
  {
    id: "halaqa-muraja-khaitan",
    external_key: "halaqa-muraja-khaitan",
    name: "حلقة مراجعة القرآن — خيطان",
    sheikh_name: "الشيخ سالم العجمي",
    level: "متقدم",
    city: "خيطان",
    days: "السبت — الاثنين — الأربعاء",
    time: "بعد صلاة المغرب",
    age_group: "18+",
    registration_method: "حضور شخصي",
    seats_total: 20,
    seats_available: 3,
    description: "مراجعة جزء يومي مع ضبط أحكام التجويد وترتيل متقن للحفظة.",
    categories: ["مراجعة", "رجال"],
    mosque_name: "مسجد الأنصاري",
    status: "open",
  },
  {
    id: "halaqa-women-farwaniya",
    external_key: "halaqa-women-farwaniya",
    name: "حلقة نسائية — حفظ ومراجعة",
    sheikh_name: "الأستاذة نورة المطيري",
    level: "مبتدئ",
    city: "الفروانية",
    days: "الأحد — الثلاثاء",
    time: "10:00 صباحاً",
    age_group: "نساء — 16+",
    registration_method: "واتساب المسجد",
    seats_total: 15,
    seats_available: 5,
    description: "حلقة نسائية للمبتدئات في الحفظ مع أساسيات التجويد.",
    categories: ["حفظ", "نساء"],
    mosque_name: "مسجد المهري",
    status: "open",
  },
  {
    id: "halaqa-baraem-jahra",
    external_key: "halaqa-baraem-jahra",
    name: "حلقة براعم القرآن — الجهراء",
    sheikh_name: "الشيخ محمد الشلاحي",
    level: "مبتدئ",
    city: "الجهراء",
    days: "السبت",
    time: "5:00 مساءً",
    age_group: "7 — 12 سنة",
    registration_method: "تسجيل ولي الأمر",
    seats_total: 25,
    seats_available: 12,
    description: "تأسيس الحفظ للأطفال بأسلوب تربوي ممتع مع حفظ قصار السور.",
    categories: ["براعم", "أطفال", "حفظ"],
    mosque_name: "مسجد الشلاحي",
    status: "open",
  },
  {
    id: "halaqa-tajweed-correction",
    external_key: "halaqa-tajweed-correction",
    name: "حلقة تصحيح التلاوة",
    sheikh_name: "الشيخ عثمان الخميس",
    level: "متقدم",
    city: "الكويت",
    days: "الجمعة",
    time: "بعد صلاة العشاء",
    age_group: "جميع الأعمار",
    registration_method: "حجز موعد",
    seats_total: 10,
    seats_available: 2,
    description: "جلسات فردية وجماعية لتصحيح التلاوة وضبط مخارج الحروف.",
    categories: ["تصحيح تلاوة", "رجال", "نساء"],
    status: "open",
  },
  {
    id: "halaqa-ijaza-hadith",
    external_key: "halaqa-ijaza-hadith",
    name: "حلقة إجازة القرآن",
    sheikh_name: "الشيخ عبدالله النملة",
    level: "حفظ كامل",
    city: "الكويت",
    days: "حسب الموعد",
    time: "مرن",
    age_group: "18+",
    registration_method: "مقابلة مع الشيخ",
    description: "إجازة بالقرآن الكريم بالسند المتصل للحفظة المتقنين.",
    categories: ["إجازة", "رجال"],
    status: "open",
  },
];

export type QuranCircleFilters = {
  search: string;
  category: string;
  city: string;
  level: string;
};

export const DEFAULT_QURAN_CIRCLE_FILTERS: QuranCircleFilters = {
  search: "",
  category: "",
  city: "",
  level: "",
};

export function filterQuranCircles(
  circles: QuranCircle[],
  filters: QuranCircleFilters,
): QuranCircle[] {
  const q = filters.search.trim().toLowerCase();
  return circles.filter((c) => {
    if (filters.category && !c.categories.includes(filters.category as QuranCircleCategory)) return false;
    if (filters.city && c.city !== filters.city) return false;
    if (filters.level && c.level !== filters.level) return false;
    if (!q) return true;
    const hay = [
      c.name,
      c.sheikh_name,
      c.city,
      c.description,
      c.mosque_name,
      ...c.categories,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function getQuranCircleCities(circles: QuranCircle[]): string[] {
  return [...new Set(circles.map((c) => c.city))].sort();
}

export function getQuranCircles(): QuranCircle[] {
  if (typeof window === "undefined") return QURAN_CIRCLES_SEED;
  try {
    const stored = JSON.parse(localStorage.getItem("majlis_admin_quran_circles") || "[]");
    if (Array.isArray(stored) && stored.length > 0) return stored as QuranCircle[];
  } catch {
    /* ignore */
  }
  return QURAN_CIRCLES_SEED;
}

export function getQuranCircleById(id: string): QuranCircle | undefined {
  return getQuranCircles().find((c) => c.id === id);
}
