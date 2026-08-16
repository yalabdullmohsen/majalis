/**
 * PageChrome — مصدر واحد للون منطقة الحالة (status bar) وأيقوناتها حسب المسار.
 * الخلفية الحقيقية تحت الشريط من CSS (--app-status-bg)؛ على الأصل نضبط style فقط
 * (+ setBackgroundColor كأفضل جهد على Android).
 */
import { BRAND_THEME_COLOR, BRAND_THEME_COLOR_DARK } from "@/lib/site-config";

/** dark = أيقونات داكنة (خلفية فاتحة) · light = أيقونات فاتحة (خلفية داكنة) */
export type StatusBarIconStyle = "dark" | "light";

export type PageChromeDef = {
  /** قيمة CSS لـ --app-status-bg */
  statusBarColor: string;
  /** لون سداسي لـ theme-color / Capacitor (لا يعتمد على حساب CSS) */
  statusBarColorHex: string;
  statusBarStyle: StatusBarIconStyle;
};

export type PageChromeKey =
  | "home"
  | "quran"
  | "mushaf"
  | "prayer"
  | "lessons"
  | "fiqh"
  | "more"
  | "settings"
  | "default";

const SURFACE_LIGHT = BRAND_THEME_COLOR; // #F2F4F3
const SURFACE_DARK = BRAND_THEME_COLOR_DARK; // #101614 / ليلي التطبيق قد يكون #131A18
const SURFACE_DARK_APP = "#131A18";
/** زمرد مواقيت الصلاة — يطابق --em-950 */
export const PRAYER_STATUS_HEX = "#091814";
/** ورق المصحف */
export const MUSHAF_PAPER_HEX = "#FBF7EF";

type ChromePair = { light: PageChromeDef; dark: PageChromeDef };

function pair(
  lightHex: string,
  lightStyle: StatusBarIconStyle,
  darkHex: string,
  darkStyle: StatusBarIconStyle,
  cssVar = "var(--mj-bg)",
): ChromePair {
  return {
    light: {
      statusBarColor: cssVar,
      statusBarColorHex: lightHex,
      statusBarStyle: lightStyle,
    },
    dark: {
      statusBarColor: cssVar,
      statusBarColorHex: darkHex,
      statusBarStyle: darkStyle,
    },
  };
}

/**
 * تعريفات الصفحات — الألوان تُختار حسب الوضع المحلول (light/dark).
 * الصلاة والمصحف ثابتة الهوية بغض النظر عن الوضع قدر الإمكان.
 */
export const PAGE_CHROME: Record<PageChromeKey, ChromePair> = {
  home: pair(SURFACE_LIGHT, "dark", SURFACE_DARK_APP, "light"),
  quran: pair(SURFACE_LIGHT, "dark", SURFACE_DARK_APP, "light"),
  mushaf: {
    light: {
      statusBarColor: "var(--color-mushaf-paper, #FBF7EF)",
      statusBarColorHex: MUSHAF_PAPER_HEX,
      statusBarStyle: "dark",
    },
    dark: {
      statusBarColor: "var(--color-mushaf-paper, #FBF7EF)",
      statusBarColorHex: MUSHAF_PAPER_HEX,
      statusBarStyle: "dark",
    },
  },
  prayer: {
    light: {
      statusBarColor: "var(--em-950, #091814)",
      statusBarColorHex: PRAYER_STATUS_HEX,
      statusBarStyle: "light",
    },
    dark: {
      statusBarColor: "var(--em-950, #091814)",
      statusBarColorHex: PRAYER_STATUS_HEX,
      statusBarStyle: "light",
    },
  },
  lessons: pair(SURFACE_LIGHT, "dark", SURFACE_DARK_APP, "light", "var(--mj-bg)"),
  fiqh: pair(SURFACE_LIGHT, "dark", SURFACE_DARK_APP, "light", "var(--mj-bg)"),
  more: pair(SURFACE_LIGHT, "dark", SURFACE_DARK_APP, "light", "var(--mj-surface, var(--mj-bg))"),
  settings: pair(SURFACE_LIGHT, "dark", SURFACE_DARK_APP, "light", "var(--mj-bg)"),
  default: pair(SURFACE_LIGHT, "dark", SURFACE_DARK, "light"),
};

/** يطابق بادئات المسارات إلى مفتاح chrome. */
export function resolvePageChromeKey(pathname: string): PageChromeKey {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";

  if (path === "/") return "home";

  if (
    path === "/prayer-times" ||
    path.startsWith("/prayer-times/") ||
    path === "/adhan-settings" ||
    path.startsWith("/adhan")
  ) {
    return "prayer";
  }

  if (
    path === "/mushaf" ||
    path.startsWith("/mushaf/") ||
    path.startsWith("/quran/mushaf") ||
    path.includes("/recitation-test")
  ) {
    return "mushaf";
  }

  if (
    path.startsWith("/quran") ||
    path.startsWith("/tafsir") ||
    path === "/surahs" ||
    path.startsWith("/surah/") ||
    path.startsWith("/revelation") ||
    path.startsWith("/makki")
  ) {
    return "quran";
  }

  if (path.startsWith("/lessons") || path.startsWith("/teachers") || path.startsWith("/my-learning")) {
    return "lessons";
  }

  if (
    path.startsWith("/fiqh") ||
    path.startsWith("/rulings") ||
    path.startsWith("/zakat") ||
    path.startsWith("/hajj") ||
    path.startsWith("/nikah") ||
    path.startsWith("/talaq") ||
    path.startsWith("/mawarith") ||
    path.startsWith("/janaza") ||
    path.startsWith("/salah-guide")
  ) {
    return "fiqh";
  }

  if (
    path.startsWith("/settings") ||
    path.startsWith("/account") ||
    path.startsWith("/profile") ||
    path.startsWith("/notification") ||
    path === "/privacy" ||
    path.startsWith("/privacy/")
  ) {
    return "settings";
  }

  if (path === "/more" || path.startsWith("/more/")) {
    return "more";
  }

  return "default";
}

export function resolvePageChrome(
  pathname: string,
  resolvedTheme: "light" | "dark" = "light",
): PageChromeDef & { key: PageChromeKey } {
  const key = resolvePageChromeKey(pathname);
  const pairDef = PAGE_CHROME[key] ?? PAGE_CHROME.default;
  const def = resolvedTheme === "dark" ? pairDef.dark : pairDef.light;
  return { ...def, key };
}
