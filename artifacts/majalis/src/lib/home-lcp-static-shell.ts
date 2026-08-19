/**
 * صدفة LCP ثابتة داخل #root — تُزال بعد رسم React بلا إزاحة.
 * PSI فحص 12: LCP = p.hsh-step__desc (~5.7ث تأخير رسم).
 */
const STATIC_SHELL_ID = "mj-home-lcp-static";

export function isHomeLcpStaticShellPresent(): boolean {
  return typeof document !== "undefined" && !!document.getElementById(STATIC_SHELL_ID);
}

/** يُستدعى من HomeLazyRoute بعد mount — يزيل الصدفة عند رسم .m2030-home الحقيقي. */
export function scheduleRemoveHomeLcpStaticShell(): void {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (path !== "/" && path !== "") return;

  const shell = document.getElementById(STATIC_SHELL_ID);
  if (!shell) return;

  let attempts = 0;
  const maxAttempts = 180;

  const tryRemove = () => {
    attempts += 1;
    const el = document.getElementById(STATIC_SHELL_ID);
    if (!el) return;

    const painted = document.querySelector("#main-content .m2030-home");
    if (!painted && attempts < maxAttempts) {
      requestAnimationFrame(tryRemove);
      return;
    }

    el.classList.add("mj-home-lcp-static--out");
    window.setTimeout(() => {
      el.remove();
    }, 280);
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(tryRemove);
  });
}

/** تشخيص PSI — يطبع مرشّح LCP في console (Safari Web Inspector). */
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
