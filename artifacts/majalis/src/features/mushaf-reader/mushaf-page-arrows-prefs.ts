/**
 * تفضيل أسهم تقليب الصفحات — خارج Geometry المصحف.
 * الافتراضي: مفعّل. لا يُفتح التطبيق في وضع تركيز مخفي تلقائيًا.
 */
const ARROWS_KEY = "sunnah.mushaf.pageArrowsEnabled";
const FOCUS_PREF_KEY = "sunnah.mushaf.focusReadingModePreference";

function readBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    if (raw === "1" || raw === "true") return true;
    if (raw === "0" || raw === "false") return false;
  } catch {
    /* ignore */
  }
  return fallback;
}

function writeBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function loadPageArrowsEnabled(): boolean {
  return readBool(ARROWS_KEY, true);
}

export function savePageArrowsEnabled(enabled: boolean): void {
  writeBool(ARROWS_KEY, enabled);
}

/** يُحفظ فقط بعد اختيار صريح — لا يُفرض عند أول فتح */
export function loadFocusReadingModePreference(): boolean | null {
  try {
    const raw = localStorage.getItem(FOCUS_PREF_KEY);
    if (raw == null) return null;
    if (raw === "1" || raw === "true") return true;
    if (raw === "0" || raw === "false") return false;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveFocusReadingModePreference(enabled: boolean): void {
  writeBool(FOCUS_PREF_KEY, enabled);
}
