/**
 * نظام Feature Flags بسيط.
 * القيمة الافتراضية تأتي من FEATURES_DEFAULT.
 * يمكن للمشرف تجاوزها عبر localStorage (مفيد للاختبار).
 */

type Flag =
  | "study_room"
  | "family_mode"
  | "car_mode"
  | "mosque_mode"
  | "vault"
  | "transcribe"
  | "academic_research"
  | "flashcards_advanced"
  | "quran_layouts"
  | "learning_calendar"
  | "quran_recitation_ai_test";

/** الصفحات مكتملة = true / في تطوير = false */
const FEATURES_DEFAULT: Record<Flag, boolean> = {
  study_room: true,
  family_mode: false,
  car_mode: false,
  mosque_mode: false,
  vault: true,
  transcribe: false,
  academic_research: false,
  flashcards_advanced: false,
  quran_layouts: false,
  learning_calendar: true,
  // معطّل افتراضيًا في الإنتاج — راجع docs/recitation-ai/final-report.md
  // لبوابات التفعيل. يُفعَّل يدويًا للاختبار الداخلي عبر setFeatureFlag()
  // أو localStorage["mj-flag-quran_recitation_ai_test"]="1".
  quran_recitation_ai_test: false,
};

const LS_PREFIX = "mj-flag-";

export function isFeatureEnabled(flag: Flag): boolean {
  try {
    const stored = localStorage.getItem(`${LS_PREFIX}${flag}`);
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch { /* */ }
  return FEATURES_DEFAULT[flag] ?? false;
}

/** للمشرفين: تفعيل/إيقاف علم من أدوات المطور */
export function setFeatureFlag(flag: Flag, enabled: boolean) {
  try {
    localStorage.setItem(`${LS_PREFIX}${flag}`, enabled ? "1" : "0");
  } catch { /* */ }
}

export type { Flag };
