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
 */
import { RECITERS, getSurahAudioUrl } from "@/lib/quran-audio";

const DB_NAME = "majalis-quran-audio";
const DB_VERSION = 1;
const STORE = "surah-audio";
const TOTAL_SURAHS = 114;

/** سقف تخزين اختياري دون اتصال — لا تُحزَم ملفات صوت في حزمة التطبيق. */
export const MAX_OFFLINE_AUDIO_BYTES = 1.5 * 1024 * 1024 * 1024; // 1.5 GiB
/** أقصى عدد قرّاء مكتملين في التخزين المحلي في آن واحد. */
export const MAX_FULL_OFFLINE_RECITERS = 2;

export class OfflineAudioQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OfflineAudioQuotaError";
  }
}

async function totalOfflineBytes(): Promise<number> {
  const statuses = await getAllDownloadStatuses();
  return statuses.reduce((sum, s) => sum + s.totalBytes, 0);
}

async function completeOfflineReciterCount(excluding?: string): Promise<number> {
  const statuses = await getAllDownloadStatuses();
  return statuses.filter((s) => s.complete && s.reciterId !== excluding).length;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE); // key: `${reciterId}:${surahNum}`
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
  const { withIdbRecovery } = await import("@/lib/idb-self-heal");
  const { logDiagnostic } = await import("@/lib/diagnostics");
  await withIdbRecovery(async () => {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, keyFor(reciterId, surah));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, {
    onHeal: (reason) => logDiagnostic("idb-heal", reason, { reciterId, surah }),
  });
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
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(keyFor(reciterId, surah));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function listKeysForReciter(reciterId: string): Promise<{ surah: number; size: number }[]> {
  const db = await openDb();
  const out: { surah: number; size: number }[] = [];
  try {
    const { streamObjectStoreCursor } = await import("@/lib/idb-cursor-stream");
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    await streamObjectStoreCursor<Blob>(store, (item) => {
      const key = String(item.key);
      if (!key.startsWith(`${reciterId}:`)) return;
      const surah = Number(key.split(":")[1]);
      if (!Number.isFinite(surah)) return;
      out.push({ surah, size: item.value?.size ?? 0 });
    });
  } catch {
    /* empty */
  } finally {
    db.close();
  }
  return out;
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

/** يحمّل السور 1..114 تسلسليًا (لا تزامنًا — يتفادى إغراق الشبكة/الذاكرة على الجوال)، يتخطى ما هو محمَّل مسبقًا. */
export async function downloadReciter(
  reciterId: string,
  onProgress: (p: DownloadProgress) => void,
  isCancelled: () => boolean,
): Promise<void> {
  const status = await getReciterDownloadStatus(reciterId);
  if (!status.complete) {
    const othersComplete = await completeOfflineReciterCount(reciterId);
    if (othersComplete >= MAX_FULL_OFFLINE_RECITERS) {
      throw new OfflineAudioQuotaError(
        `الحد الأقصى ${MAX_FULL_OFFLINE_RECITERS} قرّاء كاملين دون اتصال. احذف تنزيلاً أولاً.`,
      );
    }
  }

  const existing = new Set((await listKeysForReciter(reciterId)).map((e) => e.surah));
  for (let surah = 1; surah <= TOTAL_SURAHS; surah++) {
    if (isCancelled()) return;
    if (!existing.has(surah)) {
      const used = await totalOfflineBytes();
      if (used >= MAX_OFFLINE_AUDIO_BYTES) {
        throw new OfflineAudioQuotaError(
          "تجاوز سقف التخزين المحلي للتلاوات (١٫٥ غيغابايت). احذف تنزيلاً أولاً.",
        );
      }
      const res = await fetch(getSurahAudioUrl(surah, reciterId));
      if (!res.ok) throw new Error(`فشل تنزيل السورة ${surah}: ${res.status}`);
      const blob = await res.blob();
      if (used + blob.size > MAX_OFFLINE_AUDIO_BYTES) {
        throw new OfflineAudioQuotaError(
          "تجاوز سقف التخزين المحلي للتلاوات (١٫٥ غيغابايت). احذف تنزيلاً أولاً.",
        );
      }
      if (isCancelled()) return;
      await putBlob(reciterId, surah, blob);
    }
    onProgress({ surah, done: surah, total: TOTAL_SURAHS });
  }
}

export async function deleteReciterDownloads(reciterId: string): Promise<void> {
  const entries = await listKeysForReciter(reciterId);
  await Promise.all(entries.map((e) => deleteBlob(reciterId, e.surah)));
}

/** يحذف قاعدة IndexedDB للتلاوات المحمّلة بالكامل (حذف حساب / مسح بيانات). */
export async function clearAllOfflineAudioDownloads(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

/** رابط تشغيل محلي (Object URL) للسورة إن كانت مُنزَّلة، وإلا null (يُستخدَم عندها الرابط الحي كالمعتاد). استدعِ URL.revokeObjectURL على النتيجة عند انتهاء الاستخدام. */
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
