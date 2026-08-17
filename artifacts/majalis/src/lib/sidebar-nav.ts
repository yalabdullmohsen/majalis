/**
 * القائمة الجانبية — من `config/navigation` + صفوف الحساب من السجل.
 */
import type { LucideIcon } from "lucide-react";
import { navFor } from "@/config/navigation";
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

const browseItems: SidebarNavItem[] = navFor("drawer").map((e) => ({
  href: e.href,
  label: e.label,
  Icon: e.icon,
}));

const browseHrefs = new Set(browseItems.map((i) => i.href));

const accountItems = sectionsForSurface("drawer")
  .filter((s) => s.id !== "sections" && !browseHrefs.has(s.route))
  .map((s) => ({
    href: s.route,
    label: s.label,
    description: s.subtitle,
    Icon: s.icon,
  }));

export const SIDEBAR_NAV_GROUPS: SidebarNavGroup[] = [
  {
    id: "browse",
    title: "",
    items: filterNavItems(browseItems),
  },
  {
    id: "account",
    title: SECTION_GROUP_META.account.label,
    items: filterNavItems(accountItems),
  },
].filter((group) => group.items.length > 0);

export const MORE_SHEET_ITEMS: SidebarNavItem[] = filterNavItems(
  sectionsForSurface("moreHub").slice(0, 8).map((s) => ({
    href: s.route,
    label: s.label,
    description: s.subtitle,
    Icon: s.icon,
  })),
);

export const SIDEBAR_FLAT_HREFS: string[] = SIDEBAR_NAV_GROUPS.flatMap((g) =>
  g.items.map((i) => i.href),
);
