/** مسارات داخلية — ليست صفحات SEO عامة */
export function isPrivateSeoPath(path: string): boolean {
  const p = String(path || "").split("?")[0].replace(/\/+$/, "") || "/";
  return /^\/(admin|dashboard|internal)(\/|$)/.test(p);
}

export const ADMIN_DEFAULT_TITLE = "لوحة الإدارة | المجلس العلمي";
export const ADMIN_DEFAULT_DESCRIPTION =
  "صفحات داخلية لإدارة محتوى المجلس العلمي ومراجعته، غير مخصصة للفهرسة العامة ولا تظهر في نتائج البحث.";
export const ADMIN_DEFAULT_ROBOTS = "noindex, nofollow";
