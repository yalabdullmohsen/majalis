/**
 * عقد علامات وميزانيات برنامج Sunnah World-Class Product Polish (PR-1).
 * توثيق فقط — لا يُستورد من main/App (يبقى خارج Initial Bundle).
 */

export const WORLD_CLASS_PERF_MARKS = [
  "mj:theme-applied",
  "mj:safe-area-ready",
  "mj:home-painted",
] as const;

export type WorldClassPerfMark = (typeof WORLD_CLASS_PERF_MARKS)[number];

export const WORLD_CLASS_ROUTE_NAV_PREFIX = "route-nav:";
export const WORLD_CLASS_INTERACTION_PREFIX = "ix:";

/** مفاتيح يجب أن تبقى NOT MEASURED حتى تُقاس بجهاز/harness حقيقي */
export const WORLD_CLASS_NOT_MEASURED_KEYS = [
  "coldStartMs",
  "warmStartMs",
  "resumeMs",
  "deepLinkOpenMs",
  "stableShellReadyMs",
  "firstMeaningfulContentMs",
  "touchToFeedbackMs",
  "touchToNavigationMs",
  "buttonResponseMs",
  "cardResponseMs",
  "filterResponseMs",
  "searchTypingLatencyMs",
  "sheetOpenCloseMs",
  "homeToSectionMs",
  "sectionToDetailMs",
  "searchToResultMs",
  "lessonListToDetailMs",
  "quranHubToMushafMs",
  "prayerToSettingsMs",
  "backNavigationMs",
  "frameDropCount",
  "longTaskCount",
  "layoutShiftSession",
  "renderCountSample",
  "remountCountSample",
  "repaintCostSample",
  "memoryGrowthMb",
  "duplicateRequestCount",
  "lighthouseHomeThisSession",
  "homeNetworkRequestCount",
  "fpsScrollHome",
  "fpsScrollQuranHub",
  "fpsScrollLessons",
] as const;

/** ميزانيات مقفولة — أي رفع = فشل بوابة البرنامج */
export const WORLD_CLASS_BUDGETS_LOCKED = {
  entryJsGzipBytes: 120 * 1024 + 320,
  iconsJsGzipBytes: 30 * 1024,
  mainCssGzipBytes: 100 * 1024,
  mushafReaderPageJsGzipBytesSoft: 40 * 1024,
} as const;

/** App Store: العمل للإصدار التالي فقط */
export const WORLD_CLASS_APP_STORE_POLICY = {
  inReview: true,
  modifySubmittedBuild: false,
  withdrawWithoutOwnerDecision: false,
  releaseBlockerLabel: "RELEASE_BLOCKER_CRITICAL",
} as const;
