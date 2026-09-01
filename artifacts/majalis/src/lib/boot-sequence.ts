/**
 * تسلسل إقلاع موحّد — إقلاع فوري بلا وميض.
 *
 * المراحل:
 * 1) مسح كاش تالف/مفاتيح قديمة (متزامن، غير حاجب)
 * 2) ترطيب حالة UI الأساسية (ثيم/خط/آخر صفحة مصحف) من التخزين المحلي
 * 3) قفل مقاييس التخطيط (متغيّرات CSS) لمنع CLS
 * 4) بعد createRoot: تخزين أصلي + خطوط + إطلاق Splash عند الجاهزية
 *
 * مهم: لا await Preferences/كاش قبل createRoot (راجع boot-mount-order-gate).
 */
import { applyFontPreference, readFontPreference } from "@/lib/font-preference";
import { loadLastPageSync } from "@/lib/quran-last-page";
import {
  ensureAppVersionMarker,
  purgeLegacyColdBootKeysSync,
  purgeStaleRuntimeCaches,
} from "@/lib/runtime-cache-purge";
import { readThemePreference, resolveTheme } from "@/lib/theme-preference";
import { applyPreferences, readPreferences } from "@/lib/user-preferences";

export type BootPhase =
  | "idle"
  | "purge"
  | "hydrate"
  | "layout-lock"
  | "await-paint"
  | "ready";

let phase: BootPhase = "idle";

export function getBootPhase(): BootPhase {
  return phase;
}

/**
 * المرحلة 1+2+3 — متزامنة قبل createRoot.
 * لا تلمس الشبكة ولا Preferences.
 */
export function runBootSequenceBeforeMount(): void {
  phase = "purge";
  try {
    purgeLegacyColdBootKeysSync();
  } catch {
    /* ignore */
  }
  // كاش العرض عند تغيّر النسخة — غير حاجب
  void purgeStaleRuntimeCaches({ reloadOnce: false })
    .then(() => ensureAppVersionMarker())
    .catch(() => ensureAppVersionMarker());

  phase = "hydrate";
  try {
    const theme = resolveTheme(readThemePreference());
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("theme-dark", theme === "dark");
    root.classList.toggle("theme-light", theme === "light");
    root.setAttribute("dir", "rtl");
    root.lang = "ar";
    applyFontPreference(readFontPreference());
    applyPreferences(readPreferences());
    // سخّن ذاكرة آخر صفحة مصحف فورًا (قراءة sync) — يمنع وميض الصفحة 1
    loadLastPageSync();
  } catch {
    /* ignore */
  }

  phase = "layout-lock";
  lockBootLayoutMetrics();
}

/**
 * يثبت أبعاد الهيكل قبل أول رسم React لتقليل CLS.
 */
export function lockBootLayoutMetrics(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const ensure = (name: string, fallback: string) => {
    const cur = cs.getPropertyValue(name).trim();
    if (!cur || cur === "0px") {
      root.style.setProperty(name, fallback);
    }
  };
  ensure("--header-chrome", "56px");
  ensure("--nav-chrome", "56px");
  ensure("--bottom-nav-height", "64px");
  ensure("--top-sponsor-content-h", "40px");
  // قفل منطقة المحتوى الأولى (هيكل ثابت)
  const banner = cs.getPropertyValue("--ad-banner-height").trim();
  if (!banner) {
    root.style.setProperty("--ad-banner-height", "0px");
  }
  root.dataset.mjLayoutLock = "1";
}

/**
 * المرحلة 4 — بعد createRoot: يُستدعى من مسار splash/boot-readiness.
 */
export function markBootAwaitPaint(): void {
  phase = "await-paint";
}

export function markBootReady(): void {
  phase = "ready";
  try {
    document.documentElement.dataset.mjBoot = "ready";
  } catch {
    /* ignore */
  }
}

/**
 * تسخين غير حاجب لتخطيط آخر صفحة مصحف — بعد idle طويل وفقط إن كان المسار مصحفًا.
 */
export function scheduleMushafLastPagePrewarm(): void {
  const run = () => {
    try {
      const path = typeof location !== "undefined" ? location.pathname : "";
      if (!path.includes("mushaf")) return;
      const page = loadLastPageSync();
      if (!page) return;
      void import("@/lib/quran-data/qpc-page-data")
        .then((m) => m.loadMushafPage(page))
        .catch(() => {});
    } catch {
      /* ignore */
    }
  };
  const start = () => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => run(), { timeout: 8_000 });
    } else {
      window.setTimeout(run, 2_000);
    }
  };
  window.setTimeout(start, 15_000);
}
