/**
 * عقود بيانات البحوث الشرعية — فهرس ورابط أصلي، ليست ناشرًا للملف في v1.
 * السطح الحي للمنتج: `/academic-research` + `lib/researches`.
 * هذه الوحدة = طبقة حوكمة (مراجعات أربع / أدوار) للهجرة اللاحقة — لا UI موازٍ.
 */

import type {
  ScholarlyResearchPublicationStatus,
  ScholarlyReviewOutcome,
} from "./publication-states";

export const SCHOLARLY_RESEARCH_SCHEMA_VERSION = 1 as const;

export const SCHOLARLY_DEGREE_TYPES = [
  "masters",
  "doctorate",
  "peer_reviewed",
  "conference",
  "academic_study",
  "academic_tahqiq",
] as const;

export type ScholarlyDegreeType = (typeof SCHOLARLY_DEGREE_TYPES)[number];

export const SCHOLARLY_DISCIPLINES = [
  "quran_ulum",
  "tafsir",
  "hadith",
  "aqidah",
  "fiqh",
  "usul_fiqh",
  "seerah",
  "islamic_history",
  "dawah",
  "sects",
  "akhlaq",
  "islamic_economics",
  "islamic_education",
  "arabic",
  "interdisciplinary",
] as const;

export type ScholarlyDiscipline = (typeof SCHOLARLY_DISCIPLINES)[number];

export const SCHOLARLY_ACCESS_TYPES = [
  "metadata_only",
  "abstract_only",
  "external_fulltext",
  "licensed_hosted",
] as const;

export type ScholarlyAccessType = (typeof SCHOLARLY_ACCESS_TYPES)[number];

export const SCHOLARLY_FILE_HOSTING_MODES = [
  "NONE",
  "EXTERNAL_LINK_ONLY",
  "LICENSED_HOSTED",
] as const;

export type ScholarlyFileHostingMode =
  (typeof SCHOLARLY_FILE_HOSTING_MODES)[number];

export type ScholarlyResearchRecord = {
  id: string;
  slug: string;
  titleArabic: string;
  titleOriginal?: string | null;
  authorName: string;
  authorDisplayConsent: boolean;
  institution: string;
  college?: string | null;
  department?: string | null;
  country?: string | null;
  language: string;
  degreeType: ScholarlyDegreeType;
  academicYear?: string | null;
  publicationYear?: number | null;
  supervisor?: string | null;
  researchType?: string | null;
  discipline: ScholarlyDiscipline;
  keywords: string[];
  abstract?: string | null;
  abstractSource?: string | null;
  originalSourceUrl: string;
  doi?: string | null;
  repositoryName?: string | null;
  repositoryRecordId?: string | null;
  fullTextAvailability: boolean;
  accessType: ScholarlyAccessType;
  license?: string | null;
  rightsHolder?: string | null;
  fileHostingMode: ScholarlyFileHostingMode;
  methodologyReviewStatus: ScholarlyReviewOutcome;
  academicVerificationStatus: ScholarlyReviewOutcome;
  sourceVerificationStatus: ScholarlyReviewOutcome;
  rightsReviewStatus: ScholarlyReviewOutcome;
  publicationStatus: ScholarlyResearchPublicationStatus;
  submittedBy?: string | null;
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  searchVisibility: boolean;
  seoVisibility: boolean;
  contentHash?: string | null;
  lastSourceCheck?: string | null;
};

/** اقتراح مستخدم — لا يُنشر مباشرة ولا يظهر في البحث. */
export type ScholarlyResearchSuggestion = {
  title: string;
  authorName: string;
  institution: string;
  degreeType: ScholarlyDegreeType;
  discipline: ScholarlyDiscipline;
  year?: string | null;
  originalSourceUrl: string;
  doi?: string | null;
  abstract?: string | null;
  notes?: string | null;
  attestationDataAccurate: boolean;
  attestationNoAppFileRights: boolean;
  privacyPolicyAccepted: boolean;
};
