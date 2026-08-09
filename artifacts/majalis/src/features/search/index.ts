export { parseQuickNav, type QuickNavResult } from "@/features/search/quick-nav";
export { parseMushafJumpQuery, type MushafJumpTarget } from "@/features/search/mushaf-jump";
export {
  normalizeArabic,
  normalizeForSearch,
  toWesternDigits,
  normalizedIncludes,
} from "@/shared/arabic-normalize";
export {
  loadUnifiedSearchIndex,
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
