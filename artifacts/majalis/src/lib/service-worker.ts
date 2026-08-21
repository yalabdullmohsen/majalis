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

const SW_UPDATE_CHECK_INTERVAL_MS = 60 * 1000;
const SW_RELOAD_GUARD_KEY = "mj.sw-reload-once.v1";

function armControlledSwReload(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  let hadController = Boolean(navigator.serviceWorker.controller);

  const reloadOnce = () => {
    try {
      if (sessionStorage.getItem(SW_RELOAD_GUARD_KEY) === "1") return;
      sessionStorage.setItem(SW_RELOAD_GUARD_KEY, "1");
    } catch {
      /* proceed with safe reload guard */
    }
    safeLocationReload();
  };

  navigator.serviceWorker.addEventListener("message", (event) => {
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

  armControlledSwReload();

  // لا ننتظر حدث load هنا — المستدعي (main.tsx) يستدعي هذه الدالة أصلاً
  // بعد اكتمال load (أو readyState === "complete")، فانتظار load من جديد
  // يعلّق إلى الأبد لأنه يحدث مرة واحدة فقط لكل تحميل صفحة.
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
}
