/**
 * مصدر واحد لزر الشريط السفلي النشط — معرّف واحد دائماً.
 */
import { isTabActive } from "@/components/TopSectionBar";
import { BOTTOM_NAV_TABS } from "@/lib/nav-map";

export type BottomTabId = "quran" | "lessons" | "prayer" | "fiqh" | "sections";

const TAB_IDS: { id: BottomTabId; href: string }[] = [
  { id: "quran", href: "/quran-hub" },
  { id: "lessons", href: "/lessons" },
  { id: "prayer", href: "/prayer-times" },
  { id: "fiqh", href: "/fiqh" },
  { id: "sections", href: "/sections" },
];

/**
 * يُرجع تبويباً واحداً فقط.
 * الجذر "/" → sections (لا تبويب رئيسية في الشريط).
 */
export function getActiveTab(pathname: string): BottomTabId {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  if (path === "/" || path === "/more") return "sections";
  if (path === "/sections" || path.startsWith("/sections/")) return "sections";
  // الشريط السفلي بلا تبويب أذكار/بحث — نربطهما بأقرب باب
  if (path === "/adhkar" || path.startsWith("/adhkar/")) return "prayer";
  if (path === "/search" || path.startsWith("/search/")) return "sections";

  const hits = TAB_IDS.filter(({ href }) => isTabActive(path, href));
  if (hits.length === 0) return "sections";
  if (hits.length === 1) return hits[0].id;

  hits.sort((a, b) => b.href.length - a.href.length);
  return hits[0].id;
}

export function countActiveBottomTabs(pathname: string): number {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  const primary = BOTTOM_NAV_TABS.filter(({ href }) => isTabActive(path, href)).length;
  return primary === 0 ? 1 : primary;
}

export function bottomTabHref(id: BottomTabId): string | null {
  return TAB_IDS.find((t) => t.id === id)?.href ?? null;
}
