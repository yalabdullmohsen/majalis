/**
 * سجل فئات تحدي الأسئلة — قابل للتوسعة دون تقييد بعدد ثابت.
 * المحتوى الفعلي في islamicQuizData؛ الفئات بلا بنك تستخدم fallback.
 */
export type QuizCategoryIcon =
  | "book-open"
  | "scroll-text"
  | "moon"
  | "star"
  | "scale"
  | "building-2"
  | "landmark"
  | "gem"
  | "book-marked"
  | "library"
  | "users"
  | "heart"
  | "sparkles"
  | "languages"
  | "pen-line"
  | "graduation-cap"
  | "compass"
  | "map"
  | "message-circle";

export type QuizQuestionKind =
  | "open"
  | "mcq"
  | "true_false"
  | "fill_blank"
  | "order"
  | "match";

export interface QuizCategoryDef {
  id: string;
  name: string;
  icon: QuizCategoryIcon;
  /** فئة احتياطية عند غياب بنك محلي */
  fallbackId?: string;
}

/** الفئات المعروضة في الشبكة — الترتيب = العرض */
export const QUIZ_CATEGORY_DEFS: readonly QuizCategoryDef[] = [
  { id: "quran", name: "القرآن الكريم", icon: "book-open" },
  { id: "tafsir", name: "التفسير", icon: "book-marked", fallbackId: "quran" },
  { id: "hadith", name: "الحديث الشريف", icon: "scroll-text" },
  { id: "mustalah", name: "مصطلح الحديث", icon: "library", fallbackId: "hadith" },
  { id: "aqeeda", name: "العقيدة", icon: "building-2" },
  { id: "tawhid", name: "التوحيد", icon: "sparkles", fallbackId: "aqeeda" },
  { id: "fiqh", name: "الفقه", icon: "scale" },
  { id: "usul_fiqh", name: "أصول الفقه", icon: "compass", fallbackId: "fiqh" },
  { id: "sira", name: "السيرة النبوية", icon: "moon" },
  { id: "anbiya", name: "قصص الأنبياء", icon: "star" },
  { id: "tarikh", name: "التاريخ الإسلامي", icon: "landmark" },
  { id: "sahaba", name: "الصحابة", icon: "users", fallbackId: "akhlaq" },
  { id: "ummahat", name: "أمهات المؤمنين", icon: "heart", fallbackId: "sira" },
  { id: "akhlaq", name: "الأخلاق الإسلامية", icon: "gem" },
  { id: "adab", name: "الآداب الشرعية", icon: "pen-line", fallbackId: "akhlaq" },
  { id: "adhkar", name: "الأذكار", icon: "sparkles", fallbackId: "aqeeda" },
  { id: "arabic", name: "اللغة العربية", icon: "languages", fallbackId: "quran" },
  { id: "nahw", name: "النحو", icon: "languages", fallbackId: "quran" },
  { id: "sarf", name: "الصرف", icon: "languages", fallbackId: "quran" },
  { id: "balagha", name: "البلاغة", icon: "message-circle", fallbackId: "quran" },
  { id: "adab_ar", name: "الأدب العربي", icon: "pen-line", fallbackId: "quran" },
  { id: "ulama", name: "علماء الإسلام", icon: "graduation-cap", fallbackId: "tarikh" },
  { id: "ulum_quran", name: "علوم القرآن", icon: "book-open", fallbackId: "quran" },
  { id: "tajweed", name: "التجويد", icon: "book-marked", fallbackId: "quran" },
  { id: "faraid", name: "الفرائض", icon: "scale", fallbackId: "fiqh" },
  { id: "hajj", name: "الحج والعمرة", icon: "map", fallbackId: "fiqh" },
  { id: "asma", name: "أسماء الله الحسنى", icon: "sparkles", fallbackId: "aqeeda" },
  { id: "glossary", name: "المعجم الشرعي", icon: "library", fallbackId: "fiqh" },
] as const;

export const QUIZ_QUESTION_KIND_LABELS: Record<QuizQuestionKind, string> = {
  open: "إجابة مفتوحة",
  mcq: "اختيار من متعدد",
  true_false: "صح أو خطأ",
  fill_blank: "أكمل الفراغ",
  order: "الترتيب",
  match: "المطابقة",
};

export const QUIZ_PLAY_MODES = [
  { id: "solo", label: "فردي", desc: "لوحة نقاط كلاسيكية" },
  { id: "quick", label: "تحدي سريع", desc: "١٠ أسئلة متتالية" },
  { id: "daily", label: "تحدي يومي", desc: "سؤال اليوم" },
  { id: "random", label: "عشوائي", desc: "فئات وأسئلة متنوعة" },
] as const;

export type QuizPlayModeId = (typeof QUIZ_PLAY_MODES)[number]["id"];

export function resolveQuizCategoryPoolId(categoryId: string): string {
  const def = QUIZ_CATEGORY_DEFS.find((c) => c.id === categoryId);
  return def?.fallbackId ?? categoryId;
}
