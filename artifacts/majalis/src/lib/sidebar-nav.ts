/**
 * القائمة الجانبية — مشتقة من سجل الأقسام SSOT (نفس ترتيب المزيد).
 */
import type { LucideIcon } from "lucide-react";
import {
  SECTION_GROUP_META,
  SECTION_GROUP_ORDER,
  featuredSections,
  sectionsByGroup,
} from "@/config/sections.registry";
import { filterNavItems } from "@/lib/nav-visibility";

export type SidebarNavItem = {
  href: string;
  label: string;
  description?: string;
  Icon: LucideIcon;
};

export type SidebarNavGroup = {
  id: string;
  title: string;
  items: SidebarNavItem[];
};

function toItem(s: {
  route: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
}): SidebarNavItem {
  return {
    href: s.route,
    label: s.label,
    description: s.subtitle,
    Icon: s.icon,
  };
}

export const SIDEBAR_NAV_GROUPS: SidebarNavGroup[] = [
  {
    id: "featured",
    title: "الأبواب المميّزة",
    items: filterNavItems(featuredSections().map(toItem)),
  },
  ...SECTION_GROUP_ORDER.map((group) => ({
    id: group,
    title: SECTION_GROUP_META[group].label,
    items: filterNavItems(
      sectionsByGroup(group, "drawer")
        .filter((s) => !s.featured)
        .map(toItem),
    ),
  })),
].filter((group) => group.items.length > 0);

export const MORE_SHEET_ITEMS: SidebarNavItem[] = SIDEBAR_NAV_GROUPS.flatMap((g) => g.items).slice(0, 8);

export const SIDEBAR_FLAT_HREFS: string[] = SIDEBAR_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
