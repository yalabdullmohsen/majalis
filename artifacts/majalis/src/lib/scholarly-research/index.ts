export {
  MEMORIZATION_RESEARCH_FLAGS_DEFAULT,
  getMemorizationResearchFlags,
  hydrateMemorizationResearchFlagsFromStorage,
  isHifzPathEnabled,
  isMemorizationResearchFlagOn,
  isScholarlyResearchEnabled,
  persistMemorizationResearchFlagOverrides,
  resetMemorizationResearchFlags,
  setMemorizationResearchFlagsForTests,
  type MemorizationResearchFeatureFlags,
} from "@/lib/memorization-path/flags";

export {
  SCHOLARLY_METHODOLOGY_FORBIDDEN_PHRASE,
  SCHOLARLY_METHODOLOGY_PUBLIC_PHRASES,
  SCHOLARLY_RESEARCH_DISCLAIMER,
  SCHOLARLY_RESEARCH_PUBLICATION_STATES,
  SCHOLARLY_RESEARCH_PUBLIC_VISIBLE_STATES,
  SCHOLARLY_REVIEW_KINDS,
  SCHOLARLY_REVIEW_OUTCOMES,
  isScholarlyResearchPubliclyVisible,
  type ScholarlyResearchPublicationStatus,
  type ScholarlyReviewKind,
  type ScholarlyReviewOutcome,
} from "./publication-states";

export {
  SCHOLARLY_RESEARCH_ROLES,
  SCHOLARLY_REVIEW_ROLE_MAP,
  roleCanPerformScholarlyReview,
  type ScholarlyResearchRole,
} from "./review-roles";

export {
  SCHOLARLY_ACCESS_TYPES,
  SCHOLARLY_DEGREE_TYPES,
  SCHOLARLY_DISCIPLINES,
  SCHOLARLY_FILE_HOSTING_MODES,
  SCHOLARLY_RESEARCH_SCHEMA_VERSION,
  type ScholarlyAccessType,
  type ScholarlyDegreeType,
  type ScholarlyDiscipline,
  type ScholarlyFileHostingMode,
  type ScholarlyResearchRecord,
  type ScholarlyResearchSuggestion,
} from "./types";

export {
  SCHOLARLY_FORBIDDEN_PUBLISH_CTA,
  SCHOLARLY_FORBIDDEN_HOSTED_DOWNLOAD_CTA,
  SCHOLARLY_OPEN_ORIGINAL_CTA,
  SCHOLARLY_RESEARCH_PDF_UPLOAD_ALLOWED,
  SCHOLARLY_SUGGEST_CTA,
  isSafeExternalHttpUrl,
  safeOriginalSourceHref,
} from "./url-policy";

export {
  countPublishedScholarlyResearch,
  getPublishedScholarlyResearchBySlug,
  listAllScholarlyResearchInternal,
  listPublishedScholarlyResearch,
} from "./catalog";

export {
  matchesScholarlyFilters,
  searchPublishedScholarlyResearch,
  type ScholarlySearchFilters,
} from "./search";
