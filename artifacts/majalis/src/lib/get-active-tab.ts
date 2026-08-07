/**
 * مصدر واحد لزر الشريط السفلي النشط — معرّف واحد دائماً.
 */
import { isTabActive } from "@/components/TopSectionBar";
import { BOTTOM_NAV_TABS } from "@/lib/nav-map";

export type BottomTabId = "quran" | "lessons" | "prayer" | "fiqh" | "more";

const TAB_IDS: { id: BottomTabId; href: string }[] = [
  { id: "quran", href: "/quran-knowledge" },
  { id: "lessons", href: "/lessons" },
  { id: "prayer", href: "/prayer-times" },
  { id: "fiqh", href: "/fiqh" },
];

/**
 * يُرجع تبويباً واحداً فقط.
 * الجذر "/" → more (لا تبويب رئيسية في الشريط الحالي).
 * عند تطابق أكثر من قسم: الأطول href فوزاً (أدق مسار).
 */
export function getActiveTab(pathname: string): BottomTabId {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  if (path === "/") return "more";

  const hits = TAB_IDS.filter(({ href }) => isTabActive(path, href));
  if (hits.length === 0) return "more";
  if (hits.length === 1) return hits[0].id;

  hits.sort((a, b) => b.href.length - a.href.length);
  return hits[0].id;
}

/** للاختبارات والبوابات: عدد الأزرار التي كانت ستُضاء قبل التوحيد */
export function countActiveBottomTabs(pathname: string): number {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  const primary = BOTTOM_NAV_TABS.filter(({ href }) => isTabActive(path, href)).length;
  return primary === 0 ? 1 : primary;
}

export function bottomTabHref(id: BottomTabId): string | null {
  return TAB_IDS.find((t) => t.id === id)?.href ?? null;
}
