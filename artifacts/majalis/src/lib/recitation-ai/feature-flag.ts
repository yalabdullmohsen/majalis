/**
 * علم تفعيل «تلاوة» بالذكاء الاصطناعي (مسار /quran/recitation-test-ai).
 * القتل السريع: VITE_AI_TARTEEL_DISABLED=1 أو localStorage majalis:ai-tarteel-kill=1
 * لا تضع مفاتيح API هنا — المفاتيح على الخادم فقط.
 */
export const AI_TARTEEL_FEATURE_DEFAULT = true;

const KILL_KEY = "majalis:ai-tarteel-kill";

export const AI_TARTEEL_DISABLED_MESSAGE =
  "ميزة التلاوة بالذكاء الاصطناعي متوقفة مؤقتًا. عُد لاحقًا أو جرّب من مركز القرآن.";

function envFlag(name: string): string {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    return String(env?.[name] || "").trim().toLowerCase();
  } catch {
    return "";
  }
}

export function isAiTarteelKillSwitchOn(): boolean {
  if (typeof window !== "undefined") {
    try {
      if (window.localStorage?.getItem(KILL_KEY) === "1") return true;
    } catch {
      /* ignore */
    }
  }
  const disabled = envFlag("VITE_AI_TARTEEL_DISABLED");
  if (disabled === "1" || disabled === "true" || disabled === "yes" || disabled === "on") return true;
  if (envFlag("VITE_AI_TARTEEL_ENABLED") === "0") return true;
  return false;
}

/** الميزة ظاهرة ومفعّلة ما لم يُفعَّل القتل السريع. */
export function isAiTarteelEnabled(): boolean {
  if (isAiTarteelKillSwitchOn()) return false;
  if (envFlag("VITE_AI_TARTEEL_ENABLED") === "1") return true;
  return AI_TARTEEL_FEATURE_DEFAULT;
}

export function setAiTarteelKillSwitch(killed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    if (killed) window.localStorage?.setItem(KILL_KEY, "1");
    else window.localStorage?.removeItem(KILL_KEY);
  } catch {
    /* ignore */
  }
}
