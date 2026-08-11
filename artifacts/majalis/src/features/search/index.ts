export { parseQuickNav, type QuickNavResult } from "@/features/search/quick-nav";
export {
  parseMushafJumpQuery,
  matchSurahNumber,
  type MushafJumpTarget,
} from "@/features/search/mushaf-jump";
export {
  normalizeArabic,
  normalizeForSearch,
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
  findClosestSuggestions,
  type AppSearchResult,
  type AppSearchResponse,
} from "@/features/search/app-search";
export {
  runAutocomplete,
  AUTOCOMPLETE_GROUP_LABELS,
  type AutocompleteGroup,
  type AutocompleteGroupId,
  type AutocompleteResponse,
} from "@/features/search/autocomplete";
export {
  mergeHybridResults,
  fetchSemanticHits,
  type HybridSearchSource,
} from "@/features/search/hybrid-search";
