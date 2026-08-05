/**
 * القائمة الجانبية — مشتقة من مصدر التنقّل الموحّد (nav-map).
 */
import type { LucideIcon } from "lucide-react";
import { getSidebarGroupsFromNavMap } from "@/lib/nav-map";
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

export const SIDEBAR_NAV_GROUPS: SidebarNavGroup[] = getSidebarGroupsFromNavMap()
  .map((group) => ({
    ...group,
    items: filterNavItems(group.items),
  }))
  .filter((group) => group.items.length > 0);

/** عناصر مختصرة لقائمة المزيد القديمة — يُفضَّل MoreBottomSheet عبر services-center-nav */
export const MORE_SHEET_ITEMS: SidebarNavItem[] = SIDEBAR_NAV_GROUPS.flatMap((g) => g.items).slice(0, 8);

export const SIDEBAR_FLAT_HREFS: string[] = SIDEBAR_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
