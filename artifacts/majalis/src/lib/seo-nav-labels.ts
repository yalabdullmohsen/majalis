/**
 * تسميات التنقّل المشتقّة من seo-routes.json — ملف نحيف (~10KB) بلا أوصاف/كلمات مفتاحية.
 * يُحدَّث عبر: node scripts/generate-seo-nav-labels.mjs
 */
import navData from "./seo-nav-labels.json";

const byPath = navData.labels as Record<string, string>;

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

/** بيانات موقع مشتركة بلا مصفوفة المسارات الضخمة */
export const SEO_SITE = {
  siteUrl: navData.siteUrl as string,
  siteName: navData.siteName as string,
  defaultImage: (navData.defaultImage as string) || "/brand/official-og.png?v=20260829",
  logoImage: (navData.logoImage as string) || "/brand/official.png?v=20260829",
  ogImageWidth: (navData.ogImageWidth as number) || 1200,
  ogImageHeight: (navData.ogImageHeight as number) || 630,
};
