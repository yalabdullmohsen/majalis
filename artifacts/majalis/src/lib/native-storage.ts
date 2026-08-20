/**
 * تخزين تقدّم التطبيق — Capacitor Preferences على الأصلي مع localStorage كمصدر
 * متزامن للقراءة الفورية (React state / SSR-safe).
 *
 * عند الإقلاع: hydrateNativeStorage() ينسخ Preferences → localStorage.
 * عند الكتابة: تُحدَّث localStorage فورًا ثم Preferences في الخلفية.
 *
 * مهم: لا يُنتظر hydrate قبل createRoot — مهلة قصيرة حتى لا تتجمّد شاشة الإقلاع
 * إذا كان ملحق Preferences غير موجود في الـ binary أو علّق الجسر الأصلي.
 */
import { Capacitor } from "@capacitor/core";

const HYDRATE_BUDGET_MS = 900;

const isNative = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    let settled = false;
    const t = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(null);
    }, ms);
    promise
      .then((value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(t);
        resolve(value);
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        window.clearTimeout(t);
        resolve(null);
      });
  });
}

async function prefsApi() {
  if (!isNative()) return null;
  try {
    const mod = await withTimeout(import("@capacitor/preferences"), 400);
    return mod?.Preferences ?? null;
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
  /** جولة المزايا — مرة واحدة بعد التثبيت (Preferences/UserDefaults). */
  "onboarding.completed.v1",
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
 * يفشل بهدوء خلال HYDRATE_BUDGET_MS — لا يعلّق واجهة الإقلاع.
 */
export async function hydrateNativeStorage(
  keys: readonly string[] = NATIVE_PROGRESS_KEYS,
): Promise<void> {
  if (!isNative()) return;

  const work = (async () => {
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
  })();

  await withTimeout(work, HYDRATE_BUDGET_MS);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mj:feature-tour-storage-ready"));
  }
}

/** كتابة مفتاح أذكار مع مزامنة Preferences. */
export function setAdhkarProgress(key: string, value: string): void {
  storageSetSync(key, value);
}
