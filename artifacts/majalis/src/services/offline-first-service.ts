/**
 * Offline-First Architecture & Storage Engine (Module 1 facade).
 * Dexie offline packs + delta sync + LRU eviction + encrypted vault notes.
 */

import { OFFLINE_STORES, isOnline, type OfflineStoreName } from "@/lib/offline-db";
import {
  cacheAdhkarPack,
  cacheArticle,
  cacheQuranSurah,
  cacheQuranSurahList,
  getCachedAdhkarPack,
  getCachedArticle,
  getCachedQuranSurah,
  getCachedQuranSurahList,
  withOfflineFallback,
  type OfflineArticle,
} from "@/lib/offline-content-store";
import { runDeltaSync, loadDeltaSyncState } from "@/lib/delta-content-sync";
import {
  evictLruCache,
  inspectStorage,
  maybeAutoEvictStorage,
  touchCacheAccess,
  type EvictionResult,
  type StorageInspectorReport,
} from "@/lib/smart-cache-eviction";
import {
  upsertAnnotation,
  queryKnowledgeVault,
  type PersonalAnnotation,
  type VaultQuery,
} from "@/lib/personal-knowledge-vault";
import {
  decryptAesGcm,
  encryptAesGcm,
  isAesGcmAvailable,
  isEncryptedBlob,
  type AesGcmEncryptedBlob,
} from "@/utils/aes-gcm-crypto";
import type { SurahDetail, SurahSummary } from "@/lib/quran-api";
import type { AdhkarItem } from "@/lib/adhkar-seed";

export type OfflineFirstStatus = {
  online: boolean;
  lastDeltaSyncAt: string | null;
  aesAvailable: boolean;
};

export type EncryptedAnnotation = Omit<PersonalAnnotation, "body"> & {
  body: string;
  encrypted?: boolean;
  cipher?: AesGcmEncryptedBlob;
};

const ENC_MARKER = "ENC:AESGCM:";

export function getOfflineFirstStatus(): OfflineFirstStatus {
  let lastDeltaSyncAt: string | null = null;
  try {
    lastDeltaSyncAt = loadDeltaSyncState().lastSyncAt || null;
  } catch {
    /* ignore */
  }
  return {
    online: isOnline(),
    lastDeltaSyncAt,
    aesAvailable: isAesGcmAvailable(),
  };
}

/** Cache core packs on first successful fetch. */
export async function warmCoreOfflinePacks(opts: {
  surahList?: SurahSummary[];
  surah?: SurahDetail;
  adhkar?: AdhkarItem[];
  article?: OfflineArticle;
}): Promise<void> {
  try {
    if (opts.surahList) await cacheQuranSurahList(opts.surahList);
    if (opts.surah) await cacheQuranSurah(opts.surah);
    if (opts.adhkar) await cacheAdhkarPack(opts.adhkar);
    if (opts.article) await cacheArticle(opts.article);
  } catch {
    /* silent */
  }
}

export async function readOfflineSurah(n: number): Promise<SurahDetail | null> {
  touchCacheAccess(`idb:quran/surah-${n}`);
  return getCachedQuranSurah(n);
}

export async function readOfflineSurahList(): Promise<SurahSummary[] | null> {
  return getCachedQuranSurahList();
}

export async function readOfflineAdhkar(): Promise<AdhkarItem[] | null> {
  return getCachedAdhkarPack();
}

export async function fetchWithOfflineFallback<T>(options: {
  fetchOnline: () => Promise<T>;
  readCache: () => Promise<T | null>;
  writeCache?: (value: T) => Promise<void>;
}): Promise<{ data: T | null; fromCache: boolean }> {
  return withOfflineFallback(options);
}

export async function syncOfflineDeltas(): Promise<void> {
  if (!isOnline()) return;
  try {
    await runDeltaSync();
  } catch {
    /* silent */
  }
}

export async function runSmartEviction(force = false): Promise<EvictionResult> {
  if (force) return evictLruCache({ force: true });
  return (await maybeAutoEvictStorage()) || { removed: [], freedApproxBytes: 0, skippedProtected: [] };
}

export async function inspectOfflineStorage(): Promise<StorageInspectorReport> {
  return inspectStorage();
}

/**
 * Upsert a vault note; optionally encrypt body with passphrase via AES-GCM
 * before IndexedDB/LS write. Cipher stored as JSON string prefixed marker.
 */
export async function upsertEncryptedNote(
  input: {
    kind: PersonalAnnotation["kind"];
    targetId: string;
    body: string;
    title?: string;
    tags?: string[];
    id?: string;
  },
  passphrase?: string,
): Promise<PersonalAnnotation> {
  let body = input.body;
  const tags = [...(input.tags || [])];
  if (passphrase && isAesGcmAvailable()) {
    const blob = await encryptAesGcm(input.body, passphrase);
    if (blob) {
      body = ENC_MARKER + JSON.stringify(blob);
      if (!tags.includes("encrypted")) tags.push("encrypted");
    }
  }
  return upsertAnnotation({
    id: input.id,
    kind: input.kind,
    targetId: input.targetId,
    title: input.title,
    body,
    tags,
  });
}

/** Decrypt note body if encrypted; otherwise return plaintext body. */
export async function readNoteBody(
  annotation: PersonalAnnotation,
  passphrase?: string,
): Promise<{ body: string; encrypted: boolean; ok: boolean }> {
  if (!annotation.body.startsWith(ENC_MARKER)) {
    return { body: annotation.body, encrypted: false, ok: true };
  }
  if (!passphrase) return { body: "", encrypted: true, ok: false };
  try {
    const raw = annotation.body.slice(ENC_MARKER.length);
    const blob = JSON.parse(raw) as AesGcmEncryptedBlob;
    if (!isEncryptedBlob(blob)) return { body: "", encrypted: true, ok: false };
    const pt = await decryptAesGcm(blob, passphrase);
    return { body: pt || "", encrypted: true, ok: Boolean(pt) };
  } catch {
    return { body: "", encrypted: true, ok: false };
  }
}

export async function queryVault(q?: VaultQuery): Promise<PersonalAnnotation[]> {
  return queryKnowledgeVault(q);
}

export { OFFLINE_STORES };
export type { OfflineStoreName, OfflineArticle, PersonalAnnotation, VaultQuery };
