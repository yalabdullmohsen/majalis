/** مسارات يُخفى فيها الشريط المتحرك أو يُختصر (قراءة/بحث/حساب). */
const QUIET_EXACT = new Set([
  "/mushaf",
  "/search",
  "/library",
  "/quiz",
  "/profile",
  "/settings",
]);

const QUIET_PREFIXES = ["/mushaf/", "/search/", "/library/", "/profile/", "/settings/"];

export function isTickerQuietPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (QUIET_EXACT.has(p)) return true;
  return QUIET_PREFIXES.some((pre) => p.startsWith(pre));
}
