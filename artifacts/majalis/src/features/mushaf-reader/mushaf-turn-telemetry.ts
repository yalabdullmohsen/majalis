/**
 * قياسات تقليب المصحف — تُفعَّل في DEV أو localStorage mushaf-turn-telemetry=1.
 * لا تأثير على مسار الإنتاج عند التعطيل.
 *
 * مقاييس الجلسة: touch→move، أزمنة الإطارات (worst/p95/p99)، dropped، hitch.
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

export type MushafFrameStats = {
  samples: number;
  fps: number;
  frameTimeMsAvg: number;
  frameTimeMsP95: number;
  frameTimeMsP99: number;
  frameTimeMsWorst: number;
  droppedFrames: number;
  hitchRatio: number;
  touchToMoveMs: number | null;
};

type Session = {
  page: number;
  t0: number;
  marks: Partial<Record<MushafTurnMark, number>>;
  measureCount: number;
  renderCount: number;
  fontLoadCount: number;
  cacheHits: number;
  cacheMisses: number;
  frameDeltas: number[];
  sampling: boolean;
  rafId: number | null;
  lastFrameTs: number;
};

let session: Session | null = null;
let enabled = false;

const TARGET_FRAME_MS = 1000 / 60;
const HITCH_MS = 32;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)] ?? 0;
}

function computeFrameStats(s: Session): MushafFrameStats {
  const deltas = s.frameDeltas.slice().sort((a, b) => a - b);
  const n = deltas.length;
  const sum = deltas.reduce((a, b) => a + b, 0);
  const avg = n > 0 ? sum / n : 0;
  const dropped = deltas.filter((d) => d > TARGET_FRAME_MS * 1.5).length;
  const hitches = deltas.filter((d) => d >= HITCH_MS).length;
  const touch =
    s.marks.firstPageMovement != null && s.marks.touchStart != null
      ? Math.max(0, s.marks.firstPageMovement - s.marks.touchStart)
      : s.marks.firstPageMovement ?? null;
  return {
    samples: n,
    fps: avg > 0 ? 1000 / avg : 0,
    frameTimeMsAvg: avg,
    frameTimeMsP95: percentile(deltas, 95),
    frameTimeMsP99: percentile(deltas, 99),
    frameTimeMsWorst: n > 0 ? deltas[n - 1]! : 0,
    droppedFrames: dropped,
    hitchRatio: n > 0 ? hitches / n : 0,
    touchToMoveMs: touch,
  };
}

export function enableMushafTurnTelemetry(on = true): void {
  enabled =
    on &&
    (import.meta.env?.DEV === true ||
      import.meta.env?.MODE === "development" ||
      (typeof localStorage !== "undefined" && localStorage.getItem("mushaf-turn-telemetry") === "1"));
}

function ensureSession(page?: number): Session {
  const now = performance.now();
  if (!session) {
    session = {
      page: page ?? 0,
      t0: now,
      marks: {},
      measureCount: 0,
      renderCount: 0,
      fontLoadCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      frameDeltas: [],
      sampling: false,
      rafId: null,
      lastFrameTs: 0,
    };
  }
  if (page != null) session.page = page;
  return session;
}

function sampleLoop(ts: number): void {
  if (!session?.sampling) return;
  if (session.lastFrameTs > 0) {
    const delta = ts - session.lastFrameTs;
    if (delta > 0 && delta < 250) session.frameDeltas.push(delta);
  }
  session.lastFrameTs = ts;
  session.rafId = requestAnimationFrame(sampleLoop);
}

export function mushafTurnMark(mark: MushafTurnMark, page?: number): void {
  if (!enabled) return;
  const now = performance.now();
  if (!session || (page != null && mark === "touchStart")) {
    if (session?.rafId != null) cancelAnimationFrame(session.rafId);
    session = {
      page: page ?? session?.page ?? 0,
      t0: now,
      marks: {},
      measureCount: 0,
      renderCount: 0,
      fontLoadCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      frameDeltas: [],
      sampling: false,
      rafId: null,
      lastFrameTs: 0,
    };
  }
  const s = ensureSession(page);
  s.marks[mark] = Math.round(now - s.t0);
  if (mark === "firstPageMovement" || mark === "touchStart") {
    mushafTurnStartFrameSample();
  }
  if (mark === "transitionSettled" || mark === "activePageCommit") {
    mushafTurnStopFrameSample();
  }
}

export function mushafTurnStartFrameSample(): void {
  if (!enabled) return;
  const s = ensureSession();
  if (s.sampling) return;
  s.sampling = true;
  s.lastFrameTs = 0;
  s.rafId = requestAnimationFrame(sampleLoop);
}

export function mushafTurnStopFrameSample(): void {
  if (!session) return;
  session.sampling = false;
  if (session.rafId != null) {
    cancelAnimationFrame(session.rafId);
    session.rafId = null;
  }
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

export function mushafTurnFlush(label = "mushaf-turn"): MushafFrameStats | null {
  if (!enabled || !session) return null;
  mushafTurnStopFrameSample();
  const frames = computeFrameStats(session);
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info(`[${label}]`, {
      page: session.page,
      ...session.marks,
      frames,
      stats: {
        measureCount: session.measureCount,
        renderCount: session.renderCount,
        fontLoadCount: session.fontLoadCount,
        cacheHits: session.cacheHits,
        cacheMisses: session.cacheMisses,
      },
    });
  }
  session = null;
  return frames;
}
