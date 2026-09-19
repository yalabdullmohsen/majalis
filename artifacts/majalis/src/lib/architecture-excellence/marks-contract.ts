/**
 * عقد علامات الأداء لبرنامج Architecture Excellence.
 * PR-1: توثيق فقط — لا يستورد من main/App (يبقى خارج Initial Bundle).
 */

export const ARCHITECTURE_PERF_MARKS = [
  "mj:theme-applied",
  "mj:safe-area-ready",
  "mj:home-painted",
] as const;

export type ArchitecturePerfMark = (typeof ARCHITECTURE_PERF_MARKS)[number];

/** بادئة علامات التنقل في App.tsx */
export const ROUTE_NAV_MARK_PREFIX = "route-nav:";

/** بادئة تفاعلات markInteraction */
export const INTERACTION_MARK_PREFIX = "ix:";

export const ARCHITECTURE_NOT_MEASURED_KEYS = [
  "coldStartMs",
  "warmStartMs",
  "resumeMs",
  "clickToShellMs",
  "clickToContentMs",
  "lessonDetailShellMs",
  "searchTypingLagMs",
  "duplicateRequestCount",
  "memoryAfter25RoutesMb",
  "memoryAfter100RoutesMb",
  "lighthouseHomeThisSession",
  "homeNetworkRequestCount",
] as const;

/** ميزانيات مقفولة — أي رفع = فشل بوابة البرنامج */
export const ARCHITECTURE_BUDGETS_LOCKED = {
  entryJsGzipBytes: 120 * 1024 + 320,
  iconsJsGzipBytes: 30 * 1024,
  mainCssGzipBytes: 100 * 1024,
} as const;
