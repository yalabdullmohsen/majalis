/**
 * مسارات deep link المسموحة داخل سُنّة فقط.
 */

const ALLOWED_PREFIXES = [
  "/lesson/",
  "/lessons/",
  "/series/",
  "/path/",
  "/paths/",
  "/course/",
  "/courses/",
  "/world/",
  "/worlds/",
  "/category/",
  "/categories/",
  "/mushaf",
  "/quran",
  "/adhkar",
  "/adhan",
  "/prayer",
  "/settings",
  "/notification-settings",
  "/account",
  "/updates",
  "/home",
  "/",
] as const;

export function sanitizeSunnahDeepLink(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw || raw.length > 512) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !raw.startsWith("sunnah:")) {
    return null;
  }
  let path = raw;
  if (raw.startsWith("sunnah://")) {
    path = raw.slice("sunnah://".length);
    if (!path.startsWith("/")) path = `/${path}`;
  }
  if (!path.startsWith("/")) return null;
  if (path.includes("..") || path.includes("//")) return null;
  if (/[\s<>"']/.test(path)) return null;

  const ok = ALLOWED_PREFIXES.some((prefix) => {
    if (prefix === "/") return path === "/";
    return path === prefix || path.startsWith(prefix);
  });
  return ok ? path : null;
}

export function isAllowedSunnahDeepLink(input: unknown): boolean {
  return sanitizeSunnahDeepLink(input) != null;
}
