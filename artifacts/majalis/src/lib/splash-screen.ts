/**
 * متحكّم شاشة الإطلاق الأصلية (Capacitor SplashScreen).
 * يخفي الطبقة الأصلية فور أول إطار — بلا شعار/عنوان داخل التطبيق.
 */
import { Capacitor } from "@capacitor/core";

export const SPLASH_MIN_VISIBLE_MS = 0;
export const SPLASH_MAX_VISIBLE_MS = 400;
export const SPLASH_FADE_OUT_MS = 120;

const SESSION_KEY = "mj.native-splash.session.v1";

let hidden = false;

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
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({
      fadeOutDuration: immediate ? 0 : SPLASH_FADE_OUT_MS,
    });
  } catch {
    /* منصّة بلا ملحق */
  }
}

/** @deprecated الاسم السابق — يُبقي الاستدعاءات القديمة */
export async function hideAppSplash(immediate = false): Promise<void> {
  await hideNativeSplash(immediate);
}

/** يخفي SplashScreen الأصلي عند أول إطار بعد التركيب. */
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

  const deadline = window.setTimeout(() => {
    void hideNativeSplash(true);
  }, SPLASH_MAX_VISIBLE_MS);

  const hide = () => {
    window.clearTimeout(deadline);
    void hideNativeSplash(true);
  };

  window.addEventListener("mj:app-painted", hide, { once: true });
  window.addEventListener("app:first-paint", hide, { once: true });

  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      requestAnimationFrame(hide);
    });
  } else {
    window.setTimeout(hide, 0);
  }
}

/** @deprecated */
export function armSplashAutoHide(): void {
  armNativeSplashController();
}
