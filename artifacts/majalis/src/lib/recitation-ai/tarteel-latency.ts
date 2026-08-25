/**
 * قياسات كمون مسار التلاوة الفوري (بدون صوت/نص).
 * قبل: فتح الصفحة → أول partial غالبًا بارد (مصافحة WS + ميكروفون).
 * بعد: تسخين WS عند فتح الصفحة + partials مؤقتة + مطابقة كلمات تدريجية.
 *
 * أهداف تقريبية (دافئ): page→ws_ready ≤ 800ms · button→first_partial ≤ 800ms
 */
export const TARTEEL_LATENCY_MARKS = [
  "page_open",
  "ws_warm_start",
  "ws_warm_ready",
  "ws_warm_skipped",
  "ws_warm_timeout",
  "ws_warm_failed",
  "session_button",
  "first_partial",
  "first_match",
] as const;

export type TarteelLatencyMark = (typeof TARTEEL_LATENCY_MARKS)[number];

export type TarteelLatencySample = {
  mark: TarteelLatencyMark | string;
  atMs: number;
  ms?: number;
};

const MAX = 48;
const samples: TarteelLatencySample[] = [];
let pageOpenAt = 0;
let sessionButtonAt = 0;

export function markTarteelLatency(
  mark: TarteelLatencyMark | string,
  extra: { ms?: number } = {},
): void {
  const atMs = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (mark === "page_open") pageOpenAt = atMs;
  if (mark === "session_button") sessionButtonAt = atMs;
  const sample: TarteelLatencySample = { mark, atMs, ...extra };
  samples.push(sample);
  if (samples.length > MAX) samples.shift();
  if (typeof console !== "undefined" && console.warn) {
    console.warn("[tarteel-latency]", mark, extra.ms ?? "", {
      fromPage: pageOpenAt ? Math.round(atMs - pageOpenAt) : null,
      fromButton: sessionButtonAt ? Math.round(atMs - sessionButtonAt) : null,
    });
  }
}

export function getTarteelLatencySamples(): readonly TarteelLatencySample[] {
  return samples;
}

export function resetTarteelLatency(): void {
  samples.length = 0;
  pageOpenAt = 0;
  sessionButtonAt = 0;
}

export function summarizeTarteelLatency(): {
  pageToWsReadyMs: number | null;
  buttonToFirstPartialMs: number | null;
  buttonToFirstMatchMs: number | null;
} {
  const wsReady = [...samples].reverse().find((s) => s.mark === "ws_warm_ready");
  const firstPartial = samples.find((s) => s.mark === "first_partial");
  const firstMatch = samples.find((s) => s.mark === "first_match");
  return {
    pageToWsReadyMs:
      pageOpenAt && wsReady ? Math.round(wsReady.atMs - pageOpenAt) : (wsReady?.ms ?? null),
    buttonToFirstPartialMs:
      sessionButtonAt && firstPartial ? Math.round(firstPartial.atMs - sessionButtonAt) : null,
    buttonToFirstMatchMs:
      sessionButtonAt && firstMatch ? Math.round(firstMatch.atMs - sessionButtonAt) : null,
  };
}

/** أهداف بعد مسار التسخين (تشغيلات دافئة). */
export const TARTEEL_LATENCY_TARGETS = {
  pageToWsReadyMs: 800,
  buttonToFirstPartialMs: 800,
  buttonToFirstMatchMs: 1200,
} as const;
