/**
 * متحكّم شاشة الإطلاق — ويب (index.html) + Capacitor SplashScreen.
 *
 * مسار واحد للإقلاع الأصلي:
 *   LaunchScreen (لون فقط) → #mj-launch-splash (الهوية الرسمية) → التطبيق
 *
 * Capacitor SplashScreen طبقة تغطية صامتة؛ تُخفى فورًا عند التسليح حتى لا تظهر
 * كدخولية ثانية فوق HTML. الدخولية الوحيدة ذات العلامة/العبارة هي #mj-launch-splash.
 */
import { Capacitor } from "@capacitor/core";
import {
  LAUNCH_SPLASH_ID,
  SPLASH_FADE_OUT_MS,
  SPLASH_MAX_VISIBLE_MS,
  SPLASH_MIN_VISIBLE_MS,
  SPLASH_SESSION_KEY,
} from "@/lib/majlis-splash";
import { notifyNativeLaunchEnded } from "@/lib/app-startup-controller";
import { markStartup } from "@/lib/startup-performance-marks";

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
 * يخفي Capacitor فورًا (طبقة صامتة فقط)، ويبقي #mj-launch-splash حتى mj:shell-stable.
 * لا تُعاد طبقة Capacitor عند العودة من الخلفية — الدخولية Cold Start فقط عبر HTML.
 */
export function armNativeSplashController(): void {
  armedAt = performance.now();

  /* كشف الدخولية الرسمية فورًا — بلا طبقة Capacitor فوقها */
  void hideCapacitorSplash(true).then(() => {
    markStartup("startup:native-end");
    notifyNativeLaunchEnded("capacitor-splash-hidden");
  });

  const deadline = window.setTimeout(() => {
    void hideNativeSplash(false);
  }, SPLASH_MAX_VISIBLE_MS);

  const hideHtmlWhenReady = () => {
    window.clearTimeout(deadline);
    scheduleAfterMinVisible(() => {
      dismissHtmlLaunchSplash(false);
      void hideCapacitorSplash(true);
    });
  };

  window.addEventListener("mj:shell-stable", hideHtmlWhenReady, { once: true });
}

/** @deprecated */
export function armSplashAutoHide(): void {
  armNativeSplashController();
}
