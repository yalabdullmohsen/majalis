/**
 * In-app browser / restricted WebView detection & capability isolation.
 * Prevents white-screens when opened inside WhatsApp, Telegram, Instagram, etc.
 * Logic-only — no UI.
 */

import { isNative } from "@/lib/capacitor-utils";
import {
  hasIndexedDB,
  hasLocalStorage,
  hasServiceWorker,
  hasStoragePersist,
} from "@/lib/feature-detect";

export type WebViewProfile = {
  isInAppBrowser: boolean;
  isStandalonePwa: boolean;
  isNativeApp: boolean;
  /** SW registration likely broken or restricted */
  serviceWorkerSafe: boolean;
  /** localStorage/sessionStorage usable */
  storageSafe: boolean;
  /** IndexedDB usable */
  idbSafe: boolean;
  /** storage.persist available and worth requesting */
  persistSafe: boolean;
  /** UA hint string for diagnostics */
  reason: string;
};

let cached: WebViewProfile | null = null;

function detectInAppUa(ua: string): { hit: boolean; reason: string } {
  const u = ua.toLowerCase();
  // Common in-app browsers / restricted webviews
  const rules: Array<[RegExp, string]> = [
    [/whatsapp/i, "whatsapp"],
    [/telegram/i, "telegram"],
    [/fbav|fban|fb_iab|facebook/i, "facebook"],
    [/instagram/i, "instagram"],
    [/\btwitter\b|\bx\.com\b|twitterandroid/i, "x-twitter"],
    [/line\//i, "line"],
    [/tiktok|bytedance|musical_ly/i, "tiktok"],
    [/wv\)|; wv\)/i, "android-webview"],
    [/micromessenger/i, "wechat"],
    [/snapchat/i, "snapchat"],
    [/linkedinapp/i, "linkedin"],
  ];
  for (const [re, name] of rules) {
    if (re.test(ua) || re.test(u)) return { hit: true, reason: name };
  }
  // iOS WKWebView without Safari version token quirks
  if (/iphone|ipad|ipod/i.test(ua) && /applewebkit/i.test(ua) && !/safari/i.test(ua)) {
    return { hit: true, reason: "ios-wkwebview" };
  }
  return { hit: false, reason: "browser" };
}

export function getWebViewProfile(): WebViewProfile {
  if (cached) return cached;
  if (typeof navigator === "undefined") {
    cached = {
      isInAppBrowser: false,
      isStandalonePwa: false,
      isNativeApp: false,
      serviceWorkerSafe: false,
      storageSafe: false,
      idbSafe: false,
      persistSafe: false,
      reason: "ssr",
    };
    return cached;
  }

  const ua = navigator.userAgent || "";
  const { hit, reason } = detectInAppUa(ua);
  let standalone = false;
  try {
    if (typeof window !== "undefined") {
      standalone =
        (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
        // @ts-expect-error iOS-only
        !!(navigator as { standalone?: boolean }).standalone;
    }
  } catch {
    standalone = false;
  }

  const native = !!isNative;
  const inApp = hit && !native;

  // Probe storage without throwing
  let storageSafe = false;
  try {
    storageSafe = hasLocalStorage();
  } catch {
    storageSafe = false;
  }

  let idbSafe = false;
  try {
    idbSafe = hasIndexedDB();
  } catch {
    idbSafe = false;
  }

  // In-app browsers often break SW registration / scope — skip to avoid errors
  const serviceWorkerSafe = hasServiceWorker() && !inApp && !native;

  const persistSafe = hasStoragePersist() && storageSafe && !inApp;

  cached = {
    isInAppBrowser: inApp,
    isStandalonePwa: standalone,
    isNativeApp: native,
    serviceWorkerSafe,
    storageSafe,
    idbSafe,
    persistSafe,
    reason: native ? "capacitor" : reason,
  };
  return cached;
}

/**
 * Run a feature only when the WebView profile allows it.
 * Never throws — returns fallback on failure.
 */
export async function withWebViewGuard<T>(
  feature: "serviceWorker" | "storage" | "idb" | "persist",
  fn: () => Promise<T> | T,
  fallback: T,
): Promise<T> {
  const p = getWebViewProfile();
  const ok =
    feature === "serviceWorker"
      ? p.serviceWorkerSafe
      : feature === "storage"
        ? p.storageSafe
        : feature === "idb"
          ? p.idbSafe
          : p.persistSafe;
  if (!ok) return fallback;
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/** Best-effort storage.persist — silent in WebViews. */
export async function tryPersistStorage(): Promise<boolean> {
  return withWebViewGuard(
    "persist",
    async () => {
      try {
        return !!(await navigator.storage!.persist!());
      } catch {
        return false;
      }
    },
    false,
  );
}

export function resetWebViewProfileForTests(): void {
  cached = null;
}
