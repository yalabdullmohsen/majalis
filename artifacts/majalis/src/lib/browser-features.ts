/**
 * Central browser feature detection — silent false on unavailable APIs.
 * Use before vibrate / SW / BroadcastChannel / Speech / Crypto / Workers / Locks.
 */

export type BrowserFeatures = {
  vibrate: boolean;
  serviceWorker: boolean;
  broadcastChannel: boolean;
  speechRecognition: boolean;
  webCryptoSubtle: boolean;
  webWorker: boolean;
  webLocks: boolean;
  indexedDB: boolean;
  matchMedia: boolean;
  requestIdleCallback: boolean;
};

let cached: BrowserFeatures | null = null;

export function detectBrowserFeatures(): BrowserFeatures {
  if (cached) return cached;
  const g = typeof globalThis !== "undefined" ? globalThis : ({} as typeof globalThis);
  const nav = typeof navigator !== "undefined" ? navigator : null;
  const win = typeof window !== "undefined" ? (window as unknown as Record<string, unknown>) : null;

  cached = {
    vibrate: Boolean(nav && typeof nav.vibrate === "function"),
    serviceWorker: Boolean(nav && "serviceWorker" in nav),
    broadcastChannel: typeof BroadcastChannel !== "undefined",
    speechRecognition: Boolean(
      win && (typeof win.SpeechRecognition === "function" || typeof win.webkitSpeechRecognition === "function"),
    ),
    webCryptoSubtle: Boolean(
      g.crypto && typeof (g.crypto as Crypto).subtle?.encrypt === "function",
    ),
    webWorker: typeof Worker !== "undefined",
    webLocks: Boolean(nav && nav.locks && typeof nav.locks.request === "function"),
    indexedDB: typeof indexedDB !== "undefined",
    matchMedia: typeof window !== "undefined" && typeof window.matchMedia === "function",
    requestIdleCallback: typeof window !== "undefined" && typeof window.requestIdleCallback === "function",
  };
  return cached;
}

/** Reset cache (tests). */
export function resetBrowserFeaturesCache(): void {
  cached = null;
}

export function canUseVibrate(): boolean {
  return detectBrowserFeatures().vibrate;
}

export function canUseServiceWorker(): boolean {
  return detectBrowserFeatures().serviceWorker;
}

export function canUseBroadcastChannel(): boolean {
  return detectBrowserFeatures().broadcastChannel;
}

export function canUseSpeechRecognition(): boolean {
  return detectBrowserFeatures().speechRecognition;
}

export function canUseWebCrypto(): boolean {
  return detectBrowserFeatures().webCryptoSubtle;
}

export function canUseWebWorker(): boolean {
  return detectBrowserFeatures().webWorker;
}

export function canUseWebLocks(): boolean {
  return detectBrowserFeatures().webLocks;
}

export function canUseIndexedDB(): boolean {
  return detectBrowserFeatures().indexedDB;
}

/** Safe vibrate — no-op when unsupported (iOS Safari, restricted webviews). */
export function safeVibrate(pattern: number | number[]): boolean {
  if (!canUseVibrate()) return false;
  try {
    return Boolean(navigator.vibrate(pattern));
  } catch {
    return false;
  }
}
