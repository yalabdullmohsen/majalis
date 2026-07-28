/**
 * DatabaseManager — Dexie.js local database for the Ayah/Tarteel Quran Engine.
 *
 * Schema (core planning):
 *  1. khatmah_store       — multi-profile reading / memorization progress
 *  2. user_reflections_store — notes & bookmarks (composite [surah_id+ayah_id])
 *  3. offline_assets_store — downloaded audio / tafseer / font cache metadata
 *
 * Singleton · async-only · additive schema versioning · safe error boundaries.
 * No UI dependencies.
 */
import Dexie, { type EntityTable } from "dexie";

// ─── Record types (exact planning fields + additive lifecycle extras) ────────

export type KhatmahType = "reading" | "memorization";

/** KhatmahStore — reading / memorization profiles. */
export type KhatmahStore = {
  id: string;
  title: string;
  type: KhatmahType;
  current_surah: number;
  current_ayah: number;
  current_page: number;
  daily_wird_target: number;
  streak_days: number;
  last_read_timestamp: number;
  is_completed: boolean;
  /** Additive — LWW sync revision (optional). */
  revision?: number;
  updated_at?: number;
};

export type ReflectionSyncStatus = "pending" | "synced";

/** ReflectionsStore — ayah/word notes and colored bookmarks. */
export type ReflectionsStore = {
  id: string;
  surah_id: number;
  ayah_id: number;
  word_index?: number;
  note_text: string;
  bookmark_color?: string;
  tags: string[];
  created_at: number;
  sync_status: ReflectionSyncStatus;
  /** Additive — voice memo blob (optional). */
  audio_memo_blob?: Blob;
  updated_at?: number;
  last_opened_at?: number;
  schema_version?: number;
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

/** OfflineAssetsStore — download lifecycle / cache tracking. */
export type OfflineAssetsStore = {
  asset_id: string;
  type: OfflineAssetType;
  reciter_id?: string;
  surah_id?: number;
  download_status: OfflineAssetDownloadStatus;
  /** Blob, OPFS path, or legacy IDB key pointer. */
  file_reference?: Blob | string;
  /** Additive lifecycle fields. */
  size_bytes?: number;
  updated_at?: number;
  last_accessed_at?: number;
  access_count?: number;
  pinned?: boolean;
  content_hash?: string;
};

export const CORE_QURAN_DB_NAME = "majalis-quran-engine-db";
/** Keep in sync with `@/lib/quran-offline` so both openers share one IDB. */
export const CORE_QURAN_DB_VERSION = 3;

/** Stable settings_store key for optional Tajweed color coding. */
export const TAJWEED_ENABLED_SETTING_KEY = "isTajweedEnabled";

/** `settings_store` — durable engine preferences (key/value). */
export type SettingsStore = {
  key: string;
  value: unknown;
  updated_at: number;
};

/** Frozen v2 indexes (upgrade path). */
export const CORE_STORE_INDEXES_V2 = {
  khatmah_store:
    "id, type, last_read_timestamp, is_completed, [type+is_completed], updated_at",
  user_reflections_store:
    "id, surah_id, ayah_id, [surah_id+ayah_id], sync_status, created_at, updated_at, last_opened_at, *tags",
  offline_assets_store:
    "asset_id, type, download_status, reciter_id, surah_id, [type+reciter_id], [type+surah_id], updated_at, last_accessed_at, pinned, access_count",
  quran_knowledge_store:
    "ayah_key, *theme_ids, *similar_ayah_keys, updated_at, last_accessed_at, access_count",
  outbox_sync_store:
    "++id, client_mutation_id, status, created_at, entity_type, [status+created_at], entity_id",
} as const;

/** Index declarations — single source of truth for current version upgrades. */
export const CORE_STORE_INDEXES = {
  ...CORE_STORE_INDEXES_V2,
  settings_store: "key, updated_at",
} as const;

type KnowledgeRow = {
  ayah_key: string;
  similar_ayah_keys: string[];
  theme_ids: string[];
  updated_at: number;
  last_accessed_at?: number;
  access_count?: number;
};

type OutboxRow = {
  id?: number;
  client_mutation_id: string;
  entity_type: string;
  entity_id: string;
  operation: string;
  payload: unknown;
  created_at: number;
  status: string;
  attempts: number;
  last_error?: string;
};

/** Dexie database class — owns schema versioning. */
export class QuranCoreDatabase extends Dexie {
  khatmah_store!: EntityTable<KhatmahStore, "id">;
  user_reflections_store!: EntityTable<ReflectionsStore, "id">;
  offline_assets_store!: EntityTable<OfflineAssetsStore, "asset_id">;
  quran_knowledge_store!: EntityTable<KnowledgeRow, "ayah_key">;
  outbox_sync_store!: EntityTable<OutboxRow, "id">;
  settings_store!: EntityTable<SettingsStore, "key">;

  constructor(name = CORE_QURAN_DB_NAME) {
    super(name);

    // v1 — original five-store layout (frozen for upgrade path)
    this.version(1).stores({
      khatmah_store:
        "id, type, last_read_timestamp, is_completed, [type+is_completed], updated_at",
      user_reflections_store:
        "id, surah_id, ayah_id, [surah_id+ayah_id], sync_status, created_at, updated_at, *tags",
      offline_assets_store:
        "asset_id, type, download_status, reciter_id, surah_id, [type+reciter_id], [type+surah_id], updated_at",
      quran_knowledge_store: "ayah_key, *theme_ids, *similar_ayah_keys, updated_at",
      outbox_sync_store:
        "++id, client_mutation_id, status, created_at, entity_type, [status+created_at], entity_id",
    });

    // v2 — lifecycle indexes (additive; never wipe user rows)
    this.version(2)
      .stores({ ...CORE_STORE_INDEXES_V2 })
      .upgrade(async (tx) => {
        const now = Date.now();
        await tx
          .table("khatmah_store")
          .toCollection()
          .modify((row: KhatmahStore) => {
            if (row.updated_at == null) row.updated_at = row.last_read_timestamp || now;
            if (row.revision == null) row.revision = 0;
          });
        await tx
          .table("user_reflections_store")
          .toCollection()
          .modify((row: ReflectionsStore) => {
            if (!Array.isArray(row.tags)) row.tags = [];
            if (row.last_opened_at == null) {
              row.last_opened_at = row.updated_at || row.created_at || now;
            }
            if (row.schema_version == null) row.schema_version = 2;
          });
        await tx
          .table("offline_assets_store")
          .toCollection()
          .modify((row: OfflineAssetsStore) => {
            if (row.last_accessed_at == null) {
              row.last_accessed_at = row.updated_at || now;
            }
            if (row.access_count == null) row.access_count = 0;
            if (row.pinned == null) row.pinned = false;
            if (row.size_bytes == null) {
              row.size_bytes =
                row.file_reference instanceof Blob ? row.file_reference.size : 0;
            }
          });
      });

    // v3 — settings_store for durable engine preferences (Tajweed toggle, …)
    this.version(3).stores({ ...CORE_STORE_INDEXES });
  }
}

export type CrudResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function ok<T>(data: T): CrudResult<T> {
  return { ok: true, data };
}
function fail<T = never>(error: string): CrudResult<T> {
  return { ok: false, error };
}

function reflectionId(surah: number, ayah: number, wordIndex?: number): string {
  return wordIndex == null ? `${surah}:${ayah}` : `${surah}:${ayah}:w${wordIndex}`;
}

/**
 * Singleton DatabaseManager — initialize once, CRUD everywhere.
 * Every public method catches IDB failures and returns null / empty / false
 * so callers never see unhandled rejections from storage quota/corruption.
 */
export class DatabaseManager {
  private static instance: DatabaseManager | null = null;

  private db: QuranCoreDatabase | null = null;
  private initPromise: Promise<boolean> | null = null;

  private constructor() {
    /* singleton */
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /** Test helper — drop the singleton (does not delete IndexedDB). */
  static __resetInstanceForTests(): void {
    try {
      DatabaseManager.instance?.db?.close();
    } catch {
      /* ignore */
    }
    DatabaseManager.instance = null;
  }

  /** Open DB + apply schema upgrades. Idempotent. */
  async initialize(): Promise<boolean> {
    if (typeof indexedDB === "undefined") return false;
    if (this.db?.isOpen()) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const db = new QuranCoreDatabase();
        await db.open();
        this.db = db;
        return true;
      } catch (err) {
        this.db = null;
        console.warn(
          "[DatabaseManager] initialize failed:",
          err instanceof Error ? err.message : err,
        );
        return false;
      } finally {
        // Allow retry after failure
        if (!this.db) this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /** Raw Dexie instance (null when unavailable / not yet opened). */
  getDb(): QuranCoreDatabase | null {
    return this.db;
  }

  /**
   * Direct `khatmah_store` table (null until `initialize()` succeeds).
   * Prefer `listKhatmah` / `upsertKhatmah` for safe CRUD; this is for
   * advanced queries from QuranEngineContext.
   */
  get khatmahStore() {
    return this.db?.khatmah_store ?? null;
  }

  /** Direct `user_reflections_store` table (null until open). */
  get reflectionsStore() {
    return this.db?.user_reflections_store ?? null;
  }

  /** Direct `offline_assets_store` table (null until open). */
  get offlineAssetsStore() {
    return this.db?.offline_assets_store ?? null;
  }

  /** Direct `settings_store` table (null until open). */
  get settingsStore() {
    return this.db?.settings_store ?? null;
  }

  private async ensureDb(): Promise<QuranCoreDatabase | null> {
    const ready = await this.initialize();
    return ready ? this.db : null;
  }

  // ── SettingsStore CRUD ─────────────────────────────────────────────────

  async getSetting<T = unknown>(key: string): Promise<T | null> {
    try {
      const db = await this.ensureDb();
      if (!db) return null;
      const row = await db.settings_store.get(key);
      return row ? (row.value as T) : null;
    } catch (err) {
      console.warn("[DatabaseManager] getSetting:", err);
      return null;
    }
  }

  async setSetting(key: string, value: unknown): Promise<SettingsStore | null> {
    try {
      const db = await this.ensureDb();
      if (!db) return null;
      const row: SettingsStore = { key, value, updated_at: Date.now() };
      await db.settings_store.put(row);
      return row;
    } catch (err) {
      console.warn("[DatabaseManager] setSetting:", err);
      return null;
    }
  }

  async deleteSetting(key: string): Promise<boolean> {
    try {
      const db = await this.ensureDb();
      if (!db) return false;
      await db.settings_store.delete(key);
      return true;
    } catch (err) {
      console.warn("[DatabaseManager] deleteSetting:", err);
      return false;
    }
  }

  // ── KhatmahStore CRUD ──────────────────────────────────────────────────

  async listKhatmah(opts?: {
    type?: KhatmahType;
    activeOnly?: boolean;
  }): Promise<KhatmahStore[]> {
    try {
      const db = await this.ensureDb();
      if (!db) return [];
      let rows: KhatmahStore[];
      if (opts?.type != null && opts?.activeOnly) {
        rows = await db.khatmah_store
          .where("[type+is_completed]")
          .equals([opts.type, false])
          .toArray();
      } else if (opts?.type != null) {
        rows = await db.khatmah_store.where("type").equals(opts.type).toArray();
      } else if (opts?.activeOnly) {
        rows = await db.khatmah_store.where("is_completed").equals(false).toArray();
      } else {
        rows = await db.khatmah_store.toArray();
      }
      return rows.sort((a, b) => b.last_read_timestamp - a.last_read_timestamp);
    } catch (err) {
      console.warn("[DatabaseManager] listKhatmah:", err);
      return [];
    }
  }

  async getKhatmah(id: string): Promise<KhatmahStore | null> {
    try {
      const db = await this.ensureDb();
      if (!db) return null;
      return (await db.khatmah_store.get(id)) ?? null;
    } catch (err) {
      console.warn("[DatabaseManager] getKhatmah:", err);
      return null;
    }
  }

  async upsertKhatmah(
    input: Omit<KhatmahStore, "last_read_timestamp" | "is_completed" | "streak_days"> &
      Partial<Pick<KhatmahStore, "last_read_timestamp" | "is_completed" | "streak_days" | "revision" | "updated_at">>,
  ): Promise<KhatmahStore | null> {
    try {
      const db = await this.ensureDb();
      if (!db) return null;
      const existing = await db.khatmah_store.get(input.id);
      const now = Date.now();
      const row: KhatmahStore = {
        id: input.id,
        title: input.title,
        type: input.type,
        current_surah: input.current_surah,
        current_ayah: input.current_ayah,
        current_page: input.current_page,
        daily_wird_target: input.daily_wird_target,
        streak_days: input.streak_days ?? existing?.streak_days ?? 0,
        last_read_timestamp: input.last_read_timestamp ?? now,
        is_completed: input.is_completed ?? existing?.is_completed ?? false,
        revision: (input.revision ?? existing?.revision ?? 0) + (existing ? 1 : 0),
        updated_at: now,
      };
      await db.khatmah_store.put(row);
      return row;
    } catch (err) {
      console.warn("[DatabaseManager] upsertKhatmah:", err);
      return null;
    }
  }

  async updateKhatmahProgress(
    id: string,
    patch: Partial<
      Pick<
        KhatmahStore,
        | "current_surah"
        | "current_ayah"
        | "current_page"
        | "streak_days"
        | "daily_wird_target"
        | "is_completed"
        | "title"
      >
    >,
  ): Promise<KhatmahStore | null> {
    try {
      const existing = await this.getKhatmah(id);
      if (!existing) return null;
      return this.upsertKhatmah({
        ...existing,
        ...patch,
        last_read_timestamp: Date.now(),
      });
    } catch (err) {
      console.warn("[DatabaseManager] updateKhatmahProgress:", err);
      return null;
    }
  }

  async deleteKhatmah(id: string): Promise<boolean> {
    try {
      const db = await this.ensureDb();
      if (!db) return false;
      await db.khatmah_store.delete(id);
      return true;
    } catch (err) {
      console.warn("[DatabaseManager] deleteKhatmah:", err);
      return false;
    }
  }

  // ── ReflectionsStore CRUD ──────────────────────────────────────────────

  /** O(log n) lookup via compound index [surah_id+ayah_id]. */
  async getReflections(surah_id: number, ayah_id: number): Promise<ReflectionsStore[]> {
    try {
      const db = await this.ensureDb();
      if (!db) return [];
      return db.user_reflections_store
        .where("[surah_id+ayah_id]")
        .equals([surah_id, ayah_id])
        .toArray();
    } catch (err) {
      console.warn("[DatabaseManager] getReflections:", err);
      return [];
    }
  }

  async getReflectionById(id: string): Promise<ReflectionsStore | null> {
    try {
      const db = await this.ensureDb();
      if (!db) return null;
      return (await db.user_reflections_store.get(id)) ?? null;
    } catch (err) {
      console.warn("[DatabaseManager] getReflectionById:", err);
      return null;
    }
  }

  async upsertReflection(input: {
    surah_id: number;
    ayah_id: number;
    word_index?: number;
    note_text: string;
    bookmark_color?: string;
    tags?: string[];
    audio_memo_blob?: Blob;
    id?: string;
    sync_status?: ReflectionSyncStatus;
  }): Promise<ReflectionsStore | null> {
    try {
      const db = await this.ensureDb();
      if (!db) return null;
      const id = input.id ?? reflectionId(input.surah_id, input.ayah_id, input.word_index);
      const existing = await db.user_reflections_store.get(id);
      const now = Date.now();
      const row: ReflectionsStore = {
        id,
        surah_id: input.surah_id,
        ayah_id: input.ayah_id,
        word_index: input.word_index,
        note_text: input.note_text,
        bookmark_color: input.bookmark_color ?? existing?.bookmark_color,
        tags: input.tags ?? existing?.tags ?? [],
        created_at: existing?.created_at ?? now,
        sync_status: input.sync_status ?? "pending",
        audio_memo_blob: input.audio_memo_blob ?? existing?.audio_memo_blob,
        updated_at: now,
        last_opened_at: now,
        schema_version: 2,
      };
      await db.user_reflections_store.put(row);
      return row;
    } catch (err) {
      console.warn("[DatabaseManager] upsertReflection:", err);
      return null;
    }
  }

  async deleteReflection(id: string): Promise<boolean> {
    try {
      const db = await this.ensureDb();
      if (!db) return false;
      await db.user_reflections_store.delete(id);
      return true;
    } catch (err) {
      console.warn("[DatabaseManager] deleteReflection:", err);
      return false;
    }
  }

  async listPendingReflections(): Promise<ReflectionsStore[]> {
    try {
      const db = await this.ensureDb();
      if (!db) return [];
      return db.user_reflections_store.where("sync_status").equals("pending").toArray();
    } catch (err) {
      console.warn("[DatabaseManager] listPendingReflections:", err);
      return [];
    }
  }

  // ── OfflineAssetsStore CRUD ────────────────────────────────────────────

  async getAsset(asset_id: string): Promise<OfflineAssetsStore | null> {
    try {
      const db = await this.ensureDb();
      if (!db) return null;
      const row = (await db.offline_assets_store.get(asset_id)) ?? null;
      if (row) {
        // Fire-and-forget LRU touch
        void db.offline_assets_store
          .put({
            ...row,
            last_accessed_at: Date.now(),
            access_count: (row.access_count ?? 0) + 1,
          })
          .catch(() => undefined);
      }
      return row;
    } catch (err) {
      console.warn("[DatabaseManager] getAsset:", err);
      return null;
    }
  }

  async upsertAsset(
    input: Omit<OfflineAssetsStore, "download_status"> &
      Partial<Pick<OfflineAssetsStore, "download_status">>,
  ): Promise<OfflineAssetsStore | null> {
    try {
      const db = await this.ensureDb();
      if (!db) return null;
      const existing = await db.offline_assets_store.get(input.asset_id);
      const now = Date.now();
      const row: OfflineAssetsStore = {
        ...existing,
        ...input,
        download_status: input.download_status ?? existing?.download_status ?? "pending",
        size_bytes:
          input.size_bytes ??
          (input.file_reference instanceof Blob
            ? input.file_reference.size
            : existing?.size_bytes ?? 0),
        updated_at: now,
        last_accessed_at: input.last_accessed_at ?? existing?.last_accessed_at ?? now,
        access_count: input.access_count ?? existing?.access_count ?? 0,
        pinned: input.pinned ?? existing?.pinned ?? false,
      };
      await db.offline_assets_store.put(row);
      return row;
    } catch (err) {
      console.warn("[DatabaseManager] upsertAsset:", err);
      return null;
    }
  }

  async setAssetDownloadStatus(
    asset_id: string,
    download_status: OfflineAssetDownloadStatus,
    patch?: Partial<Pick<OfflineAssetsStore, "file_reference" | "size_bytes" | "content_hash">>,
  ): Promise<OfflineAssetsStore | null> {
    try {
      const existing = await this.getAsset(asset_id);
      if (!existing) return null;
      return this.upsertAsset({ ...existing, download_status, ...patch });
    } catch (err) {
      console.warn("[DatabaseManager] setAssetDownloadStatus:", err);
      return null;
    }
  }

  async pinAsset(asset_id: string, pinned: boolean): Promise<boolean> {
    try {
      const db = await this.ensureDb();
      if (!db) return false;
      const row = await db.offline_assets_store.get(asset_id);
      if (!row) return false;
      await db.offline_assets_store.put({ ...row, pinned, updated_at: Date.now() });
      return true;
    } catch (err) {
      console.warn("[DatabaseManager] pinAsset:", err);
      return false;
    }
  }

  async registerSurahAudio(opts: {
    reciterId: string;
    surahId: number;
    status: OfflineAssetDownloadStatus;
    file_reference?: Blob | string;
    size_bytes?: number;
    pinned?: boolean;
  }): Promise<OfflineAssetsStore | null> {
    return this.upsertAsset({
      asset_id: `audio_surah:${opts.reciterId}:${opts.surahId}`,
      type: "audio_surah",
      reciter_id: opts.reciterId,
      surah_id: opts.surahId,
      download_status: opts.status,
      file_reference: opts.file_reference,
      size_bytes:
        opts.size_bytes ??
        (opts.file_reference instanceof Blob ? opts.file_reference.size : 0),
      pinned: opts.pinned ?? false,
    });
  }

  async listAssetsByType(type: OfflineAssetType): Promise<OfflineAssetsStore[]> {
    try {
      const db = await this.ensureDb();
      if (!db) return [];
      return db.offline_assets_store.where("type").equals(type).toArray();
    } catch (err) {
      console.warn("[DatabaseManager] listAssetsByType:", err);
      return [];
    }
  }

  async deleteAsset(asset_id: string): Promise<boolean> {
    try {
      const db = await this.ensureDb();
      if (!db) return false;
      await db.offline_assets_store.delete(asset_id);
      return true;
    } catch (err) {
      console.warn("[DatabaseManager] deleteAsset:", err);
      return false;
    }
  }

  async totalAssetBytes(): Promise<number> {
    try {
      const db = await this.ensureDb();
      if (!db) return 0;
      const rows = await db.offline_assets_store
        .where("download_status")
        .equals("completed")
        .toArray();
      return rows.reduce((sum, r) => sum + (r.size_bytes || 0), 0);
    } catch (err) {
      console.warn("[DatabaseManager] totalAssetBytes:", err);
      return 0;
    }
  }

  // ── Knowledge helpers (same DB; used by QuranEngineContext) ────────────

  async getKnowledge(surah: number, ayah: number): Promise<KnowledgeRow | null> {
    try {
      const db = await this.ensureDb();
      if (!db) return null;
      const key = `${surah}:${ayah}`;
      const row = (await db.quran_knowledge_store.get(key)) ?? null;
      if (row) {
        void db.quran_knowledge_store
          .put({
            ...row,
            last_accessed_at: Date.now(),
            access_count: (row.access_count ?? 0) + 1,
          })
          .catch(() => undefined);
      }
      return row;
    } catch (err) {
      console.warn("[DatabaseManager] getKnowledge:", err);
      return null;
    }
  }

  async getSimilarKeys(surah: number, ayah: number): Promise<string[]> {
    const row = await this.getKnowledge(surah, ayah);
    return row?.similar_ayah_keys ?? [];
  }

  async putKnowledgeBatch(
    rows: Array<Omit<KnowledgeRow, "updated_at"> & { updated_at?: number }>,
  ): Promise<number> {
    try {
      const db = await this.ensureDb();
      if (!db || rows.length === 0) return 0;
      const ts = Date.now();
      const prepared: KnowledgeRow[] = rows.map((r) => ({
        ayah_key: r.ayah_key,
        similar_ayah_keys: r.similar_ayah_keys ?? [],
        theme_ids: r.theme_ids ?? [],
        updated_at: r.updated_at ?? ts,
        last_accessed_at: r.last_accessed_at ?? ts,
        access_count: r.access_count ?? 0,
      }));
      await db.quran_knowledge_store.bulkPut(prepared);
      return prepared.length;
    } catch (err) {
      console.warn("[DatabaseManager] putKnowledgeBatch:", err);
      return 0;
    }
  }

  /**
   * Flatten mutashabihat via IndexingService (Web Worker) then bulkPut.
   */
  async warmKnowledgeFromMutashabihat(
    index: Record<string, Array<{ surah: number; ayah: number }>>,
    themes: Record<string, string[]> = {},
  ): Promise<number> {
    try {
      await this.initialize();
      const { getIndexingService } = await import("@/core/quran/IndexingService");
      const rows = await getIndexingService().flattenMutashabihatIndex(index, themes);
      if (!rows.length) return 0;
      return this.putKnowledgeBatch(rows);
    } catch (err) {
      console.warn("[DatabaseManager] warmKnowledgeFromMutashabihat:", err);
      return 0;
    }
  }

  /** Structured result helper for callers that prefer Result types. */
  async safeUpsertKhatmah(
    input: Parameters<DatabaseManager["upsertKhatmah"]>[0],
  ): Promise<CrudResult<KhatmahStore>> {
    const data = await this.upsertKhatmah(input);
    return data ? ok(data) : fail("upsert-khatmah-failed");
  }
}

/** Preferred accessor — same singleton as `DatabaseManager.getInstance()`. */
export function getDatabaseManager(): DatabaseManager {
  return DatabaseManager.getInstance();
}
