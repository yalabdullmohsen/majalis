/**
 * عقد جرد الفرق الإسلامية (PR-1) — حقول داخلية؛ لا تُعرض للعامة كما هي.
 */
import type { IslamicSectsPublicationStatus } from "./publication-states";

export const ISLAMIC_SECTS_ENTITY_KINDS = [
  "method_intro",
  "creedal_school",
  "kalam_school",
  "historical_sect",
  "political_creedal_movement",
  "shi_i_branch",
  "sufi_current",
  "philosophical_school",
  "reform_trend",
  "fiqh_methodology",
  "independent_community",
  "contemporary_trend",
  "unclassified_needs_review",
] as const;

export type IslamicSectsEntityKind =
  (typeof ISLAMIC_SECTS_ENTITY_KINDS)[number];

export const ISLAMIC_SECTS_HISTORICAL_STATUS = [
  "historical",
  "contemporary",
  "mixed",
  "undocumented",
] as const;

export type IslamicSectsHistoricalStatus =
  (typeof ISLAMIC_SECTS_HISTORICAL_STATUS)[number];

export type IslamicSectsInventoryRecord = {
  id: string;
  slug: string;
  canonicalName: string;
  alternateNames: string[];
  selfDesignation: string[];
  externalDesignations: string[];
  parentTradition: string | null;
  /** نوع التصنيف العلمي (taxonomy) */
  entityKind: IslamicSectsEntityKind;
  /** التصنيف الظاهر حاليًا في الواجهة (قديم — للمراجعة) */
  legacyUiCategory: string;
  classification: string;
  historicalStatus: IslamicSectsHistoricalStatus;
  contemporaryStatus: string | null;
  emergencePeriod: string | null;
  emergencePlace: string | null;
  attributedFounder: string | null;
  keyHistoricalFigures: string[];
  summary: string | null;
  historicalContext: string | null;
  coreDoctrines: string[];
  internalBranches: string[];
  geographicSpreadHistorical: string | null;
  geographicSpreadCurrent: string | null;
  primarySources: string[];
  secondarySources: string[];
  attributedCritiques: string[];
  quotations: string[];
  sourceReferences: string[];
  sourceUrls: string[];
  licenseStatus: "unknown" | "ok" | "blocked" | "needs_review";
  factualReviewStatus: IslamicSectsPublicationStatus;
  shariaReviewStatus: IslamicSectsPublicationStatus;
  languageReviewStatus: IslamicSectsPublicationStatus;
  reviewer: string | null;
  reviewedAt: string | null;
  publicationStatus: IslamicSectsPublicationStatus;
  /** حقول واجهة قديمة للمطابقة فقط */
  uiSource: {
    file: string;
    era: string;
    origin: string;
    founder: string;
    statusLabel: string;
    spread: string;
    keyBeliefsCount: number;
    keyBooksCount: number;
    hasQuote: boolean;
  };
  inventoryFlags: string[];
};

export type IslamicSectsInventoryDocument = {
  version: 1;
  generatedAt: string;
  policy: string;
  sourceOfTruthUi: string;
  route: string;
  recordCount: number;
  publishedCount: number;
  hiddenCount: number;
  taxonomyRef: string;
  records: IslamicSectsInventoryRecord[];
};
