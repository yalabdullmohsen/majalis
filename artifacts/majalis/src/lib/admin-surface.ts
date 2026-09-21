/**
 * Admin surface guard — أدوات الإدارة لا تُعرض خارج `/admin`.
 * حتى حساب المشرف على صفحة عامة لا يرى FABs/تحريرًا فوق المحتوى.
 */
export function isAdminPath(pathname: string): boolean {
  if (!pathname) return false;
  const path = pathname.split("?")[0] || "";
  return path === "/admin" || path.startsWith("/admin/");
}

/** معاينة إدارية صريحة داخل لوحة التحكم فقط */
export function isAdminSurfaceAllowed(pathname: string, isAdmin: boolean): boolean {
  return Boolean(isAdmin) && isAdminPath(pathname);
}
