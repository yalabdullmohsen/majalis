/** مسارات داخلية — ليست صفحات SEO عامة */
export function isPrivateSeoPath(path: string): boolean {
  const p = String(path || "").split("?")[0].replace(/\/+$/, "") || "/";
  return /^\/(admin|dashboard|internal)(\/|$)/.test(p);
}

export const ADMIN_DEFAULT_TITLE = "لوحة الإدارة | سُنّة";
export const ADMIN_DEFAULT_DESCRIPTION =
  "صفحات داخلية لإدارة محتوى سُنّة ومراجعته، غير مخصصة للفهرسة العامة ولا تظهر في نتائج البحث.";
export const ADMIN_DEFAULT_ROBOTS = "noindex, nofollow";
