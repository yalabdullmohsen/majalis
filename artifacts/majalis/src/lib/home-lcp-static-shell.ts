/**
 * تشخيص PSI — يطبع مرشّح LCP في console (Safari Web Inspector).
 * صدفة HTML الثابتة أُسقطت (A-4): كانت ترفع CLS 0.05+ بلا تحسين LCP.
 */
export function logLcpCandidateHint(): void {
  if (typeof window === "undefined" || import.meta.env.PROD) return;
  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as PerformanceEntry & {
        element?: Element;
        url?: string;
        renderTime?: number;
        loadTime?: number;
        startTime?: number;
      };
      if (!last) return;
      const el = last.element;
      const sel = el
        ? `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${el.className ? `.${String(el.className).trim().split(/\s+/).join(".")}` : ""}`
        : "?";
      console.info("[lcp] candidate", {
        selector: sel,
        startTime: last.startTime,
        renderTime: (last as { renderTime?: number }).renderTime,
        loadTime: (last as { loadTime?: number }).loadTime,
        size: (last as { size?: number }).size,
      });
    });
    po.observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    /* PerformanceObserver غير متاح */
  }
}
