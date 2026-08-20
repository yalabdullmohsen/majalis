/**
 * متحكّم شاشة الإطلاق الأصلية (Capacitor SplashScreen).
 *
 * الويب: لا دخولية حاجبة — هيكل ثابت يُرسم فوراً ويُزال عند أول رسم لـ React.
 * الأصلي: launchAutoHide: false حتى يُخفى برمجياً عند أول رسم،
 * ثم طبقة HTML (عنوان + سطر + مؤشر) تبقى 900–1500ms بتلاشٍ 250ms.
 */
import { Capacitor } from "@capacitor/core";

export const SPLASH_MIN_VISIBLE_MS = 900;
export const SPLASH_MAX_VISIBLE_MS = 1500;
export const SPLASH_FADE_OUT_MS = 250;

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

/**
 * يُخفي SplashScreen الأصلي عند أول إطار بعد التركيب حتى تظهر
 * طبقة HTML المطابقة (عنوان + سطر + مؤشر) بلا فجوة بيضاء.
 * سقف أمان = SPLASH_MAX_VISIBLE_MS.
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

  const deadline = window.setTimeout(() => {
    void hideNativeSplash(false);
  }, SPLASH_MAX_VISIBLE_MS);

  const hide = () => {
    window.clearTimeout(deadline);
    void hideNativeSplash(false);
  };

  const onPaint = () => hide();
  window.addEventListener("mj:app-painted", onPaint, { once: true });
  window.addEventListener("app:first-paint", onPaint, { once: true });

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
