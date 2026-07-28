/**
 * Unregister stale service workers after deploy — prevents broken cached JS chunks.
 * Part 23: seamless lifecycle via sw-lifecycle-guard (flush progress before reload).
 */
import {
  installSwLifecycleGuard,
} from "@/lib/sw-lifecycle-guard";

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

const SW_UPDATE_CHECK_INTERVAL_MS = 60 * 1000; // فحص فعلي للسكربت كل دقيقة أثناء الاستخدام

export function registerProductionServiceWorker(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

  // Master polish: skip SW inside restricted social WebViews
  try {
    const w = window as unknown as { __majalis_skip_sw__?: boolean };
    if (w.__majalis_skip_sw__) return;
  } catch {
    /* ignore */
  }
  void import("@/lib/webview-guard").then(({ shouldSkipServiceWorker }) => {
    if (shouldSkipServiceWorker()) return;
    bootSwRegistration();
  }).catch(() => bootSwRegistration());
}

function bootSwRegistration(): void {
  // Part 23: flush reading progress + audio resume BEFORE controllerchange reload
  installSwLifecycleGuard({ reloadOnControllerChange: true });

  window.addEventListener("load", () => {
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
  });
}
