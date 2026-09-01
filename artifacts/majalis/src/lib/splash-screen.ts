/**
 * متحكّم شاشة الإطلاق — ويب (index.html) + Capacitor SplashScreen.
 */
import { Capacitor } from "@capacitor/core";
import {
  LAUNCH_SPLASH_ID,
  SPLASH_FADE_OUT_MS,
  SPLASH_MAX_VISIBLE_MS,
  SPLASH_MIN_VISIBLE_MS,
  SPLASH_SESSION_KEY,
} from "@/lib/majlis-splash";

export {
  SPLASH_FADE_OUT_MS,
  SPLASH_MAX_VISIBLE_MS,
  SPLASH_MIN_VISIBLE_MS,
};

let hidden = false;
let armedAt = 0;

/** يزيل #mj-launch-splash حتى لو حُظر سكربت الإقلاع بـ CSP. */
export function dismissHtmlLaunchSplash(immediate = false): void {
  try {
    sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
  const el = document.getElementById(LAUNCH_SPLASH_ID);
  if (!el) return;
  const remove = () => {
    try {
      el.remove();
    } catch {
      /* ignore */
    }
  };
  if (immediate) {
    remove();
    return;
  }
  el.classList.add("mj-launch-splash--out");
  window.setTimeout(remove, SPLASH_FADE_OUT_MS);
}

export async function hideNativeSplash(immediate = false): Promise<void> {
  if (hidden) return;
  hidden = true;
  dismissHtmlLaunchSplash(immediate);
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

function elapsedSinceArm(): number {
  if (!armedAt) return SPLASH_MAX_VISIBLE_MS;
  return performance.now() - armedAt;
}

function scheduleNativeHide(): void {
  const run = () => {
    const wait = Math.max(0, SPLASH_MIN_VISIBLE_MS - elapsedSinceArm());
    window.setTimeout(() => {
      void hideNativeSplash(false);
    }, wait);
  };

  if (elapsedSinceArm() >= SPLASH_MIN_VISIBLE_MS) {
    void hideNativeSplash(false);
    return;
  }
  run();
}

/**
 * يخفي دخولية HTML (#mj-launch-splash) على الويب والأصلي،
 * ويخفي Capacitor SplashScreen على الأصلي فقط.
 * يجب أن يعمل على الويب أيضًا — وإلا تبقى «سُنّة» إن حُظر سكربت الإقلاع بـ CSP.
 */
export function armNativeSplashController(): void {
  armedAt = performance.now();

  const deadline = window.setTimeout(() => {
    void hideNativeSplash(true);
  }, SPLASH_MAX_VISIBLE_MS);

  const hide = () => {
    window.clearTimeout(deadline);
    scheduleNativeHide();
  };

  window.addEventListener("mj:app-painted", hide, { once: true });
  window.addEventListener("app:first-paint", hide, { once: true });
  window.addEventListener("mj:boot-ready", hide, { once: true });
  // صمام إضافي: إن لم تصل أحداث الرسم خلال ضعف السقف، أخفِ فورًا
  window.setTimeout(() => {
    void hideNativeSplash(true);
  }, SPLASH_MAX_VISIBLE_MS * 2);
}

/** @deprecated */
export function armSplashAutoHide(): void {
  armNativeSplashController();
}
