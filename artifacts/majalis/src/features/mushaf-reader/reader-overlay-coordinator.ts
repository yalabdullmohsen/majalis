/**
 * منسّق طبقات أدوات القارئ — لوحة تفاعلية واحدة فقط في الوقت نفسه.
 * Mini player صوتية يمكن أن تبقى مع طبقات أخرى بحسب السياسة.
 */

export type ReaderOverlayKind =
  | "none"
  | "tafsir"
  | "audioMini"
  | "audioFull"
  | "ayahActions"
  | "search"
  | "index"
  | "bookmark"
  | "settings";

const EXCLUSIVE: ReadonlySet<ReaderOverlayKind> = new Set([
  "tafsir",
  "audioFull",
  "ayahActions",
  "search",
  "index",
  "bookmark",
  "settings",
]);

export function nextExclusiveOverlay(
  current: ReaderOverlayKind,
  requested: ReaderOverlayKind,
): ReaderOverlayKind {
  if (requested === "none") return "none";
  if (requested === "audioMini") {
    /* Mini يُسمح بجانب none فقط؛ الطبقات الحصرية تبقى أولوية */
    return EXCLUSIVE.has(current) ? current : "audioMini";
  }
  return requested;
}

export function overlaysClosedByPageTurn(kind: ReaderOverlayKind): boolean {
  return kind === "tafsir" || kind === "ayahActions" || kind === "search" || kind === "index";
}
