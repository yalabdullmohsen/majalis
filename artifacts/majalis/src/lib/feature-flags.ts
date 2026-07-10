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
  | "learning_calendar";

/** الصفحات مكتملة = true / في تطوير = false */
const FEATURES_DEFAULT: Record<Flag, boolean> = {
  study_room: false,
  family_mode: false,
  car_mode: false,
  mosque_mode: false,
  vault: false,
  transcribe: false,
  academic_research: false,
  flashcards_advanced: false,
  quran_layouts: false,
  learning_calendar: false,
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
