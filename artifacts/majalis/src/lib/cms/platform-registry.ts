import type { AdminSection } from "@/views/admin/AdminShell";
import { adminSectionPath } from "@/lib/admin-navigation";
import type { CmsContentKind } from "./content-types";
import { CMS_KIND_LABELS } from "./content-types";

/** Logical platform section — maps user-facing content areas to admin, import, automation, and contributions. */
export type PlatformSectionId =
  | "lessons"
  | "sheikhs"
  | "circles"
  | "research"
  | "books"
  | "texts"
  | "courses"
  | "fawaid"
  | "fatwa"
  | "stories"
  | "mosques"
  | "opportunities"
  | "qa"
  | "radio"
  | "library";

export type PlatformInputChannel = "manual" | "bulk_import" | "automation" | "user_contribution";

export type PlatformSectionConfig = {
  id: PlatformSectionId;
  label: string;
  cmsKind?: CmsContentKind;
  adminSection: AdminSection;
  importType?: string;
  table?: string;
  channels: PlatformInputChannel[];
  automationCronPaths?: string[];
  contributionTypes?: string[];
  supportsRevisionLog: boolean;
  supportsClone: boolean;
};

export const PLATFORM_SECTIONS: PlatformSectionConfig[] = [
  {
    id: "lessons",
    label: "الدروس",
    cmsKind: "lesson",
    adminSection: "lessons",
    importType: "lessons",
    table: "lessons",
    channels: ["manual", "bulk_import", "automation", "user_contribution"],
    automationCronPaths: ["/api/cron/sync-data", "/api/cron/process-import-jobs"],
    contributionTypes: ["lesson"],
    supportsRevisionLog: true,
    supportsClone: true,
  },
  {
    id: "sheikhs",
    label: "المشايخ",
    cmsKind: "sheikh",
    adminSection: "sheikhs",
    importType: "sheikhs",
    table: "sheikhs",
    channels: ["manual", "bulk_import", "automation"],
    automationCronPaths: ["/api/cron/sync-data"],
    supportsRevisionLog: true,
    supportsClone: true,
  },
  {
    id: "circles",
    label: "الحلقات",
    cmsKind: "annual_course",
    adminSection: "quran-scientific-circles",
    importType: "courses",
    table: "quran_scientific_circles",
    channels: ["manual", "bulk_import", "automation", "user_contribution"],
    contributionTypes: ["circle_announcement"],
    supportsRevisionLog: true,
    supportsClone: true,
  },
  {
    id: "research",
    label: "الأبحاث العلمية",
    adminSection: "scientific-research",
    importType: "articles",
    table: "scientific_research_items",
    channels: ["manual", "bulk_import", "user_contribution"],
    contributionTypes: ["research"],
    supportsRevisionLog: true,
    supportsClone: false,
  },
  {
    id: "books",
    label: "الكتب",
    cmsKind: "book",
    adminSection: "library",
    importType: "books",
    table: "library_items",
    channels: ["manual", "bulk_import", "automation", "user_contribution"],
    automationCronPaths: ["/api/cron/content-engines"],
    contributionTypes: ["book"],
    supportsRevisionLog: true,
    supportsClone: true,
  },
  {
    id: "texts",
    label: "المتون",
    cmsKind: "article",
    adminSection: "quran-scientific-circles",
    importType: "articles",
    table: "quran_scientific_circles",
    channels: ["manual", "bulk_import", "automation", "user_contribution"],
    contributionTypes: ["text"],
    supportsRevisionLog: true,
    supportsClone: true,
  },
  {
    id: "courses",
    label: "الدورات",
    cmsKind: "course",
    adminSection: "annual-courses",
    importType: "courses",
    table: "lessons",
    channels: ["manual", "bulk_import", "automation", "user_contribution"],
    automationCronPaths: ["/api/cron/sync-data"],
    contributionTypes: ["course_announcement"],
    supportsRevisionLog: true,
    supportsClone: true,
  },
  {
    id: "fawaid",
    label: "الفوائد",
    cmsKind: "fawaid",
    adminSection: "fawaid",
    importType: "benefits",
    table: "fawaid",
    channels: ["manual", "bulk_import", "automation", "user_contribution"],
    automationCronPaths: ["/api/cron/content-engines"],
    contributionTypes: ["fawaid"],
    supportsRevisionLog: true,
    supportsClone: true,
  },
  {
    id: "fatwa",
    label: "الفتاوى",
    cmsKind: "fatwa",
    adminSection: "fatwa",
    importType: "rulings",
    table: "fatwas",
    channels: ["manual", "bulk_import"],
    supportsRevisionLog: true,
    supportsClone: true,
  },
  {
    id: "stories",
    label: "القصص",
    cmsKind: "miracle",
    adminSection: "miracles",
    importType: "stories",
    table: "akp_stories",
    channels: ["manual", "bulk_import", "automation"],
    automationCronPaths: ["/api/cron/content-engines"],
    supportsRevisionLog: true,
    supportsClone: true,
  },
  {
    id: "mosques",
    label: "المساجد",
    adminSection: "lessons",
    importType: "lessons",
    table: "lessons",
    channels: ["manual", "bulk_import", "automation"],
    automationCronPaths: ["/api/cron/sync-data"],
    supportsRevisionLog: false,
    supportsClone: false,
  },
  {
    id: "opportunities",
    label: "الفرص العلمية",
    adminSection: "updates",
    importType: "articles",
    table: "platform_updates",
    channels: ["manual", "bulk_import", "automation", "user_contribution"],
    automationCronPaths: ["/api/cron/content-engines"],
    contributionTypes: ["opportunity"],
    supportsRevisionLog: true,
    supportsClone: true,
  },
  {
    id: "qa",
    label: "سؤال وجواب",
    cmsKind: "qa",
    adminSection: "question-answer",
    importType: "questions",
    table: "qa_questions",
    channels: ["manual", "bulk_import", "automation", "user_contribution"],
    automationCronPaths: ["/api/cron/question-answer-daily"],
    contributionTypes: ["question_suggestion"],
    supportsRevisionLog: true,
    supportsClone: true,
  },
  {
    id: "radio",
    label: "الإذاعة",
    adminSection: "settings",
    channels: ["manual"],
    supportsRevisionLog: false,
    supportsClone: false,
  },
  {
    id: "library",
    label: "المكتبة",
    cmsKind: "book",
    adminSection: "library",
    importType: "books",
    table: "library_items",
    channels: ["manual", "bulk_import", "automation"],
    automationCronPaths: ["/api/cron/content-engines"],
    supportsRevisionLog: true,
    supportsClone: true,
  },
];

