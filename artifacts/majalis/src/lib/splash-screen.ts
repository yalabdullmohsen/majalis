/**
 * متحكّم شاشة الإطلاق — ويب (index.html) + Capacitor SplashScreen.
 *
 * HTML (#mj-launch-splash): يُخفى بعد mj:shell-stable (أو السقف) حتى لا يُكشف الهيكل وهو لا يزال app-booting.
 * Capacitor: يُخفى مع HTML عند shell-stable — مصدر إخفاء واحد بلا كشف مبكر.
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

let htmlDismissed = false;
let capacitorHidden = false;
let armedAt = 0;

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** يزيل #mj-launch-splash حتى لو حُظر سكربت الإقلاع بـ CSP. */
export function dismissHtmlLaunchSplash(immediate = false): void {
  if (htmlDismissed) return;
  htmlDismissed = true;
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
  const skipFade = immediate || prefersReducedMotion();
  if (skipFade) {
    remove();
    return;
  }
  el.classList.add("mj-launch-splash--out");
  window.setTimeout(remove, SPLASH_FADE_OUT_MS);
}

async function hideCapacitorSplash(immediate = false): Promise<void> {
  if (capacitorHidden) return;
  capacitorHidden = true;
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({
      fadeOutDuration: immediate || prefersReducedMotion() ? 0 : SPLASH_FADE_OUT_MS,
    });
  } catch {
    /* منصّة بلا ملحق */
  }
}

/** يخفي دخولية HTML + Capacitor معًا (بعد استقرار الهيكل أو السقف). */
export async function hideNativeSplash(immediate = false): Promise<void> {
  dismissHtmlLaunchSplash(immediate);
  await hideCapacitorSplash(immediate);
}

/** @deprecated الاسم السابق — يُبقي الاستدعاءات القديمة */
export async function hideAppSplash(immediate = false): Promise<void> {
  await hideNativeSplash(immediate);
}

function elapsedSinceArm(): number {
  if (!armedAt) return SPLASH_MAX_VISIBLE_MS;
  return performance.now() - armedAt;
}

function scheduleAfterMinVisible(run: () => void): void {
  const wait = Math.max(0, SPLASH_MIN_VISIBLE_MS - elapsedSinceArm());
  if (wait === 0) {
    run();
    return;
  }
  window.setTimeout(run, wait);
}

/**
 * يخفي دخولية HTML (#mj-launch-splash) على الويب والأصلي بعد استقرار الهيكل،
 * ويخفي Capacitor SplashScreen مع HTML عند mj:shell-stable (مصدر إخفاء واحد).
 * يجب أن يعمل على الويب أيضًا — وإلا تبقى «سُنّة» إن حُظر سكربت الإقلاع بـ CSP.
 */
export function armNativeSplashController(): void {
  armedAt = performance.now();

  const deadline = window.setTimeout(() => {
    /* سقف زمني — مع تلاشي ناعم (لا إزالة فورية تسبب وميض) */
    void hideNativeSplash(false);
  }, SPLASH_MAX_VISIBLE_MS);

  const hideHtmlAndNative = () => {
    window.clearTimeout(deadline);
    scheduleAfterMinVisible(() => {
      void hideNativeSplash(false);
    });
  };

  /* مصدر واحد: لا تخفِ Capacitor قبل استقرار الهيكل (يمنع وميض الكروم تحت Splash) */
  window.addEventListener("mj:shell-stable", hideHtmlAndNative, { once: true });
  // صمام إضافي: إن لم تصل أحداث الاستقرار، أخفِ بتلاشي
  window.setTimeout(() => {
    void hideNativeSplash(false);
  }, SPLASH_MAX_VISIBLE_MS * 2);
}

/** @deprecated */
export function armSplashAutoHide(): void {
  armNativeSplashController();
}
