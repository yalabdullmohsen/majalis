/**
 * علم منتج للمساعد الذكي — افتراضيًا معطّل للعامة حتى اكتمال التوثيق.
 * تفعيل صريح: localStorage majalis-assistant-enabled=1 أو VITE_ASSISTANT_ENABLED=1
 * إيقاف قسري: majalis-assistant-disabled=1
 */

export function isAssistantFeatureEnabled(): boolean {
  try {
    if (typeof localStorage !== "undefined") {
      if (localStorage.getItem("majalis-assistant-disabled") === "1") return false;
      if (localStorage.getItem("majalis-assistant-enabled") === "1") return true;
    }
  } catch {
    /* private mode */
  }
  try {
    const env = import.meta.env as Record<string, string | undefined>;
    return String(env.VITE_ASSISTANT_ENABLED ?? "") === "1";
  } catch {
    return false;
  }
}
