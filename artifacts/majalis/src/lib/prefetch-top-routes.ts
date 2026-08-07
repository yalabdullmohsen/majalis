/**
 * تحميل مسبق للمسارات الأربعة الأكثر زيارة عند خمول المتصفح.
 */
const TOP_ROUTES: Array<() => Promise<unknown>> = [
  () => import("@/pages/account/HomePage"),
  () => import("@/pages/lessons/LessonsPage"),
  () => import("@/pages/worship/PrayerTimesPage"),
  () => import("@/pages/quran/QuranKnowledgeHubPage"),
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
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 4_000 });
  } else {
    window.setTimeout(run, 2_000);
  }
}
