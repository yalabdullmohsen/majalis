/**
 * تطابق مسار التنقّل النشط دون التباس البادئات
 * (مثل /hadith مقابل /hadith-science، و/fiqh مقابل /fiqh-council).
 */
export function isNavHrefActive(location: string, href: string): boolean {
  const path = (href.split("?")[0] || href) || "/";
  if (path === "/") return location === "/" || location === "";
  return (
    location === path ||
    location.startsWith(`${path}/`) ||
    location.startsWith(`${path}?`)
  );
}
