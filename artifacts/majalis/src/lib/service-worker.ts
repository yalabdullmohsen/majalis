/**
 * Unregister stale service workers after deploy — prevents broken cached JS chunks.
 */
import { safeLocationReload } from "@/lib/safe-reload";

export async function purgeStaleServiceWorkers(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      const scriptUrl = reg.active?.scriptURL || reg.waiting?.scriptURL || "";
      if (scriptUrl && !scriptUrl.includes("/sw.js")) {
        await reg.unregister();
      }
    }
  } catch {
    /* ignore — SW not critical for app boot */
  }
}

/** أزل كل SW (بما فيها /sw.js) تحت webdriver حتى لا يعترض LHCI التنقّل */
export async function unregisterServiceWorkersForMeasurement(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    if (!navigator.webdriver) return;
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((reg) => reg.unregister()));
  } catch {
    /* ignore */
  }
}

const SW_UPDATE_CHECK_INTERVAL_MS = 60 * 1000;
const SW_RELOAD_GUARD_KEY = "mj.sw-reload-once.v1";
const REFRESHING_FLAG = "majlisilm-refreshing-version";

/**
 * تأخير التسجيل بعد استقرار الصفحة. حدث install في public/sw.js يبدأ
 * precache لأصول الغلاف (أيقونات + خط قرآني) فورًا، فتشغيله داخل
 * نافذة التحميل الحرجة ينافس LCP/FCP على النطاق والخيط الرئيسي.
 * قياس A/B محلي (Lighthouse، جوال، شبكة مُخنَقة) عند إصلاح التسجيل:
 *   بلا تأخير: FCP 5891 · LCP 8912 · CLS 0.089
 *   مع تأخير:  FCP 3797 · LCP 4863 · CLS 0.019 (مطابق لخط الأساس)
 * التسجيل نفسه يبقى مضمونًا — التأخير لا يلغيه.
 */
const SW_REGISTER_DELAY_MS = 5_000;

function armControlledSwReload(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  let hadController = Boolean(navigator.serviceWorker.controller);
  const bootStarted = performance.now();

  const signalQuietUpdate = () => {
    try {
      window.dispatchEvent(new CustomEvent("mj:sw-updated-quiet"));
    } catch {
      /* ignore */
    }
  };

  const reloadOnce = () => {
    /* لا reload أثناء أول ثوانٍ من الإقلاع — يمنع وميض النسخة القديمة→الجديدة */
    if (performance.now() - bootStarted < 8_000) {
      signalQuietUpdate();
      return;
    }
    if (document.documentElement.classList.contains("app-booting")) {
      signalQuietUpdate();
      return;
    }
    try {
      if (
        sessionStorage.getItem(SW_RELOAD_GUARD_KEY) === "1" ||
        sessionStorage.getItem(REFRESHING_FLAG) === "1"
      ) {
        return;
      }
      sessionStorage.setItem(SW_RELOAD_GUARD_KEY, "1");
      sessionStorage.setItem(REFRESHING_FLAG, "1");
    } catch {
      /* proceed with safe reload guard */
    }
    safeLocationReload();
  };

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "SW_UPDATED_QUIET") {
      signalQuietUpdate();
      return;
    }
    if (event.data?.type === "SW_UPDATED_RELOAD_ONCE") reloadOnce();
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    reloadOnce();
  });
}

export function registerProductionServiceWorker(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;
  // Lighthouse/Playwright يضبطون webdriver. اعتراض التنقّل من SW يُسقط
  // MainDocumentContent (Network.getResponseBody) فتصبح فئة best-practices = NaN.
  try {
    if (navigator.webdriver) {
      void unregisterServiceWorkersForMeasurement();
      return;
    }
  } catch {
    /* ignore */
  }

  armControlledSwReload();

  // لا ننتظر حدث load هنا — المستدعي (main.tsx) يستدعي هذه الدالة أصلاً
  // بعد اكتمال load (أو readyState === "complete")، فانتظار load من جديد
  // يعلّق إلى الأبد لأنه يحدث مرة واحدة فقط لكل تحميل صفحة.
  // نؤجّل التسجيل خارج نافذة التحميل الحرجة فقط (انظر SW_REGISTER_DELAY_MS).
  window.setTimeout(() => {
    void purgeStaleServiceWorkers().then(() => {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        const forceCheck = () => { void registration.update().catch(() => undefined); };
        forceCheck();
        window.setInterval(forceCheck, SW_UPDATE_CHECK_INTERVAL_MS);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") forceCheck();
        });
      }).catch((error) => {
        console.warn("[majalis:pwa] service worker registration failed", error);
      });
    });
  }, SW_REGISTER_DELAY_MS);
}
