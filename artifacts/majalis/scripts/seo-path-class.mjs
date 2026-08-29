/**
 * تصنيف مسارات SEO: عامة مقابل داخلية (admin/dashboard/internal).
 * مصدر واحد لـ test-seo وبوابات الانحدار.
 */
export function isPrivateSeoPath(path) {
  const p = String(path || "").split("?")[0].replace(/\/+$/, "") || "/";
  return /^\/(admin|dashboard|internal)(\/|$)/.test(p);
}

export const ADMIN_DEFAULT_TITLE = "لوحة الإدارة";
export const ADMIN_DEFAULT_DESCRIPTION =
  "صفحات داخلية لإدارة محتوى سُنّة ومراجعته، غير مخصصة للفهرسة العامة ولا تظهر في نتائج البحث.";
export const ADMIN_DEFAULT_ROBOTS = "noindex, nofollow";

/** عتبة الوصف «قصير جداً» للصفحات العامة — تحتها P0 */
export const PUBLIC_DESC_MIN_P0 = 50;
/** هدف الجودة للوصف العام */
export const PUBLIC_DESC_SOFT_MIN = 80;
export const PUBLIC_DESC_SOFT_MAX = 160;
