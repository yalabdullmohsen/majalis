/**
 * القائمة الجانبية — حساب وإعدادات + مدخل واحد لصفحة الأقسام.
 * أقسام المحتوى تُفتح من `/sections` فقط (لا تكرار).
 */
import type { LucideIcon } from "lucide-react";
import {
  SECTION_GROUP_META,
  sectionsForSurface,
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
  id: string;
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

const drawerSections = sectionsForSurface("drawer");

export const SIDEBAR_NAV_GROUPS: SidebarNavGroup[] = [
  {
    id: "browse",
    title: "",
    items: filterNavItems(drawerSections.filter((s) => s.id === "sections").map(toItem)),
  },
  {
    id: "account",
    title: SECTION_GROUP_META.account.label,
    items: filterNavItems(drawerSections.filter((s) => s.id !== "sections").map(toItem)),
  },
].filter((group) => group.items.length > 0);

export const MORE_SHEET_ITEMS: SidebarNavItem[] = filterNavItems(
  sectionsForSurface("moreHub").slice(0, 8).map(toItem),
);

export const SIDEBAR_FLAT_HREFS: string[] = SIDEBAR_NAV_GROUPS.flatMap((g) =>
  g.items.map((i) => i.href),
);
