/**
 * DatabaseManager — Dexie.js IndexedDB layer for the Quran Engine.
 *
 * Tables:
 *   settings      — user preferences (isTajweedEnabled, isActionBarEnabled, …)
 *   progress      — last reading position (single active row)
 *   bookmarks     — bookmarked ayahs + optional note
 *   tafseer_cache — offline tafsir snippets keyed by ayah + source
 *
 * Singleton · async-only · additive schema versioning · never throws into UI.
 */
import Dexie, { type EntityTable, type Table } from "dexie";

// ─── Record types ────────────────────────────────────────────────────────────

/** Key/value preference row. */
export type SettingsRecord = {
  key: string;
  value: unknown;
  updatedAt: number;
};

/** Well-known preference keys (extend as needed). */
export type KnownSettingKey =
  | "isTajweedEnabled"
  | "isActionBarEnabled"
  | "preferredReciterId"
  | "preferredTafseerSource";

/** Single-row reading progress (id is always ACTIVE_PROGRESS_ID). */
export type ReadingProgress = {
  id: string;
  lastSurah: number;
  lastAyah: number;
  lastPage: number;
  updatedAt: number;
};

export type BookmarkRecord = {
  id?: number;
  surahId: number;
  ayahId: number;
  /** Stable verse key `surah:ayah` for lookups. */
  verseKey: string;
  note?: string;
  createdAt: number;
};

export type TafseerCacheRecord = {
  /** Composite primary key: `${ayahId}::${source}` where ayahId is `surah:ayah`. */
  id: string;
  /** Verse key `surah:ayah`. */
  ayahId: string;
  source: string;
  content: string;
  updatedAt: number;
};

export type SaveProgressInput = {
  lastSurah: number;
  lastAyah: number;
  lastPage: number;
};

export type AddBookmarkInput = {
  surahId: number;
  ayahId: number;
  note?: string;
};

export const QURAN_APP_DB_NAME = "majalis-quran-app-db";
export const QURAN_APP_DB_VERSION = 1;
export const ACTIVE_PROGRESS_ID = "active-reading";

function verseKey(surahId: number, ayahId: number): string {
  return `${surahId}:${ayahId}`;
}

function tafseerCacheId(ayahId: string, source: string): string {
  return `${ayahId}::${source}`;
}

function clampSurah(n: number): number {
  return Math.min(114, Math.max(1, Math.floor(n) || 1));
}
function clampAyah(n: number): number {
  return Math.max(1, Math.floor(n) || 1);
}
function clampPage(n: number): number {
  return Math.min(604, Math.max(1, Math.floor(n) || 1));
}

// ─── Dexie database ──────────────────────────────────────────────────────────

export class QuranAppDatabase extends Dexie {
  settings!: Table<SettingsRecord, string>;
  progress!: EntityTable<ReadingProgress, "id">;
  bookmarks!: EntityTable<BookmarkRecord, "id">;
  tafseer_cache!: EntityTable<TafseerCacheRecord, "id">;

  constructor(name = QURAN_APP_DB_NAME) {
    super(name);

    /**
     * v1 — initial four-store layout.
     * Future versions must be additive (never drop user rows).
     */
    this.version(1).stores({
      settings: "key, updatedAt",
      progress: "id, updatedAt, lastSurah, lastPage",
      bookmarks: "++id, surahId, ayahId, verseKey, createdAt, [surahId+ayahId]",
      tafseer_cache: "id, ayahId, source, updatedAt, [ayahId+source]",
    });
  }
}

// ─── Manager ─────────────────────────────────────────────────────────────────

export class DatabaseManager {
  private static instance: DatabaseManager | null = null;

  private db: QuranAppDatabase | null = null;
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

  /** Test helper — close + drop singleton (does not delete IDB by itself). */
  static __resetInstanceForTests(): void {
    try {
      DatabaseManager.instance?.db?.close();
    } catch {
      /* ignore */
    }
    DatabaseManager.instance = null;
  }

