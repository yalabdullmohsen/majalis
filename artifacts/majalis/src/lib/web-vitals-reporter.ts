/**
 * Lightweight Core Web Vitals reporter (no extra dependency).
 *
 * Emits LCP / INP (or FID fallback) / CLS / TTFB via PerformanceObserver,
 * logs to console in prod, and optionally POSTs to a beacon URL if
 * `VITE_WEB_VITALS_BEACON` is set (e.g. your analytics collector).
 *
 * For full Vercel Speed Insights later, mount `@vercel/speed-insights`
 * separately — see docs/quran-engine-going-live.md.
 */
export type VitalName = "LCP" | "INP" | "FID" | "CLS" | "TTFB";

export type VitalMetric = {
  name: VitalName;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  id: string;
  navigationType?: string;
};

type RatingThreshold = { good: number; poor: number };

const THRESHOLDS: Record<VitalName, RatingThreshold> = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
};

function rate(name: VitalName, value: number): VitalMetric["rating"] {
  const t = THRESHOLDS[name];
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

function emit(metric: VitalMetric): void {
  if (import.meta.env.DEV) {
    console.info(`[web-vitals] ${metric.name}=${metric.value.toFixed(2)} (${metric.rating})`);
  } else if (metric.rating !== "good") {
    console.warn(`[web-vitals] ${metric.name}=${metric.value.toFixed(2)} (${metric.rating})`);
  }

  const beacon = import.meta.env.VITE_WEB_VITALS_BEACON as string | undefined;
  if (!beacon || typeof navigator === "undefined") return;
  try {
    const body = JSON.stringify({
      ...metric,
      path: typeof location !== "undefined" ? location.pathname : "",
      ts: Date.now(),
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(beacon, body);
    } else {
      void fetch(beacon, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    /* never block UX */
  }
}

function observeLcp(): void {
  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (!last) return;
      emit({
        name: "LCP",
        value: last.startTime,
        rating: rate("LCP", last.startTime),
        id: `lcp-${Math.round(last.startTime)}`,
      });
    });
    po.observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    /* unsupported */
  }
}

function observeInpOrFid(): void {
  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEventTiming;
        const value =
          typeof e.duration === "number"
            ? e.duration
            : e.processingStart && e.startTime
              ? e.processingStart - e.startTime
              : 0;
        const name: VitalName =
          entry.entryType === "event" || entry.entryType === "first-input"
            ? entry.entryType === "first-input"
              ? "FID"
              : "INP"
            : "INP";
        emit({
          name,
          value,
          rating: rate(name, value),
          id: `${name.toLowerCase()}-${Math.round(value)}`,
        });
      }
    });
    try {
      po.observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    } catch {
      po.observe({ type: "first-input", buffered: true });
    }
  } catch {
    /* unsupported */
  }
}

function observeCls(): void {
  try {
    let cls = 0;
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
        if (!entry.hadRecentInput) cls += entry.value ?? 0;
      }
      emit({
        name: "CLS",
        value: cls,
        rating: rate("CLS", cls),
        id: `cls-${cls.toFixed(4)}`,
      });
    });
    po.observe({ type: "layout-shift", buffered: true });
  } catch {
    /* unsupported */
  }
}

function observeTtfb(): void {
  try {
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (!nav) return;
    const value = nav.responseStart - nav.requestStart;
    if (!Number.isFinite(value) || value < 0) return;
    emit({
      name: "TTFB",
      value,
      rating: rate("TTFB", value),
      id: `ttfb-${Math.round(value)}`,
      navigationType: nav.type,
    });
  } catch {
    /* unsupported */
  }
}

/** Idempotent — call once after first paint (idle). */
let started = false;
export function startWebVitalsReporting(): void {
  if (started || typeof window === "undefined" || typeof PerformanceObserver === "undefined") {
    return;
  }
  started = true;
  observeTtfb();
  observeLcp();
  observeInpOrFid();
  observeCls();
}
