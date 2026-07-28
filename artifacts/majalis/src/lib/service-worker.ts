import { safeLocationReload } from "@/lib/safe-reload";
import { getWebViewProfile, withWebViewGuard } from "@/lib/webview-detect";

/**
 * Unregister stale service workers after deploy — prevents broken cached JS chunks.
 */
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

export function registerProductionServiceWorker(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

  // Part 15: skip SW entirely in restricted in-app WebViews (WhatsApp/IG/etc.)
  const profile = getWebViewProfile();
  if (!profile.serviceWorkerSafe) return;

  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || refreshing) return;
    refreshing = true;
    safeLocationReload();
  });

  window.addEventListener("load", () => {
    void withWebViewGuard(
      "serviceWorker",
      async () => {
        await purgeStaleServiceWorkers();
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          const forceCheck = () => {
            void registration.update().catch(() => undefined);
          };
          forceCheck();
          window.setInterval(forceCheck, SW_UPDATE_CHECK_INTERVAL_MS);
          document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") forceCheck();
          });
        } catch {
          /* silent — never white-screen on SW failure in WebViews */
        }
      },
      undefined,
    );
  });
}
