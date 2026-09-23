/**
 * عقود بيانات مسار الحفظ — بلا نص شرعي مخزّن في الكتالوج.
 * القرآن عبر مرجع فقط إلى مصدر المشروع المعتمد.
 */

import type {
  HifzLicenseStatus,
  HifzPublicationStatus,
  HifzReviewStatus,
} from "./publication-states";

export const HIFZ_PATH_SCHEMA_VERSION = 1 as const;

export const HIFZ_CATEGORIES = [
  "quran",
  "jawami-hadith",
  "adhkar",
  "aqidah",
  "fiqh",
  "hadith-mutun",
  "arabic",
  "talib-ilm",
] as const;

export type HifzCategory = (typeof HIFZ_CATEGORIES)[number];

export const HIFZ_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type HifzLevel = (typeof HIFZ_LEVELS)[number];

/** مرجع نص موثّق — قرآن بلا تكرار نص في قاعدة المسار. */
export type HifzVerifiedTextReference =
  | {
      kind: "quran";
      surah: number;
      ayahFrom: number;
      ayahTo: number;
    }
  | {
      kind: "external";
      sourceId: string;
      locator: string;
    }
  | {
      kind: "app_route";
      route: string;
      locator?: string;
    };

export type HifzUnit = {
  unitId: string;
  title: string;
  sequence: number;
  verifiedTextReference: HifzVerifiedTextReference;
  audioReference?: string | null;
  sourceReference?: string | null;
  repetitionTarget?: number;
  revisionIntervals?: number[];
  completionCriteria?: string;
  reviewStatus: HifzReviewStatus;
  publicationStatus: HifzPublicationStatus;
};

export type HifzPath = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  category: HifzCategory;
  level: HifzLevel;
  estimatedUnits: number;
  sourceId?: string | null;
  sourceReference?: string | null;
  edition?: string | null;
  licenseStatus: HifzLicenseStatus;
  reviewStatus: HifzReviewStatus;
  publicationStatus: HifzPublicationStatus;
  coverAsset?: string | null;
  prerequisites?: string[];
  learningObjectives?: string[];
  units: HifzUnit[];
  revisionPlan?: string | null;
  searchVisibility: boolean;
  seoVisibility: boolean;
};

/** شعار واجهة مسموح — ليس حكمًا مطلقًا. */
export const HIFZ_PATH_USER_TAGLINE =
  "مسارات مقترحة للحفظ بحسب المستوى والهدف" as const;

export const HIFZ_PATH_FORBIDDEN_TAGLINE =
  "كل ما يجب على المسلم حفظه" as const;
