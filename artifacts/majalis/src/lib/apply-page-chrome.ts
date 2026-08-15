/**
 * تطبيق PageChrome على DOM + Capacitor StatusBar + theme-color.
 */
import { Capacitor } from "@capacitor/core";
import {
  resolvePageChrome,
  type PageChromeDef,
  type StatusBarIconStyle,
} from "@/lib/page-chrome";
import { VIEWPORT_CONTENT } from "@/lib/ensure-chrome-meta";

let lastAppliedKey = "";
let lastAppliedHex = "";
let lastAppliedStyle: StatusBarIconStyle | "" = "";
let overlaysConfigured = false;

function upsertThemeColor(hex: string) {
  if (typeof document === "undefined") return;
  const metas = document.head.querySelectorAll('meta[name="theme-color"]');
  if (metas.length === 0) {
    const el = document.createElement("meta");
    el.setAttribute("name", "theme-color");
    el.setAttribute("content", hex);
    document.head.appendChild(el);
    return;
  }
  metas.forEach((m) => {
    m.setAttribute("content", hex);
  });
}

function upsertViewport() {
  if (typeof document === "undefined") return;
  let vp = document.head.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
  if (!vp) {
    vp = document.createElement("meta");
    vp.setAttribute("name", "viewport");
    document.head.appendChild(vp);
  }
  vp.setAttribute("content", VIEWPORT_CONTENT);
}

/** يطبّق متغيرات CSS + theme-color فوراً (بدون وميض). */
export function applyPageChromeDom(chrome: PageChromeDef, key?: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--app-status-bg", chrome.statusBarColor);
  root.style.setProperty("--app-status-fg-mode", chrome.statusBarStyle);
  root.dataset.pageChrome = key || "";
  root.dataset.statusFg = chrome.statusBarStyle;
  // خلفية الجذر = لون الشريط حتى يمتد تحت الساعة عند overlay
  root.style.backgroundColor = chrome.statusBarColorHex;
  if (document.body) {
    document.body.style.backgroundColor = chrome.statusBarColorHex;
  }
  upsertViewport();
  upsertThemeColor(chrome.statusBarColorHex);
}

async function applyNativeStatusBar(chrome: PageChromeDef) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    if (!overlaysConfigured) {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        overlaysConfigured = true;
      } catch {
        /* قديم */
      }
    }
    // Style.Dark = أيقونات داكنة · Style.Light = أيقونات فاتحة
    const style = chrome.statusBarStyle === "dark" ? Style.Dark : Style.Light;
    await StatusBar.setStyle({ style });
    await StatusBar.show();
    try {
      await StatusBar.setBackgroundColor({ color: chrome.statusBarColorHex });
    } catch {
      /* iOS غالباً يعتمد على CSS تحت overlay */
    }
  } catch {
    /* لا StatusBar */
  }
}

export type ApplyPageChromeOpts = {
  pathname: string;
  resolvedTheme: "light" | "dark";
  /** فرض إعادة التطبيق حتى لو تطابق المفتاح */
  force?: boolean;
};

/**
 * نقطة الدخول المركزية — تُستدعى عند تغيير المسار أو الوضع.
 */
export async function applyPageChrome(opts: ApplyPageChromeOpts): Promise<PageChromeDef & { key: string }> {
  const chrome = resolvePageChrome(opts.pathname, opts.resolvedTheme);
  const sig = `${chrome.key}:${chrome.statusBarColorHex}:${chrome.statusBarStyle}`;
  const prev = `${lastAppliedKey}:${lastAppliedHex}:${lastAppliedStyle}`;
  if (!opts.force && sig === prev) {
    return chrome;
  }
  applyPageChromeDom(chrome, chrome.key);
  await applyNativeStatusBar(chrome);
  lastAppliedKey = chrome.key;
  lastAppliedHex = chrome.statusBarColorHex;
  lastAppliedStyle = chrome.statusBarStyle;
  return chrome;
}

/** إعادة مزامنة حسب المسار الحالي (بعد تبديل الوضع). */
export async function reapplyPageChromeFromLocation(
  resolvedTheme: "light" | "dark",
): Promise<void> {
  if (typeof window === "undefined") return;
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  let pathname = window.location.pathname || "/";
  if (base && base !== "/" && pathname.startsWith(base)) {
    pathname = pathname.slice(base.length) || "/";
  }
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  await applyPageChrome({ pathname, resolvedTheme, force: true });
}

/** تهيئة إقلاع: overlay + لون افتراضي (قبل React إن أمكن). */
export async function bootstrapStatusBarOverlay(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar } = await import("@capacitor/status-bar");
    await StatusBar.setOverlaysWebView({ overlay: true });
    overlaysConfigured = true;
  } catch {
    /* تجاهل */
  }
}
