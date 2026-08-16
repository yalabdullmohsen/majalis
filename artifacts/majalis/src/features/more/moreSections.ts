/**
 * توافق خلفي — أبواب «المزيد» تُشتق من سجل الأقسام SSOT.
 * لا تُضَف عناصر يدويًا هنا.
 */
import {
  SECTIONS,
  SECTION_GROUP_META,
  SECTION_GROUP_ORDER,
  featuredSections,
  sectionsByGroup,
  type SectionDef,
} from "@/config/sections.registry";
import type { LucideIcon } from "lucide-react";

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

function toMore(s: SectionDef, tier: MoreSectionTier, group: MoreSectionGroupId): MoreSection {
  return {
    id: s.id,
    title: s.label,
    subtitle: s.subtitle,
    icon: s.icon,
    route: s.route,
    tier,
    order: s.order,
    group,
    keywords: [...s.keywords, ...(s.aliases ?? [])],
  };
}

/** الأبواب المميّزة (٦) — tier: "featured" */
export const MORE_FEATURED_SECTIONS: MoreSection[] = featuredSections().map((s) =>
  toMore(s, "featured", "primary"),
);

/** بقية أقسام المزيد (غير الحساب) */
export const MORE_STANDARD_SECTIONS: MoreSection[] = SECTION_GROUP_ORDER.filter(
  (g) => g !== "account",
)
  .flatMap((g) => sectionsByGroup(g, "moreHub").filter((s) => !s.featured))
  .map((s) => toMore(s, "standard", "secondary"));

/** مجموعة الحساب والإعدادات */
export const MORE_ACCOUNT_SECTIONS: MoreSection[] = sectionsByGroup("account", "moreHub").map((s) =>
  toMore(s, "standard", "secondary"),
);

export const MORE_SECTION_GROUPS: { id: MoreSectionGroupId; title: string }[] = [
  { id: "primary", title: SECTION_GROUP_META.sciences.label },
  { id: "secondary", title: "بقية الأقسام" },
];

/** عناوين المجموعات السبعة المعتمدة */
export const MORE_IA_GROUP_TITLES = SECTION_GROUP_ORDER.map((g) => SECTION_GROUP_META[g].label);

export function moreSectionsInGroup(group: MoreSectionGroupId): MoreSection[] {
  if (group === "primary") return MORE_FEATURED_SECTIONS;
  return [...MORE_STANDARD_SECTIONS, ...MORE_ACCOUNT_SECTIONS];
}

/** كل أقسام المزيد الحية من السجل */
export function allMoreSectionsFromRegistry(): SectionDef[] {
  return SECTIONS.filter((s) => s.status !== "hidden" && s.surfaces.includes("moreHub") && s.order >= 0);
}
