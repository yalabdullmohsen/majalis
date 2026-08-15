/**
 * مصدر واحد لوسوم viewport / color-scheme.
 * ألوان theme-color للصفحات تُدار عبر PageChrome (apply-page-chrome) حتى لا تُثبَّت بلون واحد.
 */
import { BRAND_THEME_COLOR, BRAND_THEME_COLOR_DARK } from "@/lib/site-config";

export const VIEWPORT_CONTENT = "width=device-width, initial-scale=1, viewport-fit=cover";

function upsertMeta(attr: "name" | "property", key: string, content: string, media?: string) {
  const sel = media
    ? `meta[${attr}="${key}"][media="${media}"]`
    : `meta[${attr}="${key}"]:not([media])`;
  let el = document.head.querySelector(sel) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    if (media) el.setAttribute("media", media);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export type EnsureChromeMetaOpts = {
  /** لا تكتب theme-color — PageChrome يملكه */
  skipThemeColor?: boolean;
};

/** يفرض viewport وcolor-scheme؛ theme-color اختياري إن لم يملكه PageChrome. */
export function ensureChromeMeta(
  resolvedTheme?: "light" | "dark",
  opts?: EnsureChromeMetaOpts,
) {
  if (typeof document === "undefined") return;

  upsertMeta("name", "viewport", VIEWPORT_CONTENT);
  upsertMeta("name", "color-scheme", "light dark");

  const skipColor =
    opts?.skipThemeColor === true ||
    Boolean(document.documentElement.dataset.pageChrome);

  if (!skipColor) {
    if (resolvedTheme === "dark") {
      upsertMeta("name", "theme-color", BRAND_THEME_COLOR_DARK);
      upsertMeta("name", "theme-color", BRAND_THEME_COLOR_DARK, "(prefers-color-scheme: light)");
      upsertMeta("name", "theme-color", BRAND_THEME_COLOR_DARK, "(prefers-color-scheme: dark)");
    } else if (resolvedTheme === "light") {
      upsertMeta("name", "theme-color", BRAND_THEME_COLOR);
      upsertMeta("name", "theme-color", BRAND_THEME_COLOR, "(prefers-color-scheme: light)");
      upsertMeta("name", "theme-color", BRAND_THEME_COLOR, "(prefers-color-scheme: dark)");
    } else {
      upsertMeta("name", "theme-color", BRAND_THEME_COLOR);
      upsertMeta("name", "theme-color", BRAND_THEME_COLOR, "(prefers-color-scheme: light)");
      upsertMeta("name", "theme-color", BRAND_THEME_COLOR_DARK, "(prefers-color-scheme: dark)");
    }
  }

  const vp = document.head.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
  if (vp) {
    const c = vp.getAttribute("content") || "";
    if (/maximum-scale|user-scalable/i.test(c)) {
      vp.setAttribute("content", VIEWPORT_CONTENT);
    }
  }
}
