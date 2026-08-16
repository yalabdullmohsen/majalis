/**
 * توافق خلفي — أبواب «المزيد» تُشتق بالكامل من سجل الأقسام SSOT.
 * لا استيراد أيقونات lucide هنا؛ الأيقونة من section.icon في السجل.
 */
import type { LucideIcon } from "lucide-react";
import {
  featuredSections,
  getSectionById,
  SECTION_GROUP_META,
  SECTION_GROUP_ORDER,
  sectionsByGroup,
  type SectionDef,
  type SectionGroup,
} from "@/config/sections.registry";

export type MoreSectionTier = "featured" | "standard";

/** معرّفات توافق قديمة — المجموعات الفعلية من SECTION_GROUP_ORDER */
export type MoreSectionGroupId = SectionGroup | "primary" | "secondary";

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

function toMore(s: SectionDef, tier: MoreSectionTier): MoreSection {
  return {
    id: s.id,
    title: s.label,
    subtitle: s.subtitle,
    icon: s.icon,
    route: s.route,
    tier,
    order: s.order,
    group: s.group,
    keywords: [...s.keywords, ...(s.aliases ?? [])],
  };
}

/** عناوين المجموعات السبعة بالترتيب المعتمد */
export const MORE_IA_GROUP_TITLES = SECTION_GROUP_ORDER.map((g) => SECTION_GROUP_META[g].label);

export const MORE_SECTION_GROUPS = SECTION_GROUP_ORDER.map((id) => ({
  id: id as MoreSectionGroupId,
  title: SECTION_GROUP_META[id].label,
}));

/** الأبواب المميّزة (٦) من السجل */
export const MORE_FEATURED_SECTIONS: MoreSection[] = featuredSections().map((s) =>
  toMore(s, "featured"),
);

/** بقية أقسام المزيد (غير المميّزة، غير الحساب) */
export const MORE_STANDARD_SECTIONS: MoreSection[] = SECTION_GROUP_ORDER.filter(
  (g) => g !== "account",
)
  .flatMap((g) => sectionsByGroup(g, "moreHub").filter((s) => !s.featured))
  .map((s) => toMore(s, "standard"));

/** مجموعة الحساب والإعدادات */
export const MORE_ACCOUNT_SECTIONS: MoreSection[] = sectionsByGroup("account", "moreHub").map((s) =>
  toMore(s, "standard"),
);

export function moreSectionsInGroup(group: MoreSectionGroupId): MoreSection[] {
  if (group === "primary") return MORE_FEATURED_SECTIONS;
  if (group === "secondary") return [...MORE_STANDARD_SECTIONS, ...MORE_ACCOUNT_SECTIONS];
  if (SECTION_GROUP_ORDER.includes(group as SectionGroup)) {
    return sectionsByGroup(group as SectionGroup, "moreHub").map((s) =>
      toMore(s, s.featured ? "featured" : "standard"),
    );
  }
  return [];
}

export const MORE_FEATURED_TITLES = MORE_FEATURED_SECTIONS.map((s) => s.title);
export const MORE_FEATURED_ROUTES = MORE_FEATURED_SECTIONS.map((s) => s.route);

/** أيقونة علوم القرآن من السجل (توافق اختبارات قديمة) */
export const MORE_QURAN_ULUM_ICON: LucideIcon =
  getSectionById("quran-sciences")?.icon ??
  getSectionById("quran")?.icon ??
  MORE_FEATURED_SECTIONS[0]!.icon;
