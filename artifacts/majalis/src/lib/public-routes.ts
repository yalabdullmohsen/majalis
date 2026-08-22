/** مسارات الموقع الخارجي/التسويقي — لا تشمل الصفحة الرئيسية ولا الأقسام الداخلية. */
const PUBLIC_ROUTE_PREFIXES = [
  "/about",
  "/sources",
  "/methodology",
  "/fatwa-policy",
  "/sitemap",
  "/privacy",
  "/terms",
  "/account-deletion",
  "/support",
  "/discover-islam",
] as const;

export function isPublicRoute(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/") return false;
  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export { PUBLIC_ROUTE_PREFIXES };
