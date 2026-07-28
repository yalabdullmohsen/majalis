import { safeLocationReload } from "@/lib/safe-reload";
import { canUseServiceWorker } from "@/lib/browser-features";

/**
 * Unregister stale service workers after deploy — prevents broken cached JS chunks.
 */
export async function purgeStaleServiceWorkers(): Promise<void> {
  if (!canUseServiceWorker()) return;

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

const SW_UPDATE_CHECK_INTERVAL_MS = 60 * 1000; // فحص فعلي للسكربت كل دقيقة أثناء الاستخدام

let updateIntervalId: number | null = null;
let visibilityHandler: (() => void) | null = null;

/** Ask SW to drop DATA_CACHE (API/Quran) while keeping shell — active offline sessions keep reading from IDB. */
export async function purgeServiceWorkerDataCache(): Promise<void> {
  if (!canUseServiceWorker()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "MAJALIS_PURGE_DATA_CACHE" });
  } catch {
    /* ignore */
  }
}

export function registerProductionServiceWorker(): void {
  if (!canUseServiceWorker()) return;
  if (!import.meta.env.PROD) return;

  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || refreshing) return;
    refreshing = true;
    safeLocationReload();
  });

  window.addEventListener("load", () => {
    void purgeStaleServiceWorkers().then(() => {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        const forceCheck = () => {
          void registration.update().catch(() => undefined);
        };
        forceCheck();
        if (updateIntervalId != null) window.clearInterval(updateIntervalId);
        updateIntervalId = window.setInterval(forceCheck, SW_UPDATE_CHECK_INTERVAL_MS);
        if (visibilityHandler) {
          document.removeEventListener("visibilitychange", visibilityHandler);
        }
        visibilityHandler = () => {
          if (document.visibilityState === "visible") forceCheck();
        };
        document.addEventListener("visibilitychange", visibilityHandler);
      }).catch((error) => {
        console.warn("[majalis:pwa] service worker registration failed", error);
      });
    });
  });

  // Tear down update interval on pagehide to avoid orphan timers in BFCache restores
  window.addEventListener(
    "pagehide",
    () => {
      if (updateIntervalId != null) {
        window.clearInterval(updateIntervalId);
        updateIntervalId = null;
      }
    },
    { once: true },
  );
}
