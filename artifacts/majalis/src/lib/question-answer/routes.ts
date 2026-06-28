/** Public routes for سؤال وجواب (UI). Internal APIs/tables keep sin_jeem names. */

export const QA_BASE = "/question-answer";

export const QA_ROUTES = {
  home: QA_BASE,
  setup: (mode: string) => `${QA_BASE}/setup/${mode}`,
  play: `${QA_BASE}/play`,
  results: `${QA_BASE}/results`,
  leaderboard: `${QA_BASE}/leaderboard`,
  tournament: `${QA_BASE}/tournament`,
  admin: "/admin/question-answer",
} as const;

export const QA_DISPLAY_NAME = "سؤال وجواب";

/** Legacy paths that must redirect (never show old branding). */
export const QA_LEGACY_PREFIX = "/sin-jeem";

export function mapLegacyGamePath(pathname: string): string | null {
  if (!pathname.startsWith(QA_LEGACY_PREFIX)) return null;
  const rest = pathname.slice(QA_LEGACY_PREFIX.length);
  return `${QA_BASE}${rest || ""}`;
}

export function mapLegacyAdminPath(pathname: string): string | null {
  if (pathname === "/admin/sin-jeem" || pathname.startsWith("/admin/sin-jeem/")) {
    return pathname.replace("/admin/sin-jeem", QA_ROUTES.admin);
  }
  return null;
}
