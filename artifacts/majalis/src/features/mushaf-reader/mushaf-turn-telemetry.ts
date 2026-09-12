/**
 * قياسات تطويرية لثبات تقليب المصحف — Debug فقط (لا تُشغَّل في الإنتاج).
 */
type MushafTurnMark =
  | "touchStart"
  | "firstPageMovement"
  | "pageDataReady"
  | "fontReady"
  | "layoutStart"
  | "layoutComplete"
  | "transitionStart"
  | "transitionSettled"
  | "activePageCommit";

type Session = {
  page: number;
  t0: number;
  marks: Partial<Record<MushafTurnMark, number>>;
  measureCount: number;
  renderCount: number;
  fontLoadCount: number;
  cacheHits: number;
  cacheMisses: number;
};

let session: Session | null = null;
let enabled = false;

export function enableMushafTurnTelemetry(on = true): void {
  enabled =
    on &&
    (import.meta.env?.DEV === true ||
      import.meta.env?.MODE === "development" ||
      (typeof localStorage !== "undefined" && localStorage.getItem("mushaf-turn-telemetry") === "1"));
}

export function mushafTurnMark(mark: MushafTurnMark, page?: number): void {
  if (!enabled) return;
  const now = performance.now();
  if (!session || (page != null && mark === "touchStart")) {
    session = {
      page: page ?? session?.page ?? 0,
      t0: now,
      marks: {},
      measureCount: 0,
      renderCount: 0,
      fontLoadCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }
  if (page != null) session.page = page;
  session.marks[mark] = Math.round(now - session.t0);
}

export function mushafTurnInc(
  kind: "measure" | "render" | "fontLoad" | "cacheHit" | "cacheMiss",
): void {
  if (!enabled || !session) return;
  if (kind === "measure") session.measureCount += 1;
  else if (kind === "render") session.renderCount += 1;
  else if (kind === "fontLoad") session.fontLoadCount += 1;
  else if (kind === "cacheHit") session.cacheHits += 1;
  else session.cacheMisses += 1;
}

export function mushafTurnFlush(label = "mushaf-turn"): void {
  if (!enabled || !session) return;
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info(`[${label}]`, { page: session.page, ...session.marks, stats: { ...session } });
  }
  session = null;
}
