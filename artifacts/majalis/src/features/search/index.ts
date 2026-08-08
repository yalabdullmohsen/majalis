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
  type UnifiedSearchDoc,
  type UnifiedSearchHit,
} from "@/features/search/unified-local";
