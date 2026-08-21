/**
 * تحميل مسبق للمسارات الأكثر زيارة عند خمول المتصفح.
 */
const TOP_ROUTES: Array<() => Promise<unknown>> = [
  () => import("@/pages/account/SearchPage"),
  () => import("@/pages/account/HomePage"),
  () => import("@/pages/lessons/LessonsPage"),
  () => import("@/pages/worship/PrayerTimesPage"),
  () => import("@/pages/quran/QuranKnowledgeHubPage"),
  () => import("@/pages/quran/QuranHubPage"),
  () => import("@/pages/fiqh/FiqhPage"),
  () => import("@/views/ProphetStoriesPage"),
  () => import("@/pages/quran/QuranPeoplePage"),
  () => import("@/views/NationsPage"),
];

export function prefetchTopRoutesOnIdle(): void {
  if (typeof window === "undefined") return;
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    for (const load of TOP_ROUTES) {
      void load().catch(() => undefined);
    }
  };
  const start = () => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(run, { timeout: 2_000 });
    } else {
      window.setTimeout(run, 1_500);
    }
  };
  const afterLoad = () => window.setTimeout(start, 10_000);
  if (document.readyState === "complete") afterLoad();
  else window.addEventListener("load", afterLoad, { once: true });
}
