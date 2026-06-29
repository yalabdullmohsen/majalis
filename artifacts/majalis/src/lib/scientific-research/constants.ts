import type { CopyrightType, ResearchDegreeType } from "./types";

/** Canonical public path — /scientific-research redirects here for backward compatibility */
export const RESEARCH_BASE_PATH = "/research";

export const DEGREE_LABELS: Record<ResearchDegreeType, string> = {
  phd: "دكتوراه",
  masters: "ماجستير",
  bachelors: "بكالوريوس",
  graduation: "مشروع تخرج",
  peer_reviewed: "بحث محكّم",
  scientific_paper: "ورقة علمية",
  working_paper: "بحث علمي",
  sharia_research: "بحث شرعي",
  academic: "بحث أكاديمي",
};

export const COPYRIGHT_LABELS: Record<CopyrightType, string> = {
  all_rights_reserved: "جميع الحقوق محفوظة",
  download_only: "يسمح بالتحميل فقط",
  read_only: "يسمح بالقراءة فقط",
  cite_with_attribution: "يسمح بالاقتباس مع ذكر المصدر",
  creative_commons: "رخصة Creative Commons",
  custom: "شروط خاصة",
};

export const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "views", label: "الأكثر مشاهدة" },
  { value: "downloads", label: "الأكثر تحميلاً" },
  { value: "rating", label: "الأعلى تقييماً" },
  { value: "saves", label: "الأكثر حفظاً" },
] as const;

export const DEGREE_FILTERS: { value: ResearchDegreeType; label: string }[] = [
  { value: "phd", label: "دكتوراه" },
  { value: "masters", label: "ماجستير" },
  { value: "bachelors", label: "بكالوريوس" },
  { value: "working_paper", label: "بحث علمي" },
  { value: "scientific_paper", label: "ورقة علمية" },
];

export const CATEGORY_CARDS = [
  { slug: "latest", icon: "📘", label: "أحدث الرسائل" },
  { slug: "phd", icon: "🎓", label: "رسائل الدكتوراه" },
  { slug: "masters", icon: "📚", label: "رسائل الماجستير" },
  { slug: "bachelors", icon: "📝", label: "أبحاث البكالوريوس" },
  { slug: "sharia", icon: "⚖️", label: "البحوث الشرعية" },
  { slug: "quran-sciences", icon: "📖", label: "علوم القرآن" },
  { slug: "hadith", icon: "📜", label: "الحديث" },
  { slug: "fiqh", icon: "⚙️", label: "الفقه" },
  { slug: "aqeedah", icon: "🕌", label: "العقيدة" },
  { slug: "usul-fiqh", icon: "🧠", label: "أصول الفقه" },
  { slug: "dawah", icon: "🌍", label: "الدعوة" },
  { slug: "islamic-economics", icon: "📈", label: "الاقتصاد الإسلامي" },
  { slug: "islamic-history", icon: "🏛", label: "التاريخ الإسلامي" },
  { slug: "arabic-language", icon: "🎙", label: "اللغة العربية" },
  { slug: "peer-reviewed", icon: "🔬", label: "الأبحاث المحكمة" },
  { slug: "scientific-papers", icon: "📄", label: "الأوراق العلمية" },
];

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const ALLOWED_MIME = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip"];
