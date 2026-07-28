import { safeLocationReload } from "@/lib/safe-reload";
import { isProtectedSession } from "@/lib/protected-session";

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
const UPDATE_EVENT = "majalis-sw-update-available";

let updateIntervalId: number | null = null;
let waitingWorker: ServiceWorker | null = null;

/** Tell waiting SW to activate (user opted in / safe moment). */
export async function activateWaitingServiceWorker(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const waiting = reg?.waiting || waitingWorker;
    if (waiting) {
      waiting.postMessage({ type: "SKIP_WAITING" });
    }
  } catch {
    /* ignore */
  }
}

/**
 * Apply SW update: activate waiting worker then reload —
 * deferred automatically while a protected reading/audio session is active.
 */
export async function applyServiceWorkerUpdate(): Promise<void> {
  if (isProtectedSession()) {
    // Queue for when session ends — still notify UI
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { deferred: true } }));
    return;
  }
  await activateWaitingServiceWorker();
  // controllerchange listener will reload once; also soft-reload as fallback
  window.setTimeout(() => {
    if (!isProtectedSession()) safeLocationReload();
  }, 400);
}

export function onServiceWorkerUpdateAvailable(handler: () => void): () => void {
  const fn = () => handler();
  window.addEventListener(UPDATE_EVENT, fn);
  return () => window.removeEventListener(UPDATE_EVENT, fn);
}

export function registerProductionServiceWorker(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;

  // Reload ONLY when client claimed a new SW AND we are not mid-reading.
  // skipWaiting is no longer automatic — so this fires after explicit activate.
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || refreshing) return;
    if (isProtectedSession()) {
      window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { deferred: true } }));
      return;
    }
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
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") forceCheck();
        });

        const announceWaiting = () => {
          if (registration.waiting) {
            waitingWorker = registration.waiting;
            window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { waiting: true } }));
          }
        };

        if (registration.waiting) announceWaiting();

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              waitingWorker = registration.waiting;
              window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { waiting: true } }));
            }
          });
        });
      }).catch((error) => {
        console.warn("[majalis:pwa] service worker registration failed", error);
      });
    });
  });

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

export const SW_UPDATE_AVAILABLE_EVENT = UPDATE_EVENT;
