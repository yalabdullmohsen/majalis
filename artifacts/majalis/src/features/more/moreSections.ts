/**
 * مصدر واحد لأبواب «المزيد» — مجموعات بلا تكرار مع الشريط السفلي.
 */
import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
  BookOpen,
  CreditCard,
  Heart,
  Landmark,
  Library,
  Moon,
  ScrollText,
  Search,
  Settings,
  Star,
  Users,
} from "lucide-react";
import { featuredSections, SECTION_GROUP_ORDER, SECTION_GROUP_META } from "@/config/sections.registry";

export type MoreSectionTier = "featured" | "standard";

export type MoreSectionGroupId = "primary" | "secondary";

export type MoreSection = {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  route: string;
  tier: MoreSectionTier;
  order: number;
  group: MoreSectionGroupId;
  badge?: string;
  keywords?: string[];
  action?: "search";
};

export const MORE_SECTION_GROUPS: { id: MoreSectionGroupId; title: string }[] = [
  { id: "primary", title: "الأقسام الأساسية" },
  { id: "secondary", title: "أدوات مساعدة" },
];

/** الأقسام الأساسية داخل المزيد */
export const MORE_FEATURED_SECTIONS: MoreSection[] = featuredSections().map((s) => ({
  id: s.id,
  title: s.label,
  subtitle: s.subtitle,
  icon: s.icon,
  route: s.route,
  tier: "featured" as const,
  order: s.order,
  group: "primary" as const,
  keywords: [...s.keywords, ...(s.aliases ?? [])],
}));

export const MORE_IA_GROUP_TITLES = SECTION_GROUP_ORDER.map((g) => SECTION_GROUP_META[g].label);


/** قسم ثانوي أسفل الصفحة */
export const MORE_STANDARD_SECTIONS: MoreSection[] = [
  {
    id: "duas",
    title: "الأدعية",
    subtitle: "أدعية مأثورة",
    icon: Heart,
    route: "/duas",
    tier: "standard",
    order: 20,
    group: "secondary",
    keywords: ["أدعية", "دعاء"],
  },
  {
    id: "adhkar",
    title: "الأذكار",
    subtitle: "أذكار اليوم والليل",
    icon: BookMarked,
    route: "/adhkar",
    tier: "standard",
    order: 21,
    group: "secondary",
    keywords: ["أذكار"],
  },
  {
    id: "glossary",
    title: "المصطلحات",
    subtitle: "أداة مساعدة للبحث",
    icon: BookMarked,
    route: "/islamic-glossary",
    tier: "standard",
    order: 22,
    group: "secondary",
    keywords: ["معجم", "مصطلحات"],
  },
  {
    id: "topics",
    title: "الموضوعات",
    subtitle: "فهرس موضوعات",
    icon: BookOpen,
    route: "/topics",
    tier: "standard",
    order: 23,
    group: "secondary",
    keywords: ["مواضيع"],
  },
  {
    id: "favorites",
    title: "المفضلة",
    subtitle: "اقتباساتك المحفوظة",
    icon: Heart,
    route: "/my-citations",
    tier: "standard",
    order: 24,
    group: "secondary",
    keywords: ["مفضلة", "محفوظات"],
  },
];

export const MORE_ACCOUNT_SECTIONS: MoreSection[] = [
  {
    id: "account",
    title: "حسابي",
    icon: Users,
    route: "/my-learning",
    tier: "standard",
    order: 90,
    group: "secondary",
  },
];

export function moreSectionsInGroup(group: MoreSectionGroupId): MoreSection[] {
  return MORE_FEATURED_SECTIONS.filter((s) => s.group === group).sort((a, b) => a.order - b.order);
}

export const MORE_FEATURED_TITLES = MORE_FEATURED_SECTIONS.map((s) => s.title);
export const MORE_FEATURED_ROUTES = MORE_FEATURED_SECTIONS.map((s) => s.route);
export const MORE_QURAN_ULUM_ICON = BookMarked;
