/**
 * RN `/services` — AsyncStorage-like prefs, DB, fetch, audio/tafsir engines.
 */

export {
  storageService,
  type MyBookmark,
} from "./storageService";

export {
  getDatabaseManager,
  DatabaseManager,
  type BookmarkRecord,
  type ReadingProgress,
  type TafseerCacheRecord,
} from "@/core/quran/DatabaseManager";

export { getAudioEngine, AudioEngine } from "@/core/audio/AudioEngine";
export { getTafseerService, TafseerService, DEFAULT_TAFSEER_SOURCE } from "@/core/tafseer/TafseerService";

export {
  fetchSurahDetail,
  fetchTafsirAyahs,
  getSurahMeta,
  getSurahList,
  type Ayah,
} from "@/lib/quran-api";

export {
  loadReciterId,
  saveReciterId,
  loadPlaybackRate,
  savePlaybackRate,
} from "@/lib/quran-audio";

export {
  persistShowTranslation,
  readStoredShowTranslation,
  DEFAULT_TRANSLATION_EDITION,
} from "@/lib/quran-translation";

export { shareVerse } from "@/lib/share-ayah";

export {
  QuranController,
  createQuranController,
  type QuranControllerSnapshot,
} from "@/lib/quran-controller";

export {
  AppController,
  createAppController,
  getAppController,
  type AppControllerSnapshot,
} from "@/lib/app-controller";

export {
  QuranAppController,
  createQuranAppController,
  SAMPLE_FATIHA_VERSES,
  type QuranAppControllerSnapshot,
} from "@/lib/quran-app-controller";

export {
  EducationalProgressController,
  createEducationalProgressController,
  type EducationalProgressSnapshot,
} from "@/lib/educational-progress-controller";

export { QuranRepository, SAMPLE_VERSES_DATA, type QuranVerseRecord } from "@/lib/quran-repository";

export {
  filterSmartSearch,
  SMART_SEARCH_DATABASE,
  SEARCH_CATEGORY_LABELS,
  type SearchCategory,
  type SmartSearchItem,
} from "@/lib/smart-search-engine";
