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
