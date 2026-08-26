/**
 * RUM — Core Web Vitals (LCP / INP / CLS / TTFB) للمستخدمين الحقيقيين.
 * يُحاكي واجهة web-vitals عبر PerformanceObserver بلا إضافة تبعية للحزمة الرئيسية.
 * لا يُرسل إلا بعد موافقة analytics صريحة (allowsAnalytics).
 */

import { allowsAnalytics } from "@/lib/cookie-consent";
import { getBuildMetadata } from "@/lib/error-report";
import { keepalivePost } from "@/lib/unload-persist";

/** عتبات تنبيه Good CWV (مسار الإنتاج) */
export const RUM_LCP_ALERT_MS = 2500;
export const RUM_INP_ALERT_MS = 200;
export const RUM_CLS_ALERT = 0.1;
export const RUM_TTFB_ALERT_MS = 800;

export type RumMetricName = "LCP" | "INP" | "CLS" | "TTFB";

export type RumMetric = {
  name: RumMetricName;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  id: string;
  navigationType?: string;
  route?: string;
  alert?: boolean;
};

type MetricHandler = (metric: RumMetric) => void;

function ratingFor(name: RumMetricName, value: number): RumMetric["rating"] {
  if (name === "LCP") {
    if (value <= 2500) return "good";
    if (value <= 4000) return "needs-improvement";
    return "poor";
  }
  if (name === "INP") {
    if (value <= 200) return "good";
    if (value <= 500) return "needs-improvement";
    return "poor";
  }
  if (name === "CLS") {
    if (value <= 0.1) return "good";
    if (value <= 0.25) return "needs-improvement";
    return "poor";
  }
  // TTFB
  if (value <= 800) return "good";
  if (value <= 1800) return "needs-improvement";
  return "poor";
}

function isAlert(name: RumMetricName, value: number): boolean {
  if (name === "LCP") return value > RUM_LCP_ALERT_MS;
  if (name === "INP") return value > RUM_INP_ALERT_MS;
  if (name === "CLS") return value > RUM_CLS_ALERT;
  return value > RUM_TTFB_ALERT_MS;
}

function metricId(name: RumMetricName): string {
  return `${name}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function emit(name: RumMetricName, value: number, onReport: MetricHandler): void {
  const metric: RumMetric = {
    name,
    value: name === "CLS" ? Number(value.toFixed(4)) : Math.round(value),
    rating: ratingFor(name, value),
    id: metricId(name),
    route: typeof window !== "undefined" ? window.location.pathname : undefined,
    alert: isAlert(name, value),
  };
  onReport(metric);
}

function observeLcp(onReport: MetricHandler): () => void {
  if (typeof PerformanceObserver === "undefined") return () => undefined;
  let last = 0;
  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const entry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      if (entry) last = entry.startTime;
    });
    po.observe({ type: "largest-contentful-paint", buffered: true });
    const flush = () => {
      if (last > 0) emit("LCP", last, onReport);
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
    window.addEventListener("pagehide", flush, { once: true });
    return () => {
      try {
        po.disconnect();
      } catch {
        /* ignore */
      }
    };
  } catch {
    return () => undefined;
  }
}

function observeCls(onReport: MetricHandler): () => void {
  if (typeof PerformanceObserver === "undefined") return () => undefined;
  let cls = 0;
  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
        if (!entry.hadRecentInput) cls += entry.value || 0;
      }
    });
    po.observe({ type: "layout-shift", buffered: true });
    const flush = () => emit("CLS", cls, onReport);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
    window.addEventListener("pagehide", flush, { once: true });
    return () => {
      try {
        po.disconnect();
      } catch {
        /* ignore */
      }
    };
  } catch {
    return () => undefined;
  }
}

function observeInp(onReport: MetricHandler): () => void {
  if (typeof PerformanceObserver === "undefined") return () => undefined;
  let maxDuration = 0;
  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { duration: number; interactionId?: number }>) {
        if (!entry.interactionId) continue;
        if (entry.duration > maxDuration) maxDuration = entry.duration;
      }
    });
    po.observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    const flush = () => {
      if (maxDuration > 0) emit("INP", maxDuration, onReport);
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
    window.addEventListener("pagehide", flush, { once: true });
    return () => {
      try {
        po.disconnect();
      } catch {
        /* ignore */
      }
    };
  } catch {
    return () => undefined;
  }
}

function observeTtfb(onReport: MetricHandler): void {
  try {
    const nav = performance.getEntriesByType("navigation")[0] as
      | (PerformanceNavigationTiming & { responseStart: number; requestStart: number })
      | undefined;
    if (nav && nav.responseStart > 0) {
      emit("TTFB", nav.responseStart, onReport);
    }
  } catch {
    /* ignore */
  }
}

async function postRum(metric: RumMetric): Promise<void> {
  const { commitHash, buildVersion } = getBuildMetadata();
  const payload = {
    ...metric,
    commitHash,
    buildVersion,
    at: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 240) : "",
  };
  try {
    keepalivePost("/api/rum", payload);
  } catch {
    /* optional */
  }
  if (import.meta.env?.DEV && metric.alert) {
    console.warn(`[rum:alert] ${metric.name}=${metric.value} (${metric.rating})`, metric.route);
  }
}

let started = false;
const cleanups: Array<() => void> = [];

/**
 * يبدأ جمع RUM بعد موافقة التحليلات. آمن للاستدعاء المتكرر.
 */
export function initRumTelemetry(): void {
  if (started || typeof window === "undefined") return;
  if (!allowsAnalytics()) {
    const onConsent = () => {
      if (allowsAnalytics()) {
        window.removeEventListener("majalis-consent-changed", onConsent);
        initRumTelemetry();
      }
    };
    window.addEventListener("majalis-consent-changed", onConsent);
    return;
  }
  started = true;

  const onReport: MetricHandler = (metric) => {
    void postRum(metric);
  };

  cleanups.push(observeLcp(onReport));
  cleanups.push(observeCls(onReport));
  cleanups.push(observeInp(onReport));
  observeTtfb(onReport);
}

export function stopRumTelemetry(): void {
  for (const c of cleanups) c();
  cleanups.length = 0;
  started = false;
}
