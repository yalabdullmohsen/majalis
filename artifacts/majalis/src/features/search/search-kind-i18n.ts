/**
 * تسميات أنواع نتائج البحث — عربي فقط (SSOT).
 * ممنوع عرض المفتاح الإنجليزي للمستخدم.
 */

export type SearchKindFamily =
  | "quran"
  | "hadith"
  | "lesson"
  | "history"
  | "seerah"
  | "scholar"
  | "university"
  | "mosque"
  | "landmark"
  | "institution"
  | "fiqh"
  | "tafsir"
  | "adhkar"
  | "fawaid"
  | "prophet"
  | "article"
  | "generic";

/** تسمية عربية قصيرة للنوع — لا تُرجع الإنجليزية أبدًا. */
export const SEARCH_KIND_LABELS_AR: Record<string, string> = {
  all: "الكل",
  quran: "قرآن",
  surah: "سورة",
  ayah: "آية",
  page: "صفحة مصحف",
  tafsir: "تفسير",
  "tafsir-audio": "تفسير صوتي",
  ulum: "علوم قرآن",
  tajweed: "تجويد",
  hifz: "حفظ",
  hadith: "حديث",
  lesson: "درس",
  lessons: "درس",
  course: "دورة",
  courses: "دورة",
  article: "مقال",
  history: "تاريخ",
  seerah: "سيرة",
  scholar: "عالم",
  sheikh: "شيخ",
  person: "علم",
  university: "جامعة",
  universities: "جامعة",
  mosque: "مسجد",
  mosques: "مسجد",
  landmark: "معلم",
  landmarks: "معلم",
  institution: "مؤسسة",
  institutions: "مؤسسة",
  fiqh: "فقه",
  fatwa: "فتوى",
  ruling: "حكم",
  fiqh_decision: "قرار فقهي",
  qa: "سؤال",
  adhkar: "ذكر",
  dua: "دعاء",
  fawaid: "فائدة",
  prophet: "نبي",
  prophets: "أنبياء",
  story: "قصة",
  nation: "أمة",
  nations: "أمم",
  book: "كتاب",
  library: "مكتبة",
  miracle: "إعجاز",
  topic: "موضوع",
  knowledge: "معرفة",
  update: "مستجد",
  settings: "إعدادات",
  app: "صفحة",
};

const FAMILY_BY_KIND: Record<string, SearchKindFamily> = {
  quran: "quran",
  surah: "quran",
  ayah: "quran",
  page: "quran",
  tajweed: "quran",
  hifz: "quran",
  tafsir: "tafsir",
  "tafsir-audio": "tafsir",
  ulum: "tafsir",
  hadith: "hadith",
  lesson: "lesson",
  lessons: "lesson",
  course: "lesson",
  courses: "lesson",
  history: "history",
  seerah: "seerah",
  scholar: "scholar",
  sheikh: "scholar",
  person: "scholar",
  university: "university",
  universities: "university",
  mosque: "mosque",
  mosques: "mosque",
  landmark: "landmark",
  landmarks: "landmark",
  institution: "institution",
  institutions: "institution",
  fiqh: "fiqh",
  fatwa: "fiqh",
  ruling: "fiqh",
  fiqh_decision: "fiqh",
  qa: "fiqh",
  adhkar: "adhkar",
  dua: "adhkar",
  fawaid: "fawaid",
  prophet: "prophet",
  prophets: "prophet",
  story: "prophet",
  nation: "prophet",
  nations: "prophet",
  article: "article",
  topic: "article",
  knowledge: "article",
  update: "article",
};

export function searchKindLabelAr(kind: string | null | undefined): string {
  if (!kind) return "محتوى";
  const key = kind.trim().toLowerCase();
  return SEARCH_KIND_LABELS_AR[key] ?? SEARCH_KIND_LABELS_AR[kind] ?? "محتوى";
}

export function searchKindFamily(kind: string | null | undefined): SearchKindFamily {
  if (!kind) return "generic";
  const key = kind.trim().toLowerCase();
  return FAMILY_BY_KIND[key] ?? FAMILY_BY_KIND[kind] ?? "generic";
}

/** يفشل إن وُجدت أحرف لاتينية في التسمية المعروضة (بوابة جودة). */
export function assertArabicKindLabel(label: string): boolean {
  return !/[A-Za-z]/.test(label);
}
