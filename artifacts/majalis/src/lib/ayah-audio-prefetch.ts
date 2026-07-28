/**
 * تخزين مؤقت لصوت الآيات (IndexedDB) — prefetch غير حاجب للآيات التالية.
 * مكمّل لتنزيل السورة الكاملة في quran-audio-downloads.ts.
 */
import { getAyahAudioUrl } from "@/lib/quran-audio";
import { isQuranPrefetchSuspended } from "@/lib/quran-offline/lifecycle-flags";

const DB_NAME = "majalis-ayah-audio-cache";
const DB_VERSION = 1;
const STORE = "ayah-mp3";
/** سقف بسيط لتفادي نمو غير محدود على الجهاز. */
const MAX_ENTRIES = 240;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("byAt", "at");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function cacheKey(reciterId: string, surah: number, ayah: number): string {
  return `${reciterId}:${surah}:${ayah}`;
}

type CacheRow = { id: string; blob: Blob; at: number; reciterId: string; surah: number; ayah: number };

async function putEntry(row: CacheRow): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(row);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function getEntry(id: string): Promise<CacheRow | null> {
  const db = await openDb();
  const row = await new Promise<CacheRow | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as CacheRow | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return row;
}

async function trimOldest(): Promise<void> {
  const db = await openDb();
  try {
    const all: CacheRow[] = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result as CacheRow[]) ?? []);
      req.onerror = () => reject(req.error);
    });
    if (all.length <= MAX_ENTRIES) return;
    all.sort((a, b) => a.at - b.at);
    const drop = all.slice(0, all.length - MAX_ENTRIES);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      for (const row of drop) tx.objectStore(STORE).delete(row.id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

const inflight = new Map<string, Promise<void>>();
const objectUrlCache = new Map<string, string>();

/** نظرة فورية على الكاش في الذاكرة (بدون await) — لمسار اللمس المتزامن. */
export function peekCachedAyahObjectUrl(
  surah: number,
  ayah: number,
  reciterId: string,
): string | null {
  return objectUrlCache.get(cacheKey(reciterId, surah, ayah)) ?? null;
}

export async function cacheAyahAudio(
  surah: number,
  ayah: number,
  reciterId: string,
): Promise<void> {
  const id = cacheKey(reciterId, surah, ayah);
  if (inflight.has(id)) return inflight.get(id)!;
  const existing = await getEntry(id);
  if (existing) return;

  const run = (async () => {
    try {
      const res = await fetch(getAyahAudioUrl(surah, ayah, reciterId), { mode: "cors", credentials: "omit" });
      if (!res.ok) return;
      const blob = await res.blob();
      if (!blob.size) return;
      await putEntry({ id, blob, at: Date.now(), reciterId, surah, ayah });
      if (Math.random() < 0.08) void trimOldest();
    } catch {
      /* شبكة ضعيفة — لا نكسر التشغيل */
    } finally {
      inflight.delete(id);
    }
  })();
  inflight.set(id, run);
  return run;
}

/** يجهّز حتى `count` آيات تالية في الخلفية (غير حاجب). */
export function prefetchNextAyahs(
  surah: number,
  fromAyah: number,
  totalAyahs: number,
  reciterId: string,
  count = 5,
): void {
  // Resource lifecycle: suspend non-essential prefetch under memory pressure
  if (isQuranPrefetchSuspended()) return;
  const tasks: Promise<void>[] = [];
  for (let i = 1; i <= count; i++) {
    const ayah = fromAyah + i;
    if (ayah > totalAyahs) break;
    tasks.push(cacheAyahAudio(surah, ayah, reciterId));
  }
  // fire-and-forget — لا await على المسار الحرج
  void Promise.allSettled(tasks);
}

/** يعيد Object URL من الكاش إن وُجد، وإلا رابط CDN. */
export async function resolveAyahAudioSrc(
  surah: number,
  ayah: number,
  reciterId: string,
): Promise<string> {
  const id = cacheKey(reciterId, surah, ayah);
  const cachedUrl = objectUrlCache.get(id);
  if (cachedUrl) return cachedUrl;

  try {
      const row = await getEntry(id);
      if (row?.blob) {
        const url = URL.createObjectURL(row.blob);
        objectUrlCache.set(id, url);
        return url;
      }
    } catch {
      /* fall through */
    }
  return getAyahAudioUrl(surah, ayah, reciterId);
}

/** يحمّل من IDB إلى objectUrlCache بصمت لاستخدام peek لاحقًا. */
export function warmAyahObjectUrl(
  surah: number,
  ayah: number,
  reciterId: string,
): void {
  const id = cacheKey(reciterId, surah, ayah);
  if (objectUrlCache.has(id)) return;
  void (async () => {
    try {
      let row = await getEntry(id);
      if (!row) {
        await cacheAyahAudio(surah, ayah, reciterId);
        row = await getEntry(id);
      }
      if (row?.blob && !objectUrlCache.has(id)) {
        objectUrlCache.set(id, URL.createObjectURL(row.blob));
      }
    } catch {
      /* ignore */
    }
  })();
}

export function releaseAyahObjectUrls(): void {
  for (const url of objectUrlCache.values()) {
    try { URL.revokeObjectURL(url); } catch { /* ignore */ }
  }
  objectUrlCache.clear();
}
