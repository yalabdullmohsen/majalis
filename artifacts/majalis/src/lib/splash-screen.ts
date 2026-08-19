/**
 * متحكّم مدة الدخولية الأصلية (Capacitor SplashScreen فقط).
 *
 * لا طبقة ويب — الويب لا يعرض دخولية تحجب المحتوى.
 *
 * سياسة:
 *   minVisible = 900ms
 *   maxVisible = 1500ms
 *   fadeOut    = 250ms
 *
 * تُخفى عند: (minVisible && app:first-paint) أو maxVisible — أيهما أسبق بعد min.
 */
import { Capacitor } from "@capacitor/core";

export const SPLASH_MIN_VISIBLE_MS = 900;
export const SPLASH_MAX_VISIBLE_MS = 1500;
export const SPLASH_FADE_OUT_MS = 250;

const SESSION_KEY = "mj.native-splash.session.v1";

let hidden = false;
let splashStartMs = 0;

export function getNativeSplashStartMs(): number {
  return splashStartMs;
}

export async function hideNativeSplash(immediate = false): Promise<void> {
  if (hidden) return;
  hidden = true;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
  if (!Capacitor.isNativePlatform()) return;
  try {
    if (typeof window.__capacitorSplashHide === "function") {
      try {
        window.__mjSplashHideAt = performance.now();
      } catch {
        /* ignore */
      }
      await window.__capacitorSplashHide({
        fadeOutDuration: immediate ? 0 : SPLASH_FADE_OUT_MS,
      });
      return;
    }
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({
      fadeOutDuration: immediate ? 0 : SPLASH_FADE_OUT_MS,
    });
  } catch {
    /* platform without plugin */
  }
}

/** @deprecated */
export async function hideAppSplash(immediate = false): Promise<void> {
  await hideNativeSplash(immediate);
}

/**
 * يُستدعى مرة عند الإقلاع على الأصلي — autoHide: false في capacitor.config.
 */
export function armNativeSplashController(): void {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      void hideNativeSplash(true);
      return;
    }
  } catch {
    /* ignore */
  }

  splashStartMs = performance.now();
  try {
    window.__mjNativeSplashStart = splashStartMs;
  } catch {
    /* ignore */
  }

  let paintReceived = false;
  let hideScheduled = false;

  const scheduleHide = () => {
    if (hideScheduled || hidden) return;
    hideScheduled = true;
    const elapsed = performance.now() - splashStartMs;
    const waitForMin = Math.max(0, SPLASH_MIN_VISIBLE_MS - elapsed);
    window.setTimeout(() => {
      void hideNativeSplash(false);
    }, waitForMin);
  };

  const onFirstPaint = () => {
    if (paintReceived) return;
    paintReceived = true;
    scheduleHide();
  };

  window.addEventListener("app:first-paint", onFirstPaint, { once: true });
  window.addEventListener("mj:app-painted", onFirstPaint, { once: true });

  window.setTimeout(() => {
    if (!hidden) void hideNativeSplash(false);
  }, SPLASH_MAX_VISIBLE_MS);
}

/** @deprecated */
export function armSplashAutoHide(): void {
  armNativeSplashController();
}

declare global {
  interface Window {
    __mjNativeSplashStart?: number;
    __mjSplashHideAt?: number;
    __capacitorSplashHide?: (opts: { fadeOutDuration: number }) => Promise<void>;
  }
}
