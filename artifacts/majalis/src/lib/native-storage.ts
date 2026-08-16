/**
 * تخزين تقدّم التطبيق — Capacitor Preferences على الأصلي مع localStorage كمصدر
 * متزامن للقراءة الفورية (React state / SSR-safe).
 *
 * عند الإقلاع: hydrateNativeStorage() ينسخ Preferences → localStorage.
 * عند الكتابة: تُحدَّث localStorage فورًا ثم Preferences في الخلفية.
 */
import { Capacitor } from "@capacitor/core";

const isNative = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

async function prefsApi() {
  if (!isNative()) return null;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    return Preferences;
  } catch {
    return null;
  }
}

/** مفاتيح التقدّم الشخصي التي تُزامَن إلى Preferences. */
export const NATIVE_PROGRESS_KEYS = [
  "lastPage",
  "majalis-continue-reading-v1",
  "majalis-daily-wird-done-v1",
  "majalis-daily-challenge-score-v1",
  "majalis-daily-challenge-best-v1",
  "majalis_notif_prefs_v1",
  "majalis-notif-permission-asked-v1",
] as const;

export function storageGetSync(key: string): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSetSync(key: string, value: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota */
  }
  void mirrorToPreferences(key, value);
}

export function storageRemoveSync(key: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  void removeFromPreferences(key);
}

async function mirrorToPreferences(key: string, value: string): Promise<void> {
  const Preferences = await prefsApi();
  if (!Preferences) return;
  try {
    await Preferences.set({ key, value });
  } catch {
    /* ignore */
  }
}

async function removeFromPreferences(key: string): Promise<void> {
  const Preferences = await prefsApi();
  if (!Preferences) return;
  try {
    await Preferences.remove({ key });
  } catch {
    /* ignore */
  }
}

/**
 * يستورد قيم Preferences إلى localStorage عند الإقلاع (لا يستبدل قيمة موجودة
 * أحدث في LS إلا إذا كانت فارغة).
 */
export async function hydrateNativeStorage(
  keys: readonly string[] = NATIVE_PROGRESS_KEYS,
): Promise<void> {
  const Preferences = await prefsApi();
  if (!Preferences) return;
  for (const key of keys) {
    try {
      const { value } = await Preferences.get({ key });
      if (value == null || value === "") continue;
      const existing = storageGetSync(key);
      if (existing == null || existing === "") {
        try {
          localStorage.setItem(key, value);
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore per key */
    }
  }
  // مفاتيح الأذكار ديناميكية: adhkar_progress_*
  try {
    const { keys: all } = await Preferences.keys();
    for (const key of all) {
      if (!key.startsWith("adhkar_progress_")) continue;
      const { value } = await Preferences.get({ key });
      if (value == null) continue;
      if (storageGetSync(key) == null) {
        try {
          localStorage.setItem(key, value);
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
}

/** كتابة مفتاح أذكار مع مزامنة Preferences. */
export function setAdhkarProgress(key: string, value: string): void {
  storageSetSync(key, value);
}
