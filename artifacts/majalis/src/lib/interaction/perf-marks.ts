/**
 * علامات أداء خفيفة للتفاعل — DEV/قياس فقط، بلا I/O ثقيل في Release.
 */

const ENABLED =
  typeof import.meta !== "undefined" &&
  Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);

export type InteractionMark =
  | "touchVisual"
  | "navStart"
  | "firstUsefulFrame"
  | "searchOpen"
  | "searchFirstResult"
  | "sheetOpen"
  | "tabSwitch"
  | "mushafPageTurn";

export function markInteraction(name: InteractionMark, detail?: string): void {
  if (!ENABLED || typeof performance === "undefined") return;
  try {
    const label = detail ? `ix:${name}:${detail}` : `ix:${name}`;
    performance.mark(label);
  } catch {
    /* ignore */
  }
}

export function measureInteraction(start: string, end: string, name: string): number | null {
  if (!ENABLED || typeof performance === "undefined") return null;
  try {
    performance.measure(name, start, end);
    const entries = performance.getEntriesByName(name);
    const last = entries[entries.length - 1];
    return last ? last.duration : null;
  } catch {
    return null;
  }
}
