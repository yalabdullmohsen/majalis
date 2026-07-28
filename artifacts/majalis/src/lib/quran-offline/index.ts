/**
 * Public barrel for the Quran Engine offline IndexedDB schema.
 * Import from `@/lib/quran-offline` — do not wire into React views from here.
 */

export {
  QuranOfflineDatabase,
  getQuranOfflineDb,
  openQuranOfflineDb,
  closeQuranOfflineDb,
  isIndexedDbAvailable,
  QURAN_OFFLINE_DB_VERSION,
  QURAN_OFFLINE_STORE_INDEXES,
} from "@/lib/quran-offline/db";

export type {
  KhatmahStoreRecord,
  KhatmahProfileType,
  UserReflectionRecord,
  QuranKnowledgeRecord,
  OfflineAssetRecord,
  OfflineAssetType,
  OfflineAssetDownloadStatus,
  OutboxSyncRecord,
  OutboxEntityType,
  ReflectionSyncStatus,
} from "@/lib/quran-offline/types";

export {
  QURAN_OFFLINE_DB_NAME,
  QURAN_OFFLINE_DB_VERSION as SCHEMA_VERSION,
} from "@/lib/quran-offline/types";

export {
  listKhatmahProfiles,
  getKhatmahProfile,
  upsertKhatmahProfile,
  updateKhatmahProgress,
  deleteKhatmahProfile,
} from "@/lib/quran-offline/khatmah-store";

export {
  getReflectionsForAyah,
  getReflectionAyahKeySet,
  upsertReflection,
  deleteReflection,
  listPendingReflections,
  reflectionId,
} from "@/lib/quran-offline/reflections-store";

export {
  getKnowledgeForAyah,
  getSimilarAyahKeysCached,
  getThemeIdsForAyah,
  putKnowledgeBatch,
  mergeKnowledgeMaps,
  invertTopicsToAyahMap,
  flattenMutashabihatToKeys,
  ayahKey,
  countKnowledgeRows,
} from "@/lib/quran-offline/knowledge-store";

export {
  getAsset,
  listAssetsByType,
  listCompletedAssetsForReciter,
  upsertAsset,
  setAssetDownloadStatus,
  registerSurahAudioAsset,
  totalCompletedAssetBytes,
  makeAudioSurahAssetId,
  makeAyahAudioAssetId,
  makeFontCacheAssetId,
  makeTafseerAssetId,
} from "@/lib/quran-offline/assets-store";

export {
  enqueueOutboxMutation,
  drainQuranOutbox,
  countPendingOutbox,
  listPendingOutbox,
  startQuranOutboxSync,
} from "@/lib/quran-offline/outbox-sync";

export {
  migrateLegacyQuranOfflineData,
  getQuranOfflineStats,
  type MigrationReport,
} from "@/lib/quran-offline/migrate-legacy";

export { startQuranOfflineStorage, forceQuranOfflineSync } from "@/lib/quran-offline/bootstrap";
