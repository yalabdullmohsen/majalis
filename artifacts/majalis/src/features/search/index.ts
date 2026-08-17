export { parseQuickNav, type QuickNavResult } from "@/features/search/quick-nav";
export {
  parseMushafJumpQuery,
  matchSurahNumber,
  type MushafJumpTarget,
} from "@/features/search/mushaf-jump";
export {
  normalizeArabic,
  normalizeForSearch,
  normalizeAr,
  toWesternDigits,
  normalizedIncludes,
} from "@/shared/arabic-normalize";
export {
  loadUnifiedSearchIndex,
  primeUnifiedSearchIndex,
  clearUnifiedSearchIndexCache,
  searchUnifiedIndex,
  searchUnifiedIndexAsync,
  type UnifiedSearchDoc,
  type UnifiedSearchHit,
} from "@/features/search/unified-local";
export {
  scoreTolerantMatch,
  tolerantIncludes,
  highlightOriginalParts,
  stripDefiniteArticle,
  levenshtein,
  type TolerantMatch,
} from "@/features/search/tolerant-match";
export { kindPriority, KIND_PRIORITY } from "@/features/search/kind-priority";
export {
  runAppSearch,
  findClosestSuggestion,
  type AppSearchResult,
  type AppSearchResponse,
} from "@/features/search/app-search";
export {
  runUniversalSearch,
  enrichWithVerseHits,
  UNIVERSAL_DEBOUNCE_MS,
  UNIVERSAL_SECTION_ORDER,
  UNIVERSAL_SECTION_LABELS,
  type UniversalSearchResponse,
  type UniversalSectionId,
} from "@/features/search/universal-home-search";
