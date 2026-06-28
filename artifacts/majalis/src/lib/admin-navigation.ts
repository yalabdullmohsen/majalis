import type { AdminSection } from "@/views/admin/AdminShell";

/** URL slug ↔ internal section key (path-based admin navigation). */
export const ADMIN_SECTION_PATHS: Record<AdminSection, string> = {
  dashboard: "",
  "smart-cms": "cms",
  aggregator: "collector",
  "knowledge-engine": "ake",
  "scholarly-verification": "scientific-verification",
  "verified-knowledge": "knowledge",
  "knowledge-reasoning": "reasoning",
  "search-analytics": "search-analysis",
  "digital-learning": "digital-learning",
  "autonomous-ai": "autonomous-system",
  "global-reference": "global-reference",
  "islamic-intelligence": "islamic-intelligence",
  "open-platform": "open-platform",
  governance: "governance",
  lessons: "lessons",
  sheikhs: "sheikhs",
  library: "library",
  miracles: "miracles",
  adhkar: "adhkar",
  fawaid: "fawaid",
  qa: "qa",
  condolences: "condolences",
  users: "users",
  settings: "settings",
  reports: "reports",
  "fiqh-council": "fiqh-council",
  fatwa: "fatwa",
  rulings: "rulings",
  "annual-courses": "annual-courses",
  "sin-jeem": "sin-jeem",
  updates: "updates",
};

const PATH_TO_SECTION = Object.fromEntries(
  Object.entries(ADMIN_SECTION_PATHS).map(([section, slug]) => [slug || "dashboard", section as AdminSection]),
) as Record<string, AdminSection>;

/** Legacy ?section= query values (same as keys). */
const LEGACY_QUERY_ALIASES: Record<string, AdminSection> = {
  ...PATH_TO_SECTION,
  dashboard: "dashboard",
  "smart-cms": "smart-cms",
  aggregator: "aggregator",
  "knowledge-engine": "knowledge-engine",
  "scholarly-verification": "scholarly-verification",
  "verified-knowledge": "verified-knowledge",
  "knowledge-reasoning": "knowledge-reasoning",
  "search-analytics": "search-analytics",
  "autonomous-ai": "autonomous-ai",
};

export function adminSectionPath(section: AdminSection): string {
  const slug = ADMIN_SECTION_PATHS[section];
  if (!slug) return "/admin";
  return `/admin/${slug}`;
}

export function resolveAdminSectionFromPath(pathname: string): AdminSection | null {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  let path = pathname;
  if (base && path.startsWith(base)) path = path.slice(base.length) || "/";

  if (path === "/admin" || path === "/admin/") return "dashboard";

  const match = path.match(/^\/admin\/([^/?#]+)/);
  if (!match) return null;

  const slug = decodeURIComponent(match[1]);
  return PATH_TO_SECTION[slug] ?? null;
}

export function resolveLegacyAdminSection(search: string): AdminSection | null {
  if (!search) return null;
  const section = new URLSearchParams(search.startsWith("?") ? search : `?${search}`).get("section");
  if (!section) return null;
  return LEGACY_QUERY_ALIASES[section] ?? (section as AdminSection);
}

export function isKnownAdminSection(section: string): section is AdminSection {
  return section in ADMIN_SECTION_PATHS;
}

export const ADMIN_SECTION_SLUGS = Object.values(ADMIN_SECTION_PATHS).filter(Boolean);
