/**
 * تسميات التنقّل المشتقّة من seo-routes.json — المرجع الوحيد لاسم المسار.
 * إن تجاوز عنوان SEO 25 حرفاً يُستثنى اسم التنقّل الحالي (انظر docs/content-fix-report.md).
 * مسارات المرساة (#) لا ترث عنوان الأب — يبقى fallback كما هو.
 */
import seoRoutes from "./seo-routes.json";

const byPath: Record<string, string> = {};
for (const r of seoRoutes.routes) {
  const p = r.path.replace(/\/$/, "") || "/";
  const core = r.title.split(/\s*[—\-–|]\s*/)[0].trim();
  byPath[p] = core;
}

/** استثناءات صريحة: عنوان SEO أطول من 25 حرفاً — اسم التنقّل المعتمد */
export const SEO_NAV_EXCEPTIONS: Record<string, string> = {
  "/fiqh-council": "المجمع الفقهي",
  "/knowledge-graph": "استكشف المعرفة",
};

export function seoNavLabel(path: string, fallback: string): string {
  if (path.includes("#")) return fallback;

  const normalized = path.split("?")[0].replace(/\/$/, "") || "/";
  if (SEO_NAV_EXCEPTIONS[normalized]) return SEO_NAV_EXCEPTIONS[normalized];
  const core = byPath[normalized];
  if (!core) return fallback;
  if (core.length > 25) return fallback;
  return core;
}

export const SEO_NAV_LABELS = byPath;
