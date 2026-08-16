/**
 * كتالوج مركز الخدمات — مشتق من سجل الأقسام SSOT.
 * الشيت الفعلي يستخدم MoreHubFromRegistry مباشرة.
 */
import type { LucideIcon } from "lucide-react";
import { LogOut, Share2, Star } from "lucide-react";
import { arabicMatchAny } from "@/lib/arabic-search";
import {
  SECTION_GROUP_META,
  SECTION_GROUP_ORDER,
  featuredSections,
  sectionsByGroup,
} from "@/config/sections.registry";

export type ServicesCenterAction =
  | { kind: "link"; href: string }
  | { kind: "search" }
  | { kind: "theme" }
  | { kind: "share" }
  | { kind: "rate" }
  | { kind: "logout" };

export type ServicesCenterItem = {
  id: string;
  label: string;
  subtitle?: string;
  keywords?: string[];
  Icon: LucideIcon;
  action: ServicesCenterAction;
};

export type ServicesCenterGroup = {
  id: string;
  title: string;
  layout?: "quick" | "list" | "featured";
  items: ServicesCenterItem[];
};

function linkItem(
  id: string,
  label: string,
  href: string,
  Icon: LucideIcon,
  opts?: { subtitle?: string; keywords?: string[] },
): ServicesCenterItem {
  return {
    id,
    label,
    subtitle: opts?.subtitle,
    keywords: opts?.keywords,
    Icon,
    action: { kind: "link", href },
  };
}

const FEATURED_HUB_ITEMS: ServicesCenterItem[] = featuredSections().map((s) =>
  linkItem(s.id, s.label, s.route, s.icon, {
    subtitle: s.subtitle,
    keywords: [...s.keywords, ...(s.aliases ?? [])],
  }),
);

export const SERVICES_CENTER_GROUPS: ServicesCenterGroup[] = [
  {
    id: "hubs",
    title: "الأبواب المميّزة",
    layout: "featured",
    items: FEATURED_HUB_ITEMS,
  },
  ...SECTION_GROUP_ORDER.map((group) => {
    const meta = SECTION_GROUP_META[group];
    const items = sectionsByGroup(group, "moreHub")
      .filter((s) => !s.featured)
      .map((s) =>
        linkItem(s.id, s.label, s.route, s.icon, {
          subtitle: s.subtitle,
          keywords: [...s.keywords, ...(s.aliases ?? [])],
        }),
      );
    return {
      id: group,
      title: meta.label,
      layout: (meta.rowStyle ? "list" : "quick") as "list" | "quick",
      items,
    };
  }),
  {
    id: "session",
    title: "الجلسة",
    layout: "list",
    items: [
      { id: "share", label: "مشاركة التطبيق", Icon: Share2, action: { kind: "share" } },
      { id: "rate", label: "تقييم التطبيق", Icon: Star, action: { kind: "rate" } },
      { id: "logout", label: "تسجيل الخروج", Icon: LogOut, action: { kind: "logout" } },
    ],
  },
];

export function filterServicesCenterGroups(query: string): ServicesCenterGroup[] {
  const q = query.trim();
  if (!q) return SERVICES_CENTER_GROUPS;
  return SERVICES_CENTER_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => {
      const hay = [item.label, item.subtitle ?? "", ...(item.keywords ?? [])];
      return arabicMatchAny(hay, q);
    }),
  })).filter((g) => g.items.length > 0);
}
