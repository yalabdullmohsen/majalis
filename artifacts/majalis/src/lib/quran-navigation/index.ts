export type {
  QuranAyahReference,
  QuranReturnContext,
  QuranNavigationSource,
  QuranHighlightMode,
  ValidatedQuranAyahReference,
} from "./types";
export {
  QURAN_NAV_HIGHLIGHT_HOLD_MS,
  QURAN_NAV_HIGHLIGHT_FADE_MS,
} from "./types";
export {
  buildQuranAyahReference,
  validateAyahIds,
  ayahBelongsToPage,
  type BuildReferenceInput,
} from "./validate";
export {
  buildMushafAyahHref,
  resolveCanonicalAyahHref,
  parseMushafNavQuery,
  verseKeyFromRef,
} from "./href";
export {
  QuranNavigationService,
  openMushafAtReference,
  createPendingNavigationHighlight,
  saveQuranReturnContext,
  loadQuranReturnContext,
  clearQuranReturnContext,
  stashPendingNavigationHighlight,
  consumePendingNavigationHighlight,
  peekPendingNavigationHighlight,
  clearPendingNavigationHighlight,
  hasActiveNavigationIntent,
  type PendingNavigationHighlight,
  type PendingAyahSelectionStatus,
} from "./service";
export {
  resolveLegacyMushafSurahRedirect,
  type LegacyMushafSurahRedirectResult,
} from "./legacy-surah-redirect";
