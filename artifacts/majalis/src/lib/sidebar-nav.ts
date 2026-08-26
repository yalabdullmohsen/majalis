/**
 * القائمة الجانبية — مجموعات بعناوين وألوان مميزة + صفوف الحساب من السجل.
 */
import type { LucideIcon } from "lucide-react";
import { navFor } from "@/config/navigation";
import {
  SECTION_GROUP_ACCENT,
  SECTION_GROUP_META,
  getSectionById,
  resolveSectionAccent,
  sectionsForSurface,
} from "@/config/sections.registry";
import { filterNavItems } from "@/lib/nav-visibility";

export type SidebarNavItem = {
  href: string;
  label: string;
  description?: string;
  Icon: LucideIcon;
  /** لون أيقونة الصف — يميّز القسم عن جيرانه */
  accent: string;
};

export type SidebarNavGroup = {
  id: string;
  title: string;
  /** لون عنوان المجموعة والحد الفاصل */
  accent: string;
  items: SidebarNavItem[];
};

/** مجموعات الدرج المنطقية — ترتيب وفاصل بصري واضح */
const DRAWER_BROWSE_GROUPS: ReadonlyArray<{
  id: string;
  title: string;
  accent: string;
  /** معرّفات NavEntry (mushaf ← open-mushaf) */
  navIds: readonly string[];
}> = [
  {
    id: "quran",
    title: "القرآن والتلاوة",
    accent: "#2A7A6E",
    navIds: ["mushaf", "quran-recitation", "quran"],
  },
  {
    id: "sciences",
    title: "العلوم والأقسام",
    accent: "#1F7A5A",
    navIds: ["lessons", "fiqh", "fawaid", "miracles", "qa", "sections"],
  },
  {
    id: "worship",
    title: "العبادة والأدوات",
    accent: "#3D5A80",
    navIds: ["prayer", "adhkar", "qibla", "tasbih"],
  },
];

function sectionIdFromNavId(navId: string): string {
  return navId === "mushaf" ? "open-mushaf" : navId;
}

function accentForNavId(navId: string, groupAccent: string): string {
  const section = getSectionById(sectionIdFromNavId(navId));
  if (!section) return groupAccent;
  return resolveSectionAccent(section);
}

const drawerEntries = navFor("drawer");
const entryById = new Map(drawerEntries.map((e) => [e.id, e]));

const browseGroups: SidebarNavGroup[] = DRAWER_BROWSE_GROUPS.map((def) => {
  const items: SidebarNavItem[] = [];
  for (const navId of def.navIds) {
    const e = entryById.get(navId);
    if (!e) continue;
    items.push({
      href: e.href,
      label: e.label,
      Icon: e.icon,
      accent: accentForNavId(navId, def.accent),
    });
  }
  return {
    id: def.id,
    title: def.title,
    accent: def.accent,
    items: filterNavItems(items),
  };
}).filter((g) => g.items.length > 0);

const browseHrefs = new Set(browseGroups.flatMap((g) => g.items.map((i) => i.href)));

const accountItems: SidebarNavItem[] = sectionsForSurface("drawer")
  .filter((s) => s.id !== "sections" && !browseHrefs.has(s.route))
  .map((s) => ({
    href: s.route,
    label: s.label,
    description: s.subtitle,
    Icon: s.icon,
    accent: resolveSectionAccent(s),
  }));

export const SIDEBAR_NAV_GROUPS: SidebarNavGroup[] = [
  ...browseGroups,
  {
    id: "account",
    title: SECTION_GROUP_META.account.label,
    accent: SECTION_GROUP_ACCENT.account,
    items: filterNavItems(accountItems),
  },
].filter((group) => group.items.length > 0);

export const MORE_SHEET_ITEMS: SidebarNavItem[] = filterNavItems(
  sectionsForSurface("moreHub").slice(0, 8).map((s) => ({
    href: s.route,
    label: s.label,
    description: s.subtitle,
    Icon: s.icon,
    accent: resolveSectionAccent(s),
  })),
);

export const SIDEBAR_FLAT_HREFS: string[] = SIDEBAR_NAV_GROUPS.flatMap((g) =>
  g.items.map((i) => i.href),
);
