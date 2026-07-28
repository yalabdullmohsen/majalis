/**
 * Master polish — social / in-app WebView resilience.
 * Detects restricted embedded browsers and provides non-intrusive API fallbacks.
 * Logic-only — no UI.
 */

import { isNative } from "@/lib/capacitor-utils";

export type WebViewKind =
  | "none"
  | "instagram"
  | "facebook"
  | "twitter"
  | "whatsapp"
  | "telegram"
  | "line"
  | "generic-webview"
  | "capacitor";

export type WebViewProfile = {
  kind: WebViewKind;
  restrictedStorage: boolean;
  restrictedWakeLock: boolean;
  restrictedServiceWorker: boolean;
  restrictedSharedArrayBuffer: boolean;
};

export function detectWebViewKind(ua = typeof navigator !== "undefined" ? navigator.userAgent : ""): WebViewKind {
  const s = ua || "";
  if (/Instagram/i.test(s)) return "instagram";
  if (/FBAN|FBAV|FB_IAB/i.test(s)) return "facebook";
  if (/Twitter/i.test(s) || /X\/\d/i.test(s)) return "twitter";
  if (/WhatsApp/i.test(s)) return "whatsapp";
  if (/Telegram/i.test(s)) return "telegram";
  if (/Line\//i.test(s)) return "line";
  try {
    if (isNative()) return "capacitor";
  } catch {
    /* ignore */
  }
  // Generic in-app WebView heuristics
  if (/; wv\)/i.test(s) || /WebView/i.test(s)) return "generic-webview";
  return "none";
}

export function getWebViewProfile(kind?: WebViewKind): WebViewProfile {
  const k = kind ?? detectWebViewKind();
  const embedded = k !== "none" && k !== "capacitor";
  return {
    kind: k,
    restrictedStorage: embedded,
    restrictedWakeLock: embedded || k === "capacitor",
    restrictedServiceWorker: embedded,
    restrictedSharedArrayBuffer: true, // assume blocked unless proven
  };
}

/**
 * Safe feature probe — never throws into callers.
 */
export function safeWebApi<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** Whether to skip SW registration in this environment. */
export function shouldSkipServiceWorker(): boolean {
  const p = getWebViewProfile();
  if (p.restrictedServiceWorker) return true;
  return safeWebApi(() => !("serviceWorker" in navigator), true);
}

/** Whether wake lock should be attempted. */
export function shouldAttemptWakeLock(): boolean {
  const p = getWebViewProfile();
  if (p.restrictedWakeLock) return false;
  return safeWebApi(() => "wakeLock" in navigator, false);
}
