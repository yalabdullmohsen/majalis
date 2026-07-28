/**
 * تنزيل تلاوة السور كاملة لكل قارئ على حدة، للاستماع دون اتصال — تخزين
 * محلي عبر IndexedDB (Blob لكل سورة)، بلا أي مكتبة خارجية. مصدر الملفات
 * mp3quran.net عبر getSurahAudioUrl() الموجودة أصلًا في quran-audio.ts —
 * نفس المصدر الموثوق المستخدم للتشغيل الحي، لا جهة جديدة.
 *
 * هذا مسار مستقل عن useAyahPlayer (تشغيل آية-بآية عبر everyayah.com):
 * ملفات mp3quran.net كاملة السورة بلا طوابع توقيت لكل آية، فلا يمكن ربطها
 * بتظليل آية واحدة أثناء التشغيل — الاستماع دون اتصال هنا يعني تشغيل
 * السورة كاملة (getOfflineSurahUrl)، لا خطوة آية-بآية.
 *
 * Part 17: HTTP Range byte-chunking with resume from exact offset.
 */
import { RECITERS, getSurahAudioUrl } from "@/lib/quran-audio";
import {
  downloadResumable,
  type PartialAssetStore,
} from "@/lib/resumable-range-download";
import { markJourneyStart, endJourney } from "@/lib/journey-perf";

const DB_NAME = "majalis-quran-audio";
const DB_VERSION = 2;
const STORE = "surah-audio";
const PARTIAL_STORE = "surah-audio-partial";
const TOTAL_SURAHS = 114;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE); // key: `${reciterId}:${surahNum}`
      }
      if (!db.objectStoreNames.contains(PARTIAL_STORE)) {
        db.createObjectStore(PARTIAL_STORE); // key: same — ArrayBuffer partials
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function keyFor(reciterId: string, surah: number): string {
  return `${reciterId}:${surah}`;
}

async function putBlob(reciterId: string, surah: number, blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, keyFor(reciterId, surah));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function getBlob(reciterId: string, surah: number): Promise<Blob | null> {
  const db = await openDb();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(keyFor(reciterId, surah));
    req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob;
}

async function deleteBlob(reciterId: string, surah: number): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE, PARTIAL_STORE], "readwrite");
    tx.objectStore(STORE).delete(keyFor(reciterId, surah));
    tx.objectStore(PARTIAL_STORE).delete(keyFor(reciterId, surah));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

function createPartialStore(): PartialAssetStore {
  return {
    async getPartial(assetKey: string): Promise<Uint8Array | null> {
      try {
        const db = await openDb();
        const val = await new Promise<ArrayBuffer | Uint8Array | null>((resolve, reject) => {
          const tx = db.transaction(PARTIAL_STORE, "readonly");
          const req = tx.objectStore(PARTIAL_STORE).get(assetKey);
          req.onsuccess = () => resolve((req.result as ArrayBuffer | Uint8Array | undefined) ?? null);
          req.onerror = () => reject(req.error);
        });
        db.close();
        if (!val) return null;
        return val instanceof Uint8Array ? val : new Uint8Array(val);
      } catch {
        return null;
      }
    },
    async putPartial(assetKey: string, bytes: Uint8Array): Promise<void> {
      try {
        const db = await openDb();
        const copy = bytes.slice();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(PARTIAL_STORE, "readwrite");
          tx.objectStore(PARTIAL_STORE).put(copy, assetKey);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        db.close();
      } catch {
        /* ignore partial checkpoint failures */
      }
    },
    async clearPartial(assetKey: string): Promise<void> {
      try {
        const db = await openDb();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(PARTIAL_STORE, "readwrite");
          tx.objectStore(PARTIAL_STORE).delete(assetKey);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        db.close();
      } catch {
        /* ignore */
      }
    },
  };
}

async function listKeysForReciter(reciterId: string): Promise<{ surah: number; size: number }[]> {
  const db = await openDb();
  const result = await new Promise<{ surah: number; size: number }[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const out: { surah: number; size: number }[] = [];
    const cursorReq = store.openCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (!cursor) { resolve(out); return; }
      const key = String(cursor.key);
      if (key.startsWith(`${reciterId}:`)) {
        const surah = Number(key.split(":")[1]);
        const blob = cursor.value as Blob;
        out.push({ surah, size: blob.size });
      }
      cursor.continue();
    };
    cursorReq.onerror = () => reject(cursorReq.error);
  });
  db.close();
  return result;
}

export type ReciterDownloadStatus = {
  reciterId: string;
  downloadedSurahs: number;
  totalSurahs: number;
  totalBytes: number;
  complete: boolean;
};

export async function getReciterDownloadStatus(reciterId: string): Promise<ReciterDownloadStatus> {
  try {
    const entries = await listKeysForReciter(reciterId);
    const totalBytes = entries.reduce((sum, e) => sum + e.size, 0);
    return {
      reciterId,
      downloadedSurahs: entries.length,
      totalSurahs: TOTAL_SURAHS,
      totalBytes,
      complete: entries.length === TOTAL_SURAHS,
    };
  } catch {
    return { reciterId, downloadedSurahs: 0, totalSurahs: TOTAL_SURAHS, totalBytes: 0, complete: false };
  }
}

export async function getAllDownloadStatuses(): Promise<ReciterDownloadStatus[]> {
  return Promise.all(RECITERS.map((r) => getReciterDownloadStatus(r.id)));
}

export type DownloadProgress = { surah: number; done: number; total: number };

/** يحمّل السور 1..114 تسلسليًا مع استئناف Range لكل سورة. */
export async function downloadReciter(
  reciterId: string,
  onProgress: (p: DownloadProgress) => void,
  isCancelled: () => boolean,
): Promise<void> {
  markJourneyStart("offline-sync");
  const existing = new Set((await listKeysForReciter(reciterId)).map((e) => e.surah));
  const partialStore = createPartialStore();

  for (let surah = 1; surah <= TOTAL_SURAHS; surah++) {
    if (isCancelled()) {
      endJourney("offline-sync");
      return;
    }
    if (!existing.has(surah)) {
      const url = getSurahAudioUrl(surah, reciterId);
      const assetKey = keyFor(reciterId, surah);
      try {
        const blob = await downloadResumable(url, assetKey, partialStore, {
          isCancelled,
          chunkSize: 512 * 1024,
        });
        if (isCancelled()) {
          endJourney("offline-sync");
          return;
        }
        await putBlob(reciterId, surah, blob);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError" || isCancelled()) {
          endJourney("offline-sync");
          return;
        }
        throw new Error(`فشل تنزيل السورة ${surah}: ${String((err as Error)?.message || err)}`);
      }
    }
    onProgress({ surah, done: surah, total: TOTAL_SURAHS });
  }
  endJourney("offline-sync");
}

export async function deleteReciterDownloads(reciterId: string): Promise<void> {
  const entries = await listKeysForReciter(reciterId);
  await Promise.all(entries.map((e) => deleteBlob(reciterId, e.surah)));
}

/** رابط تشغيل محلي (Object URL) للسورة إن كانت مُنزَّلة، وإلا null. */
export async function getOfflineSurahUrl(reciterId: string, surah: number): Promise<string | null> {
  const blob = await getBlob(reciterId, surah);
  return blob ? URL.createObjectURL(blob) : null;
}

export async function estimateStorageUsage(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (!navigator.storage?.estimate) return null;
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return { usage, quota };
  } catch {
    return null;
  }
}
