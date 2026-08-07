/**
 * مصدر واحد لوسوم viewport / theme-color / color-scheme.
 * يُستدعى من App وPageShell (idempotent) حتى لا يختلف شريط الحالة بين الصفحات.
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

/** يفرض الصيغة الوحيدة المسموحة لـ viewport وtheme-color السطحي. */
export function ensureChromeMeta(resolvedTheme?: "light" | "dark") {
  if (typeof document === "undefined") return;

  upsertMeta("name", "viewport", VIEWPORT_CONTENT);
  upsertMeta("name", "color-scheme", "light dark");

  // عند فرض الوضع من التطبيق: لون واحد مطابق للسطح.
  // عند التلقائي: زوج media يبقى متزامنًا مع نظام التشغيل.
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

  // منع تكبير معطّل (WCAG 1.4.4) — احذف أي بقايا maximum-scale/user-scalable
  const vp = document.head.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
  if (vp) {
    const c = vp.getAttribute("content") || "";
    if (/maximum-scale|user-scalable/i.test(c)) {
      vp.setAttribute("content", VIEWPORT_CONTENT);
    }
  }
}
