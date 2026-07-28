/**
 * Quran Engine — public façade (scaffold).
 * Wire concrete modules here as they are implemented.
 */
export {
  getDatabaseManager,
  DatabaseManager,
  type KhatmahStore,
  type ReflectionsStore,
} from "./DatabaseManager";

export {
  getQuranEngineContext,
  type QuranEngineContextApi,
  type ActiveVerse,
  type ReadingProgressInput,
} from "./QuranEngineContext";
