/**
 * Dexie IndexedDB database for the Ayah/Tarteel Quran Engine offline layer.
 * All operations are async (never blocks the main thread with sync IDB).
 * Schema upgrades are additive — never wipe user tables.
 */
import Dexie, { type EntityTable } from "dexie";
import {
  QURAN_OFFLINE_DB_NAME,
  QURAN_OFFLINE_DB_VERSION,
  type KhatmahStoreRecord,
  type OfflineAssetRecord,
  type OutboxSyncRecord,
  type QuranKnowledgeRecord,
  type UserReflectionRecord,
} from "@/lib/quran-offline/types";

export type QuranOfflineTables = {
  khatmah_store: EntityTable<KhatmahStoreRecord, "id">;
  user_reflections_store: EntityTable<UserReflectionRecord, "id">;
  quran_knowledge_store: EntityTable<QuranKnowledgeRecord, "ayah_key">;
  offline_assets_store: EntityTable<OfflineAssetRecord, "asset_id">;
  outbox_sync_store: EntityTable<OutboxSyncRecord, "id">;
};

/** Declared store indexes — single source of truth for upgrades + contract tests. */
export const QURAN_OFFLINE_STORE_INDEXES = {
  khatmah_store:
    "id, type, last_read_timestamp, is_completed, [type+is_completed], updated_at",
  user_reflections_store:
    "id, surah_id, ayah_id, [surah_id+ayah_id], sync_status, created_at, updated_at, *tags",
  quran_knowledge_store: "ayah_key, *theme_ids, *similar_ayah_keys, updated_at",
  offline_assets_store:
    "asset_id, type, download_status, reciter_id, surah_id, [type+reciter_id], [type+surah_id], updated_at",
  outbox_sync_store:
    "++id, client_mutation_id, status, created_at, entity_type, [status+created_at], entity_id",
} as const;

export class QuranOfflineDatabase extends Dexie {
  khatmah_store!: EntityTable<KhatmahStoreRecord, "id">;
  user_reflections_store!: EntityTable<UserReflectionRecord, "id">;
  quran_knowledge_store!: EntityTable<QuranKnowledgeRecord, "ayah_key">;
  offline_assets_store!: EntityTable<OfflineAssetRecord, "asset_id">;
  outbox_sync_store!: EntityTable<OutboxSyncRecord, "id">;

  constructor(name = QURAN_OFFLINE_DB_NAME) {
    super(name);
    /**
     * v1 — five production stores + compound / multiEntry indexes.
     * Future versions MUST only add indexes/stores; never delete columns.
     */
    this.version(1).stores({ ...QURAN_OFFLINE_STORE_INDEXES });
  }
}

let dbSingleton: QuranOfflineDatabase | null = null;
let testOverride: QuranOfflineDatabase | null = null;

export function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

/** Open (or reuse) the Quran offline Dexie database. Returns null when IDB missing. */
export function getQuranOfflineDb(): QuranOfflineDatabase | null {
  if (testOverride) return testOverride;
  if (!isIndexedDbAvailable()) return null;
  if (!dbSingleton) {
    dbSingleton = new QuranOfflineDatabase();
  }
  return dbSingleton;
}

/** Test helper — inject/open an isolated DB name. */
export function __setQuranOfflineDbForTests(db: QuranOfflineDatabase | null): void {
  testOverride = db;
  if (!db) dbSingleton = null;
}

export async function openQuranOfflineDb(): Promise<QuranOfflineDatabase | null> {
  const db = getQuranOfflineDb();
  if (!db) return null;
  // Force open so upgrade handlers run before first put
  await db.open();
  return db;
}

export async function closeQuranOfflineDb(): Promise<void> {
  const db = testOverride ?? dbSingleton;
  if (db?.isOpen()) db.close();
  dbSingleton = null;
  testOverride = null;
}

export { QURAN_OFFLINE_DB_VERSION };
