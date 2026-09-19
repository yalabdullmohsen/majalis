/**
 * عقد علامات وميزانيات برنامج Whole-App Excellence (WAVE 1).
 * توثيق فقط — لا يُستورد من main/App (يبقى خارج Initial Bundle).
 */

export const WHOLE_APP_PERF_MARKS = [
  "mj:theme-applied",
  "mj:safe-area-ready",
  "mj:home-painted",
] as const;

export type WholeAppPerfMark = (typeof WHOLE_APP_PERF_MARKS)[number];

export const WHOLE_APP_ROUTE_NAV_PREFIX = "route-nav:";
export const WHOLE_APP_INTERACTION_PREFIX = "ix:";

/** مفاتيح يجب أن تبقى NOT MEASURED حتى تُقاس بجهاز/harness حقيقي */
export const WHOLE_APP_NOT_MEASURED_KEYS = [
  "coldStartMs",
  "warmStartMs",
  "resumeMs",
  "homeReadinessMs",
  "routeTransitionMs",
  "clickToShellMs",
  "clickToContentMs",
  "lessonListMs",
  "lessonDetailShellMs",
  "searchTypingLagMs",
  "prayerSurfaceMs",
  "quranHubMs",
  "mushafOpenMs",
  "settingsOpenMs",
  "touchToResponseMs",
  "frameDropCount",
  "longTaskCount",
  "clsSession",
  "duplicateRequestCount",
  "renderCountSample",
  "memoryAfter25RoutesMb",
  "memoryAfter100RoutesMb",
  "lighthouseHomeThisSession",
  "homeNetworkRequestCount",
] as const;

/** ميزانيات مقفولة — أي رفع = فشل بوابة البرنامج */
export const WHOLE_APP_BUDGETS_LOCKED = {
  entryJsGzipBytes: 120 * 1024 + 320,
  iconsJsGzipBytes: 30 * 1024,
  mainCssGzipBytes: 100 * 1024,
  mushafReaderPageJsGzipBytesSoft: 40 * 1024,
} as const;
