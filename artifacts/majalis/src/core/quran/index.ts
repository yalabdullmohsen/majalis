/**
 * Quran Engine — public façade.
 */
export {
  databaseManager,
  getDatabaseManager,
  DatabaseManager,
  QuranAppDatabase,
  QURAN_APP_DB_NAME,
  QURAN_APP_DB_VERSION,
  ACTIVE_PROGRESS_ID,
  type SettingsRecord,
  type KnownSettingKey,
  type ReadingProgress,
  type BookmarkRecord,
  type TafseerCacheRecord,
  type SaveProgressInput,
  type AddBookmarkInput,
} from "./DatabaseManager";

export {
  getQuranEngineContext,
  type QuranEngineContextApi,
  type ActiveVerse,
  type ReadingProgressInput,
} from "./QuranEngineContext";
