/**
 * علامات أداء تجربة المصحف — أسماء المواصفة (PR-0).
 * تُفعَّل في DEV أو localStorage mushaf-experience-perf=1 فقط.
 * لا تؤثر على مسار الإنتاج عند التعطيل · لا تمس Geometry/نص.
 */

export const MUSHAF_EXPERIENCE_MARKS = [
  "mushaf:route-start",
  "mushaf:reader-mounted",
  "mushaf:page-data-ready",
  "mushaf:font-ready",
  "mushaf:first-page-rendered",
  "mushaf:first-stable-frame",
  "mushaf:flip-start",
  "mushaf:flip-complete",
  "mushaf:selection-start",
  "mushaf:selection-complete",
] as const;

export type MushafExperienceMark = (typeof MUSHAF_EXPERIENCE_MARKS)[number];

let enabled = false;
let firstPagePainted = false;
let firstStable = false;

function refreshEnabled(): boolean {
  enabled =
    import.meta.env?.DEV === true ||
    import.meta.env?.MODE === "development" ||
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("mushaf-experience-perf") === "1");
  return enabled;
}

export function enableMushafExperiencePerf(on = true): void {
  enabled = on && refreshEnabled();
}

export function mushafExperienceMark(name: MushafExperienceMark): void {
  if (!enabled && !refreshEnabled()) return;
  if (typeof performance === "undefined" || typeof performance.mark !== "function") return;
  try {
    performance.mark(name);
  } catch {
    /* ignore duplicate/unsupported */
  }
}

/**
 * يُستدعى من mushafTurnMark — جسر بلا استدعاء مرتد لعلامات التقليب.
 */
export function mushafExperienceOnTurnMark(
  turn:
    | "touchStart"
    | "pageDataReady"
    | "fontReady"
    | "layoutComplete"
    | "transitionStart"
    | "transitionSettled"
    | "activePageCommit"
    | string,
): void {
  if (!enabled && !refreshEnabled()) return;
  switch (turn) {
    case "touchStart":
    case "transitionStart":
      mushafExperienceMark("mushaf:flip-start");
      break;
    case "pageDataReady":
      mushafExperienceMark("mushaf:page-data-ready");
      break;
    case "fontReady":
      mushafExperienceMark("mushaf:font-ready");
      break;
    case "layoutComplete":
      if (!firstPagePainted) {
        firstPagePainted = true;
        mushafExperienceMark("mushaf:first-page-rendered");
      }
      break;
    case "transitionSettled":
      if (!firstStable) {
        firstStable = true;
        mushafExperienceMark("mushaf:first-stable-frame");
      }
      break;
    case "activePageCommit":
      mushafExperienceMark("mushaf:flip-complete");
      break;
    default:
      break;
  }
}

export function mushafExperienceResetBootFlags(): void {
  firstPagePainted = false;
  firstStable = false;
}
