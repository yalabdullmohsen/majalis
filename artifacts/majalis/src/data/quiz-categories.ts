/**
 * توافق خلفي لسجل الفئات وأنواع الأسئلة.
 * دوال البنك المنشورة: استورد من `@/data/quiz-bank` مباشرة (تجنّب دورة استيراد).
 */
export type { QuizCategoryIcon } from "./quiz-bank/types";

export type QuizQuestionKind =
  | "open"
  | "mcq"
  | "true_false"
  | "fill_blank"
  | "order"
  | "match";

export type QuizCategoryDef = {
  id: string;
  name: string;
  icon: import("./quiz-bank/types").QuizCategoryIcon;
  fallbackId?: string;
};

export {
  QUIZ_CATEGORY_DEFS,
  QUIZ_LEAF_CATEGORIES,
  QUIZ_ALL_CATEGORIES,
  QUIZ_CATEGORY_FALLBACKS,
  resolveQuizCategoryPoolId,
  getCategoryById,
} from "./quiz-bank/categories";

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
  { id: "quick", label: "تحدي سريع", desc: "أسئلة متتالية" },
  { id: "daily", label: "تحدي يومي", desc: "سؤال اليوم" },
  { id: "random", label: "عشوائي", desc: "فئات وأسئلة متنوعة" },
] as const;

export type QuizPlayModeId = (typeof QUIZ_PLAY_MODES)[number]["id"];
