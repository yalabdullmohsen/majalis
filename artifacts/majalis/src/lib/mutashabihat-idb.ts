/**
 * كاش IndexedDB لفهرس المتشابهات — تحميل مرة ثم وصول فوري دون شبكة.
 */
import {
  loadMutashabihatIndex,
  getSimilarAyahs,
  type MutashabihMatch,
} from "@/lib/recitation-ai/mutashabihat";

const DB_NAME = "majalis-mutashabihat";
const DB_VERSION = 1;
const STORE = "index";
const KEY = "v1";

type IndexRaw = Record<string, MutashabihMatch[]>;

let memory: IndexRaw | null = null;
let inflight: Promise<IndexRaw> | null = null;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(): Promise<IndexRaw | null> {
  try {
    const db = await openDb();
    const row = await new Promise<IndexRaw | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as IndexRaw | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return row;
  } catch {
    return null;
  }
}

async function idbPut(data: IndexRaw): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(data, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* quota */
  }
}

/** يحمّل الفهرس من الذاكرة → IDB → الشبكة، ويُدفئ IDB في الخلفية. */
export async function loadMutashabihatIndexCached(): Promise<IndexRaw> {
  if (memory) return memory;
  if (inflight) return inflight;
  inflight = (async () => {
    const fromIdb = await idbGet();
    if (fromIdb) {
      memory = fromIdb;
      return fromIdb;
    }
    const fresh = await loadMutashabihatIndex();
    memory = fresh;
    void idbPut(fresh);
    return fresh;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

export async function getSimilarAyahsCached(
  surah: number,
  ayah: number,
): Promise<MutashabihMatch[]> {
  const index = await loadMutashabihatIndexCached();
  return getSimilarAyahs(index, surah, ayah);
}

export function hasMutashabihatInMemory(surah: number, ayah: number): boolean {
  if (!memory) return false;
  return (memory[`${surah}:${ayah}`]?.length ?? 0) > 0;
}

export type { MutashabihMatch };
