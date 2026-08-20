/**
 * مصدر واحد لخريطة التنقّل — مشتق من سجل الأقسام.
 * الشريط السفلي: مركز القرآن · الدروس · الصلاة · فقه · الأقسام
 */
import type { LucideIcon } from "lucide-react";
import { navFor } from "@/config/navigation";
import {
  SERVICES_CENTER_GROUPS,
  filterServicesCenterGroups,
  type ServicesCenterGroup,
  type ServicesCenterItem,
} from "@/lib/services-center-nav";

export type BottomNavTab = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

/** الشريط السفلي من مصدر التنقّل الموحّد */
export const BOTTOM_NAV_TABS: BottomNavTab[] = navFor("bottom").map((s) => ({
  href: s.href,
  label: s.label,
  Icon: s.icon,
}));

export const NAV_SERVICE_GROUPS: ServicesCenterGroup[] = SERVICES_CENTER_GROUPS;

export { filterServicesCenterGroups };
export type { ServicesCenterGroup, ServicesCenterItem };

export function getAboutFooterLinks(): Array<{ href: string; label: string }> {
  const about = SERVICES_CENTER_GROUPS.find((g) => g.id === "settings" || g.id === "about");
  if (!about) return [];
  const aboutHrefs = new Set([
    "/about-us",
    "/about",
    "/methodology",
    "/sources",
    "/fatwa-policy",
    "/privacy",
    "/privacy-center",
    "/terms",
    "/support",
    "/contact",
  ]);
  return about.items
    .filter((i) => i.action.kind === "link" && aboutHrefs.has(i.action.href))
    .map((i) => ({
      href: (i.action as { kind: "link"; href: string }).href,
      label: i.label,
    }));
}

export function getSidebarGroupsFromNavMap(): Array<{
  id: string;
  title: string;
  items: Array<{ href: string; label: string; Icon: LucideIcon }>;
}> {
  return SERVICES_CENTER_GROUPS.map((g) => ({
    id: g.id,
    title: g.title,
    items: g.items
      .filter((i): i is ServicesCenterItem & { action: { kind: "link"; href: string } } => i.action.kind === "link")
      .map((i) => ({ href: i.action.href, label: i.label, Icon: i.Icon })),
  })).filter((g) => g.items.length > 0);
}
