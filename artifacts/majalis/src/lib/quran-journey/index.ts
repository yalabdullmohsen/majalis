/**
 * رحلة القرآن المتقدمة — عقود + أعلام + مستودع محلي (PR-1).
 * لا يستورد هذا المسار من main/App؛ يبقى خارج Initial Bundle حتى تُفعَّل UI لاحقًا.
 */
export {
  QURAN_JOURNEY_FLAGS_DEFAULT,
  getQuranJourneyFlags,
  hydrateQuranJourneyFlagsFromStorage,
  isQuranJourneyFlagOn,
  persistQuranJourneyFlagOverrides,
  resetQuranJourneyFlags,
  setQuranJourneyFlagsForTests,
  type QuranJourneyFeatureFlags,
} from "./flags";

export {
  QURAN_JOURNEY_SCHEMA_VERSION,
  type JourneyStatus,
  type JourneyType,
  type MarkerColorToken,
  type MarkerType,
  type MemorizationStatus,
  type QuranJourney,
  type QuranJourneyStore,
  type QuranMarker,
  type QuranMemorizationState,
  type QuranReadingSession,
  type QuranReference,
  type ReadingCompletionState,
  type SyncState,
} from "./types";

export {
  ayahCountForSurah,
  defaultColorForMarkerType,
  isValidPage,
  isValidSurahAyah,
  validateJourney,
  validateMarker,
  validateMemorization,
  validateReadingSession,
  validateReference,
} from "./validate";

export {
  QURAN_JOURNEY_JOURNEYS_MAX,
  QURAN_JOURNEY_MARKERS_MAX,
  QURAN_JOURNEY_MEM_MAX,
  QURAN_JOURNEY_OWNER_KEY,
  QURAN_JOURNEY_SESSIONS_MAX,
  QURAN_JOURNEY_STORE_KEY,
  QuranJourneyLocalRepository,
  getOrCreateLocalOwnerId,
  resetQuranJourneyStoreForTests,
} from "./local-repository";
