/**
 * سياسة فهرسة SEO — مصدر واحد لـ generate-seo و check-seo-indexing.
 */

/** مسارات لا تدخل sitemap أبدًا (أدوات داخلية / حساب / بحث). */
export const SITEMAP_DENY_PATHS = new Set([
  "/login",
  "/register",
  "/profile",
  "/settings",
  "/search",
  "/assistant",
  "/dashboard",
  "/admin",
  "/api",
  "/adhan-settings",
  "/knowledge-graph",
  "/fiqh-council/live",
  "/fiqh-council/stats",
  "/fiqh-council/compare",
  "/fiqh-council/recommendations",
]);

/** أنماط مسار ممنوعة في sitemap (بادئة). */
export const SITEMAP_DENY_PREFIXES = [
  "/admin/",
  "/dashboard/",
  "/api/",
  "/auth/",
  "/internal/",
];

/** مسارات noindex افتراضيًا (لو لم تُحدَّد robots في seo-routes). */
export const NOINDEX_DEFAULT_PATHS = new Set([
  ...SITEMAP_DENY_PATHS,
  "/vault",
  "/notification-settings",
  "/car-mode",
]);

export function isSitemapDenied(path) {
  const p = String(path || "").replace(/\/$/, "") || "/";
  if (SITEMAP_DENY_PATHS.has(p)) return true;
  return SITEMAP_DENY_PREFIXES.some((pre) => p.startsWith(pre));
}

export function enforceSeoPolicy(route) {
  const path = String(route.path || "").replace(/\/$/, "") || "/";
  const next = { ...route };
  if (isSitemapDenied(path)) {
    next.sitemap = false;
    if (!next.robots || !String(next.robots).includes("noindex")) {
      next.robots = "noindex, follow";
    }
  }
  return next;
}
