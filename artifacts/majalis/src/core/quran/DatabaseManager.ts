/**
 * DatabaseManager — core Dexie façade for Khatmah, Reflections, OfflineAssets,
 * and knowledge cache. All methods are async (IndexedDB) and never block paint.
 *
 * Wraps `@/lib/quran-offline` without duplicating schema definitions.
 */
import {
  openQuranOfflineDb,
  getQuranOfflineDb,
  type QuranOfflineDatabase,
} from "@/lib/quran-offline/db";
import {
  listKhatmahProfiles,
  getKhatmahProfile,
  upsertKhatmahProfile,
  updateKhatmahProgress,
  type UpsertKhatmahInput,
} from "@/lib/quran-offline/khatmah-store";
import {
  getReflectionsForAyah,
  upsertReflection,
  type UpsertReflectionInput,
} from "@/lib/quran-offline/reflections-store";
import {
  getAsset,
  upsertAsset,
  setAssetPinned,
  registerSurahAudioAsset,
  totalCompletedAssetBytes,
} from "@/lib/quran-offline/assets-store";
import {
  getKnowledgeForAyah,
  putKnowledgeBatch,
  getSimilarAyahKeysCached,
} from "@/lib/quran-offline/knowledge-store";
import { migrateLegacyQuranOfflineData } from "@/lib/quran-offline/migrate-legacy";
import { runSilentSchemaMigrations } from "@/lib/quran-offline/schema-migrate";
import { getIndexingService } from "@/core/quran/IndexingService";
import type { KhatmahStoreRecord, OfflineAssetRecord, UserReflectionRecord } from "@/lib/quran-offline/types";

export class DatabaseManager {
  private ready: Promise<QuranOfflineDatabase | null> | null = null;

  /** Open Dexie + run silent migrations (idle-friendly). */
  async initialize(): Promise<boolean> {
    if (!this.ready) {
      this.ready = (async () => {
        const db = await openQuranOfflineDb();
        if (!db) return null;
        // Non-blocking: legacy + schema migrate on idle path
        void migrateLegacyQuranOfflineData().catch(() => undefined);
        void runSilentSchemaMigrations().catch(() => undefined);
        return db;
      })();
    }
    const db = await this.ready;
    return db != null;
  }

  getDb(): QuranOfflineDatabase | null {
    return getQuranOfflineDb();
  }

  // ── Khatmah ────────────────────────────────────────────────────────────

  listKhatmah(opts?: Parameters<typeof listKhatmahProfiles>[0]): Promise<KhatmahStoreRecord[]> {
    return listKhatmahProfiles(opts);
  }

  getKhatmah(id: string): Promise<KhatmahStoreRecord | null> {
    return getKhatmahProfile(id);
  }

  upsertKhatmah(input: UpsertKhatmahInput): Promise<KhatmahStoreRecord | null> {
    return upsertKhatmahProfile(input);
  }

  updateKhatmahProgress(
    id: string,
    patch: Parameters<typeof updateKhatmahProgress>[1],
  ): Promise<KhatmahStoreRecord | null> {
    return updateKhatmahProgress(id, patch);
  }

  // ── Reflections ────────────────────────────────────────────────────────

  getReflections(surahId: number, ayahId: number): Promise<UserReflectionRecord[]> {
    return getReflectionsForAyah(surahId, ayahId);
  }

  upsertReflection(input: UpsertReflectionInput): Promise<UserReflectionRecord | null> {
    return upsertReflection(input);
  }

  // ── Offline assets ─────────────────────────────────────────────────────

  getAsset(assetId: string): Promise<OfflineAssetRecord | null> {
    return getAsset(assetId);
  }

  upsertAsset(
    input: Parameters<typeof upsertAsset>[0],
  ): Promise<OfflineAssetRecord | null> {
    return upsertAsset(input);
  }

  pinAsset(assetId: string, pinned: boolean): Promise<boolean> {
    return setAssetPinned(assetId, pinned);
  }

  registerSurahAudio(
    opts: Parameters<typeof registerSurahAudioAsset>[0],
  ): Promise<OfflineAssetRecord | null> {
    return registerSurahAudioAsset(opts);
  }

  totalAssetBytes(): Promise<number> {
    return totalCompletedAssetBytes();
  }

  // ── Knowledge (worker-backed warm) ─────────────────────────────────────

  getKnowledge(surah: number, ayah: number) {
    return getKnowledgeForAyah(surah, ayah);
  }

  getSimilarKeys(surah: number, ayah: number): Promise<string[]> {
    return getSimilarAyahKeysCached(surah, ayah);
  }

  /**
   * Warm knowledge store from raw mutashabihat index via Web Worker flatten,
   * then async bulkPut (never blocks the reading session).
   */
  async warmKnowledgeFromMutashabihat(
    index: Record<string, Array<{ surah: number; ayah: number }>>,
    themes: Record<string, string[]> = {},
  ): Promise<number> {
    await this.initialize();
    const rows = await getIndexingService().flattenMutashabihatIndex(index, themes);
    if (!rows.length) return 0;
    return putKnowledgeBatch(rows);
  }
}

let dbSingleton: DatabaseManager | null = null;

export function getDatabaseManager(): DatabaseManager {
  if (!dbSingleton) dbSingleton = new DatabaseManager();
  return dbSingleton;
}
