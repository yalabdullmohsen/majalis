/**
 * كتالوج اهتزاز لمسي موحّد — Capacitor Haptics على الأصلي، Vibration على الويب.
 * يحترم إعداد المستخدم ومفتاح الأذكار القديم للتوافق.
 */

export type HapticKind = "selection" | "light" | "medium" | "success" | "warning" | "error";

const WEB_PATTERNS: Record<HapticKind, number | number[]> = {
  selection: 10,
  light: 18,
  medium: 28,
  success: [30, 60, 30],
  warning: [40, 40, 40],
  error: [60, 40, 60],
};

const LEGACY_ADHKAR_KEY = "adhkar_haptics_enabled";

function readPrefsHaptics(): boolean | null {
  try {
    const raw = localStorage.getItem("majalis-user-settings-v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { hapticsEnabled?: boolean };
    if (typeof parsed.hapticsEnabled === "boolean") return parsed.hapticsEnabled;
  } catch {
    /* ignore */
  }
  return null;
}

/** هل الاهتزاز مفعّل؟ الافتراضي: نعم (ما لم يُعطَّل صراحة). */
export function isHapticsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const fromPrefs = readPrefsHaptics();
    if (fromPrefs !== null) return fromPrefs;
    if (localStorage.getItem(LEGACY_ADHKAR_KEY) === "false") return false;
    return true;
  } catch {
    return true;
  }
}

export function setHapticsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LEGACY_ADHKAR_KEY, enabled ? "true" : "false");
  } catch {
    /* ignore */
  }
}

/** تشغيل نمط اهتزاز — لا يرمي؛ يتجاهل المنصات بلا دعم. */
export function triggerHaptic(kind: HapticKind = "light"): void {
  if (typeof window === "undefined") return;
  if (!isHapticsEnabled()) return;

  void (async () => {
    try {
      const { isNative, hapticTap, hapticNotify } = await import("@/lib/capacitor-utils");
      if (isNative) {
        if (kind === "success" || kind === "warning" || kind === "error") {
          await hapticNotify(kind);
          return;
        }
        const map = { selection: "light", light: "light", medium: "medium" } as const;
        await hapticTap(map[kind] ?? "light");
        return;
      }
    } catch {
      /* fall through to vibrate */
    }
    try {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(WEB_PATTERNS[kind]);
      }
    } catch {
      /* ignore */
    }
  })();
}

/** اختصارات شائعة */
export const haptics = {
  selection: () => triggerHaptic("selection"),
  light: () => triggerHaptic("light"),
  medium: () => triggerHaptic("medium"),
  success: () => triggerHaptic("success"),
  warning: () => triggerHaptic("warning"),
  error: () => triggerHaptic("error"),
} as const;
