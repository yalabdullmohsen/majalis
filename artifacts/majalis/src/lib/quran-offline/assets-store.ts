/**
 * Data-access layer for `offline_assets_store` — audio / tafseer / font lifecycle.
 */
import { getQuranOfflineDb } from "@/lib/quran-offline/db";
import type {
  OfflineAssetDownloadStatus,
  OfflineAssetRecord,
  OfflineAssetType,
} from "@/lib/quran-offline/types";

export function makeAudioSurahAssetId(reciterId: string, surahId: number): string {
  return `audio_surah:${reciterId}:${surahId}`;
}

export function makeAyahAudioAssetId(
  reciterId: string,
  surahId: number,
  ayahId: number,
): string {
  return `ayah_audio:${reciterId}:${surahId}:${ayahId}`;
}

export function makeFontCacheAssetId(fontFamily: string): string {
  return `font_cache:${fontFamily}`;
}

export function makeTafseerAssetId(edition: string): string {
  return `tafseer_db:${edition}`;
}

export async function getAsset(asset_id: string): Promise<OfflineAssetRecord | null> {
  const db = getQuranOfflineDb();
  if (!db) return null;
  return (await db.offline_assets_store.get(asset_id)) ?? null;
}

export async function listAssetsByType(type: OfflineAssetType): Promise<OfflineAssetRecord[]> {
  const db = getQuranOfflineDb();
  if (!db) return [];
  return db.offline_assets_store.where("type").equals(type).toArray();
}

export async function listCompletedAssetsForReciter(
  reciterId: string,
): Promise<OfflineAssetRecord[]> {
  const db = getQuranOfflineDb();
  if (!db) return [];
  const rows = await db.offline_assets_store
    .where("[type+reciter_id]")
    .equals(["audio_surah", reciterId])
    .toArray();
  return rows.filter((r) => r.download_status === "completed");
}

export async function upsertAsset(
  input: Omit<OfflineAssetRecord, "updated_at"> & { updated_at?: number },
): Promise<OfflineAssetRecord | null> {
  const db = getQuranOfflineDb();
  if (!db) return null;
  const row: OfflineAssetRecord = {
    ...input,
    updated_at: input.updated_at ?? Date.now(),
  };
  await db.offline_assets_store.put(row);
  return row;
}

export async function setAssetDownloadStatus(
  asset_id: string,
  download_status: OfflineAssetDownloadStatus,
  patch?: Partial<Pick<OfflineAssetRecord, "file_reference" | "size_bytes" | "content_hash">>,
): Promise<OfflineAssetRecord | null> {
  const existing = await getAsset(asset_id);
  if (!existing) return null;
  return upsertAsset({
    ...existing,
    download_status,
    ...patch,
  });
}

export async function registerSurahAudioAsset(opts: {
  reciterId: string;
  surahId: number;
  status: OfflineAssetDownloadStatus;
  file_reference?: Blob | string;
  size_bytes?: number;
}): Promise<OfflineAssetRecord | null> {
  return upsertAsset({
    asset_id: makeAudioSurahAssetId(opts.reciterId, opts.surahId),
    type: "audio_surah",
    reciter_id: opts.reciterId,
    surah_id: opts.surahId,
    download_status: opts.status,
    file_reference: opts.file_reference,
    size_bytes: opts.size_bytes ?? (opts.file_reference instanceof Blob ? opts.file_reference.size : 0),
  });
}

export async function totalCompletedAssetBytes(): Promise<number> {
  const db = getQuranOfflineDb();
  if (!db) return 0;
  const rows = await db.offline_assets_store
    .where("download_status")
    .equals("completed")
    .toArray();
  return rows.reduce((sum, r) => sum + (r.size_bytes || 0), 0);
}

export async function deleteAsset(asset_id: string): Promise<boolean> {
  const db = getQuranOfflineDb();
  if (!db) return false;
  await db.offline_assets_store.delete(asset_id);
  return true;
}