  /** Open DB and apply migrations. Idempotent; safe if IndexedDB is unavailable. */
  async initialize(): Promise<boolean> {
    if (typeof indexedDB === "undefined") return false;
    if (this.db?.isOpen()) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const db = new QuranAppDatabase();
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
        if (!this.db) this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  getDb(): QuranAppDatabase | null {
    return this.db;
  }

  private async ensureDb(): Promise<QuranAppDatabase | null> {
    const ok = await this.initialize();
    return ok ? this.db : null;
  }

  // ── Settings ─────────────────────────────────────────────────────────────

  async getSetting<T = unknown>(key: KnownSettingKey | string): Promise<T | null> {
    try {
      const db = await this.ensureDb();
      if (!db) return null;
      const row = await db.settings.get(key);
      return row ? (row.value as T) : null;
    } catch (err) {
      console.warn("[DatabaseManager] getSetting:", err);
      return null;
    }
  }

  async setSetting(key: KnownSettingKey | string, value: unknown): Promise<boolean> {
    try {
      const db = await this.ensureDb();
      if (!db) return false;
      await db.settings.put({ key, value, updatedAt: Date.now() });
      return true;
    } catch (err) {
      console.warn("[DatabaseManager] setSetting:", err);
      return false;
    }
  }

  // ── Progress ─────────────────────────────────────────────────────────────

  /** Persist reading state (upserts the active progress row). */
  async saveProgress(data: SaveProgressInput): Promise<ReadingProgress | null> {
    try {
      const db = await this.ensureDb();
      if (!db) return null;
      const row: ReadingProgress = {
        id: ACTIVE_PROGRESS_ID,
        lastSurah: clampSurah(data.lastSurah),
        lastAyah: clampAyah(data.lastAyah),
        lastPage: clampPage(data.lastPage),
        updatedAt: Date.now(),
      };
      await db.progress.put(row);
      return row;
    } catch (err) {
      console.warn("[DatabaseManager] saveProgress:", err);
      return null;
    }
  }

  /** Retrieve last saved reading state (null when never saved / IDB down). */
  async getReadingProgress(): Promise<ReadingProgress | null> {
    try {
      const db = await this.ensureDb();
      if (!db) return null;
      return (await db.progress.get(ACTIVE_PROGRESS_ID)) ?? null;
    } catch (err) {
      console.warn("[DatabaseManager] getReadingProgress:", err);
      return null;
    }
  }

  // ── Bookmarks ────────────────────────────────────────────────────────────

  /** Store a bookmark (updates note if the same ayah already exists). */
  async addBookmark(ayahData: AddBookmarkInput): Promise<BookmarkRecord | null> {
    try {
      const db = await this.ensureDb();
      if (!db) return null;
      const surahId = clampSurah(ayahData.surahId);
      const ayahId = clampAyah(ayahData.ayahId);
      const key = verseKey(surahId, ayahId);

      const existing = await db.bookmarks.where("verseKey").equals(key).first();
      const row: BookmarkRecord = {
        id: existing?.id,
        surahId,
        ayahId,
        verseKey: key,
        note: ayahData.note ?? existing?.note,
        createdAt: existing?.createdAt ?? Date.now(),
      };
      const id = await db.bookmarks.put(row);
      return { ...row, id: typeof id === "number" ? id : row.id };
    } catch (err) {
      console.warn("[DatabaseManager] addBookmark:", err);
      return null;
    }
  }

  async listBookmarks(): Promise<BookmarkRecord[]> {
    try {
      const db = await this.ensureDb();
      if (!db) return [];
      return db.bookmarks.orderBy("createdAt").reverse().toArray();
    } catch (err) {
      console.warn("[DatabaseManager] listBookmarks:", err);
      return [];
    }
  }

  async removeBookmark(surahId: number, ayahId: number): Promise<boolean> {
    try {
      const db = await this.ensureDb();
      if (!db) return false;
      const key = verseKey(clampSurah(surahId), clampAyah(ayahId));
      await db.bookmarks.where("verseKey").equals(key).delete();
      return true;
    } catch (err) {
      console.warn("[DatabaseManager] removeBookmark:", err);
      return false;
    }
  }

  // ── Tafseer cache ────────────────────────────────────────────────────────

  /**
   * Return cached tafsir for an ayah.
   * @param ayahId verse key `surah:ayah` (e.g. `"2:255"`)
   * @param source optional edition id — when omitted, returns the newest cached row
   */
  async getCachedTafseer(
    ayahId: string,
    source?: string,
  ): Promise<TafseerCacheRecord | null> {
    try {
      const db = await this.ensureDb();
      if (!db) return null;
      if (source) {
        return (await db.tafseer_cache.get(tafseerCacheId(ayahId, source))) ?? null;
      }
      const rows = await db.tafseer_cache.where("ayahId").equals(ayahId).toArray();
      if (!rows.length) return null;
      return rows.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
    } catch (err) {
      console.warn("[DatabaseManager] getCachedTafseer:", err);
      return null;
    }
  }

  /** Upsert a tafsir snippet into the local cache. */
  async cacheTafseer(input: {
    ayahId: string;
    source: string;
    content: string;
  }): Promise<TafseerCacheRecord | null> {
    try {
      const db = await this.ensureDb();
      if (!db) return null;
      const row: TafseerCacheRecord = {
        id: tafseerCacheId(input.ayahId, input.source),
        ayahId: input.ayahId,
        source: input.source,
        content: input.content,
        updatedAt: Date.now(),
      };
      await db.tafseer_cache.put(row);
      return row;
    } catch (err) {
      console.warn("[DatabaseManager] cacheTafseer:", err);
      return null;
    }
  }
}

/** App-wide singleton — import this everywhere. */
export const databaseManager = DatabaseManager.getInstance();

/** Alias matching the Quran Engine façade naming. */
export function getDatabaseManager(): DatabaseManager {
  return databaseManager;
}

export default databaseManager;