export const PLATFORM_SECTION_MAP = Object.fromEntries(
  PLATFORM_SECTIONS.map((s) => [s.id, s]),
) as Record<PlatformSectionId, PlatformSectionConfig>;

export function getPlatformSection(id: PlatformSectionId): PlatformSectionConfig {
  return PLATFORM_SECTION_MAP[id];
}

export function sectionsForChannel(channel: PlatformInputChannel): PlatformSectionConfig[] {
  return PLATFORM_SECTIONS.filter((s) => s.channels.includes(channel));
}

export function adminUrlForSection(id: PlatformSectionId): string {
  return adminSectionPath(PLATFORM_SECTION_MAP[id].adminSection);
}

export function importTypesSupported(): string[] {
  return [...new Set(PLATFORM_SECTIONS.map((s) => s.importType).filter(Boolean))] as string[];
}

export function contributionTypesSupported(): string[] {
  return [...new Set(PLATFORM_SECTIONS.flatMap((s) => s.contributionTypes || []))];
}

export function automationCronCount(): number {
  const paths = new Set(PLATFORM_SECTIONS.flatMap((s) => s.automationCronPaths || []));
  return paths.size;
}

export function platformSectionLabel(id: PlatformSectionId): string {
  const section = PLATFORM_SECTION_MAP[id];
  if (section.cmsKind) return CMS_KIND_LABELS[section.cmsKind] || section.label;
  return section.label;
}

/** Map bulk-import type string to platform section. */
export function sectionFromImportType(importType: string): PlatformSectionConfig | undefined {
  return PLATFORM_SECTIONS.find((s) => s.importType === importType);
}
