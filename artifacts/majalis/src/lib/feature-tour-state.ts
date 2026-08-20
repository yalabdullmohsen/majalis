/**
 * جولة المزايا — حالة العرض مرة واحدة (first-run feature tour).
 *
 * العلامة: onboarding.completed.v1 في Capacitor Preferences (عبر native-storage)
 * وليس في كاش المتصفح فقط — حتى لا تعود الجولة بعد مسح WKWebView cache.
 *
 * تُحفظ عند التخطي أو الإكمال.
 */
import { isNative } from "@/lib/capacitor-utils";
import {
  storageGetSync,
  storageRemoveSync,
  storageSetSync,
} from "@/lib/native-storage";

/** المفتاح الموحّد — يُزامَن إلى Preferences/UserDefaults على الأصلي. */
export const FEATURE_TOUR_COMPLETED_KEY = "onboarding.completed.v1";

export const FEATURE_TOUR_REPLAY_EVENT = "mj:feature-tour-replay";
export const FEATURE_TOUR_HYDRATED_EVENT = "mj:feature-tour-storage-ready";

/** للاختبارات — ذاكرة جلسة عند فشل التخزين الدائم. */
const sessionSeen = { value: false };

export function hasCompletedFeatureTourSync(): boolean {
  if (sessionSeen.value) return true;
  try {
    return storageGetSync(FEATURE_TOUR_COMPLETED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * قراءة موثوقة على الأصلي: Preferences مباشرة ثم localStorage (بعد hydrate).
 */
export async function hasCompletedFeatureTour(): Promise<boolean> {
  if (sessionSeen.value) return true;

  if (isNative) {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      const { value } = await Preferences.get({ key: FEATURE_TOUR_COMPLETED_KEY });
      if (value === "1") return true;
    } catch {
      /* fallback below */
    }
  }

  return hasCompletedFeatureTourSync();
}

/** يُعلِّم الجولة مكتملة (تخطي أو إنهاء) — idempotent. */
export function markFeatureTourCompleted(): boolean {
  sessionSeen.value = true;
  try {
    storageSetSync(FEATURE_TOUR_COMPLETED_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

/** إعادة العرض اليدوي من الإعدادات — لا يمسّ العلامة حتى يُغلق المستخدم الجولة. */
export function requestFeatureTourReplay(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FEATURE_TOUR_REPLAY_EVENT));
}

/** للاختبارات فقط */
export function resetFeatureTourStateForTests(): void {
  sessionSeen.value = false;
  try {
    storageRemoveSync(FEATURE_TOUR_COMPLETED_KEY);
  } catch {
    /* ignore */
  }
}
