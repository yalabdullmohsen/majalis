/**
 * Prefetch خفيف لروابط الكيانات المرتبطة — يعمل على الويب وPWA وWebView iOS.
 * يستخدم <link rel="prefetch"> عند الدعم، مع تخزين لتجنب التكرار.
 */

const prefetched = new Set<string>();

function supportsPrefetch(): boolean {
  if (typeof document === "undefined") return false;
  const link = document.createElement("link");
  return link.relList?.supports?.("prefetch") ?? true;
}

export function prefetchHref(href: string): void {
  if (typeof document === "undefined") return;
  if (!href || href.startsWith("http") || href.startsWith("mailto:")) return;
  const clean = href.split("?")[0];
  if (prefetched.has(clean)) return;
  prefetched.add(clean);

  if (supportsPrefetch()) {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = clean;
    link.as = "document";
    document.head.appendChild(link);
  }

  // لمس مسار الـ SPA عبر hover يُدفئ الكاش — طلب HEAD خفيف عند الإمكان
  try {
    if (typeof fetch === "function") {
      void fetch(clean, { method: "GET", credentials: "same-origin", priority: "low" } as RequestInit).catch(
        () => undefined,
      );
    }
  } catch {
    /* ignore */
  }
}

export function prefetchMany(hrefs: string[], max = 8): void {
  for (const href of hrefs.slice(0, max)) prefetchHref(href);
}
