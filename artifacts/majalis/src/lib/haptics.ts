/**
 * كتالوج اهتزاز لمسي موحّد — Capacitor Haptics على الأصلي، Vibration API على الويب.
 * يحترم إعداد المستخدم ومفتاح الأذكار القديم للتوافق.
 * يُزامَن مع إطار الرسم عبر rAF لتجنّب إسقاط الإطارات.
 */

import { hapticNotify, hapticTap, isNative } from "@/lib/capacitor-utils";

export type HapticKind = "selection" | "light" | "medium" | "success" | "warning" | "error";

const LEGACY_ADHKAR_KEY = "adhkar_haptics_enabled";

/** دعم Vibration API على الويب (navigator.vibrate) — لا يُستدعى على منصات بلا دعم. */
function webVibrateSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

let capabilityKnown = false;
let hapticsCapable = true;

/** فحص قدرة الجهاز مرة واحدة — يمنع تحذيرات الكونسول على أجهزة بلا دعم. */
export function supportsHaptics(): boolean {
  if (typeof window === "undefined") return false;
  if (capabilityKnown) return hapticsCapable;
  capabilityKnown = true;
  if (isNative) {
    hapticsCapable = true;
    return true;
  }
  hapticsCapable = webVibrateSupported();
  return hapticsCapable;
}

/** للاختبارات فقط */
export function resetHapticsCapabilityForTests(): void {
  capabilityKnown = false;
  hapticsCapable = true;
}

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

function fireHaptic(kind: HapticKind): void {
  switch (kind) {
    case "selection":
    case "light":
      void hapticTap("light");
      break;
    case "medium":
      void hapticTap("medium");
      break;
    case "success":
      void hapticNotify("success");
      break;
    case "warning":
      void hapticNotify("warning");
      break;
    case "error":
      void hapticNotify("error");
      break;
    default:
      void hapticTap("light");
  }
}

/**
 * تشغيل نمط اهتزاز — لا يرمي؛ يتجاهل المنصات بلا دعم.
 * @param syncWithFrame إن true يُؤجَّل لنهاية إطار الرسم لمزامنة الميكرو-أنيميشن.
 */
export function triggerHaptic(kind: HapticKind = "light", syncWithFrame = true): void {
  if (!isHapticsEnabled() || !supportsHaptics()) return;
  if (!syncWithFrame || typeof requestAnimationFrame !== "function") {
    fireHaptic(kind);
    return;
  }
  requestAnimationFrame(() => {
    fireHaptic(kind);
  });
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
