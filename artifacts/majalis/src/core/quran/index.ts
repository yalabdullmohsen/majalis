/**
 * Quran Engine core — functional backend architecture (no UI).
 *
 * Communication:
 *   QuranEngineContext  →  owns page/verse/audio state; notifies subscribers
 *         │                      and asks DatabaseManager for knowledge touches
 *         ├── DatabaseManager → Dexie async CRUD (Khatmah / Reflections / Assets)
 *         │         └── IndexingService (Web Workers) for mutashabihat flatten
 *         └── ResourceManager → LRU budget + memory pressure; can suspend
 *                   IndexingService / prefetch via lifecycle flags
 */
export {
  getQuranEngineContext,
  useQuranEngineCore,
  ACTIVE_READING_KHATMAH_ID,
  type QuranEngineContextApi,
  type ActiveVerse,
  type AudioSnapshot,
  type ReadingProgressInput,
  type UseQuranEngineCoreResult,
} from "@/core/quran/QuranEngineContext";
export {
  DatabaseManager,
  getDatabaseManager,
  QuranCoreDatabase,
  CORE_QURAN_DB_NAME,
  CORE_QURAN_DB_VERSION,
  CORE_STORE_INDEXES,
  TAJWEED_ENABLED_SETTING_KEY,
  DAILY_READING_STATS_KEY_PREFIX,
  localDateKey,
  type KhatmahStore,
  type ReflectionsStore,
  type OfflineAssetsStore,
  type SettingsStore,
  type DailyReadingStatsRecord,
  type DashboardStats,
  type KhatmahType,
  type ReflectionSyncStatus,
  type OfflineAssetType,
  type OfflineAssetDownloadStatus,
  type CrudResult,
} from "@/core/quran/DatabaseManager";
export { ResourceManager, getResourceManager } from "@/core/quran/ResourceManager";
export { IndexingService, getIndexingService } from "@/core/quran/IndexingService";
export { startQuranCore } from "@/core/quran/bootstrap";
export {
  getAudioEngine,
  AudioEngine,
  type RepeatMode,
  type RepeatRange,
  type AudioEngineSnapshot,
  type DownloadProgress,
} from "@/core/audio";
export {
  getTafseerService,
  TafseerService,
  TAFSEER_SOURCES,
  type TafseerSource,
  type TafseerAyahResult,
} from "@/core/tafseer";
