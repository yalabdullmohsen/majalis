/**
 * تحميل مسبق للمسارات الأكثر زيارة عند خمول المتصفح.
 * خفيف نسبيًا: هيكل المسارات + مراكز التبويب (بلا مصحف/بحث ثقيل).
 */
import { prefetchAppRoutesShell } from "@/lib/prefetch-app-routes";
import { prefetchHomeWarmRoutes } from "@/lib/prefetch-route";

const TOP_ROUTES: Array<() => Promise<unknown>> = [
  () => import("@/pages/account/SectionsPage"),
  () => import("@/pages/quran/QuranHubPage"),
  () => import("@/pages/worship/PrayerTimesPage"),
  () => import("@/pages/lessons/LessonsPage"),
  () => import("@/pages/hadith/HadithPage"),
  () => import("@/pages/fiqh/FiqhPage"),
  () => import("@/pages/worship/AdhkarPage"),
  () => import("@/pages/quran/TafsirPage"),
];

export function prefetchTopRoutesOnIdle(): void {
  if (typeof window === "undefined") return;
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    prefetchAppRoutesShell();
    prefetchHomeWarmRoutes();
    for (const load of TOP_ROUTES) {
      void load().catch(() => undefined);
    }
  };
  const start = () => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(run, { timeout: 8_000 });
    } else {
      window.setTimeout(run, 4_000);
    }
  };
  // بعد LCP بكثير — لا تنافس TBT في نافذة القياس
  const afterLoad = () => window.setTimeout(start, 25_000);
  if (document.readyState === "complete") afterLoad();
  else window.addEventListener("load", afterLoad, { once: true });
}
