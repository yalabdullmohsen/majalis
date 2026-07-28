/**
 * Quran Engine offline schema types — IndexedDB / Dexie stores.
 * Field names follow the production storage contract (snake_case).
 */

export const QURAN_OFFLINE_DB_NAME = "majalis-quran-engine-db";
/** Current schema revision — bump only with additive Dexie upgrades. */
export const QURAN_OFFLINE_DB_VERSION = 2;

export type KhatmahProfileType = "reading" | "memorization";

/** `khatmah_store` — multiple concurrent reading / memorization profiles. */
export type KhatmahStoreRecord = {
  id: string;
  title: string;
  type: KhatmahProfileType;
  current_surah: number;
  current_ayah: number;
  current_page: number;
  daily_wird_target: number;
  streak_days: number;
  last_read_timestamp: number;
  is_completed: boolean;
  /** Monotonic revision for LWW merge across devices. */
  revision: number;
  updated_at: number;
  /** Optional bridge to legacy localStorage plan id. */
  legacy_plan_id?: string;
};

export type ReflectionSyncStatus = "pending" | "synced";

/** `user_reflections_store` — ayah/word notes, memos, colored bookmarks. */
export type UserReflectionRecord = {
  id: string;
  surah_id: number;
  ayah_id: number;
  word_index?: number;
  note_text: string;
  audio_memo_blob?: Blob;
  bookmark_color?: string;
  tags: string[];
  created_at: number;
  sync_status: ReflectionSyncStatus;
  updated_at: number;
  /** v2 — last time reflection was opened/read (silent migration). */
  last_opened_at?: number;
  /** v2 — schema stamp for future additive fields. */
  schema_version?: number;
};

/** `quran_knowledge_store` — precomputed similarity + thematic graph per ayah. */
export type QuranKnowledgeRecord = {
  ayah_key: string;
  similar_ayah_keys: string[];
  theme_ids: string[];
  updated_at: number;
  /** v2 — LRU touch */
  last_accessed_at?: number;
  /** v2 — LFU counter */
  access_count?: number;
};

export type OfflineAssetType =
  | "audio_surah"
  | "tafseer_db"
  | "font_cache"
  | "ayah_audio"
  | "tajweed_meta";

export type OfflineAssetDownloadStatus =
  | "pending"
  | "downloading"
  | "completed"
  | "failed";

/**
 * `offline_assets_store` — lifecycle tracker for downloaded media / DBs / fonts.
 * `file_reference` may be a Blob, OPFS path string, or legacy IDB key pointer.
 */
export type OfflineAssetRecord = {
  asset_id: string;
  type: OfflineAssetType;
  reciter_id?: string;
  surah_id?: number;
  download_status: OfflineAssetDownloadStatus;
  file_reference?: Blob | string;
  size_bytes: number;
  updated_at: number;
  content_hash?: string;
  /** v2 — LRU touch */
  last_accessed_at?: number;
  /** v2 — LFU counter */
  access_count?: number;
  /** v2 — pinned/favorited assets are never auto-evicted */
  pinned?: boolean;
};

export type OutboxEntityType =
  | "khatmah"
  | "reflection"
  | "bookmark"
  | "wird"
  | "reading_progress"
  | "asset_meta";

export type OutboxOperation = "upsert" | "delete";

export type OutboxStatus = "pending" | "syncing" | "synced" | "failed";

/** `outbox_sync_store` — durable mutation log (outbox pattern). */
export type OutboxSyncRecord = {
  /** Auto-increment primary key. */
  id?: number;
  client_mutation_id: string;
  entity_type: OutboxEntityType;
  entity_id: string;
  operation: OutboxOperation;
  payload: unknown;
  created_at: number;
  status: OutboxStatus;
  attempts: number;
  last_error?: string;
};

export type QuranOfflineSchemaMeta = {
  key: "schema_meta";
  version: number;
  migrated_at: number;
  legacy_sources: string[];
};
