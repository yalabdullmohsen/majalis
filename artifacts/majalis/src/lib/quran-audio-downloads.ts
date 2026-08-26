/**
 * تنزيل تلاوة السور كاملة لكل قارئ على حدة، للاستماع دون اتصال.
 * - iOS أصلي: Application Support عبر MajlisOfflineAudio (مُستثنى من iCloud)
 * - ويب/أندرويد: IndexedDB (Blob لكل سورة)
 *
 * مصدر الملفات mp3quran.net عبر getSurahAudioUrl().
 */
import { RECITERS, getSurahAudioUrl } from "@/lib/quran-audio";
import {
  blobToBase64,
  getNativeOfflineAudioPlugin,
  nativeOfflinePlaybackUrl,
} from "@/lib/native-offline-audio";

const DB_NAME = "majalis-quran-audio";
const DB_VERSION = 1;
const STORE = "surah-audio";
const TOTAL_SURAHS = 114;
export { TOTAL_SURAHS };

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

async function nativePluginReady() {
  const plugin = await getNativeOfflineAudioPlugin();
  return plugin;
}

async function putBlob(reciterId: string, surah: number, blob: Blob): Promise<void> {
  const native = await nativePluginReady();
  if (native) {
    const dataBase64 = await blobToBase64(blob);
    await native.writeSurah({ reciterId, surah, dataBase64 });
    return;
  }
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
  const native = await nativePluginReady();
  if (native) {
    const { url } = await native.getSurahPlaybackUrl({ reciterId, surah });
    if (!url) return null;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.blob();
    } catch {
      return null;
    }
  }
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
  const native = await nativePluginReady();
  if (native) {
    await native.deleteSurah({ reciterId, surah });
    return;
  }
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
  const native = await nativePluginReady();
  if (native) {
    const { surahs } = await native.listReciterSurahs({ reciterId });
    return surahs.map((s) => ({ surah: s.surah, size: s.bytes }));
  }
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

export type QuranDownloadStatus =
  | "idle"
  | "downloading"
  | "paused"
  | "completed"
  | "error";

export type DownloadProgress = {
  currentSurah: number;
  totalSurahs: number;
  percentage: number;
  downloadedMB: string;
  totalMB: string;
  status: QuranDownloadStatus;
  /** توافق مع الواجهة القديمة */
  surah: number;
  done: number;
  total: number;
};

export type DownloadControl = {
  isCancelled?: () => boolean;
  isPaused?: () => boolean;
};

type ActiveDownloadSession = {
  reciterId: string;
  paused: boolean;
  abort: AbortController | null;
};

let activeSession: ActiveDownloadSession | null = null;

function formatMb(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0.0";
  return (bytes / (1024 * 1024)).toFixed(1);
}

function normalizeControl(control?: (() => boolean) | DownloadControl): DownloadControl {
  if (typeof control === "function") {
    return { isCancelled: control };
  }
  return control ?? {};
}

function emitProgress(
  onProgress: (p: DownloadProgress) => void,
  opts: {
    currentSurah: number;
    doneSurahs: number;
    totalSurahs: number;
    sessionBytes: number;
    surahPartialBytes: number;
    surahTotalBytes: number | null;
    status: QuranDownloadStatus;
  },
): void {
  const { currentSurah, doneSurahs, totalSurahs, sessionBytes, surahPartialBytes, surahTotalBytes, status } =
    opts;
  const partialRatio =
    surahTotalBytes && surahTotalBytes > 0
      ? Math.min(1, surahPartialBytes / surahTotalBytes)
      : 0;
  const effectiveDone = doneSurahs + partialRatio;
  const percentage = Math.min(100, Math.round((effectiveDone / totalSurahs) * 100));
  const downloadedBytes = sessionBytes + surahPartialBytes;
  const estimatedTotal =
    doneSurahs > 0
      ? (downloadedBytes / Math.max(doneSurahs + partialRatio, 0.001)) * totalSurahs
      : surahTotalBytes
        ? surahTotalBytes * totalSurahs
        : downloadedBytes;

  onProgress({
    currentSurah,
    totalSurahs,
    percentage,
    downloadedMB: formatMb(downloadedBytes),
    totalMB: formatMb(estimatedTotal),
    status,
    surah: currentSurah,
    done: doneSurahs,
    total: totalSurahs,
  });
}

async function fetchSurahBlob(
  url: string,
  signal: AbortSignal,
  onBytes: (written: number, total: number | null) => void,
): Promise<Blob> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`فشل التنزيل: ${res.status}`);
  const total = Number(res.headers.get("content-length")) || null;
  const reader = res.body?.getReader();
  if (!reader) {
    const blob = await res.blob();
    onBytes(blob.size, blob.size);
    return blob;
  }
  const chunks: BlobPart[] = [];
  let written = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    written += value.byteLength;
    onBytes(written, total);
  }
  return new Blob(chunks);
}

/** إيقاف التنزيل الجاري — يُستأنف لاحقًا من آخر سورة مكتملة. */
export function pauseReciterDownload(): void {
  if (!activeSession) return;
  activeSession.paused = true;
  activeSession.abort?.abort();
}

/** إلغاء التنزيل (لا يُحذف ما نُزّل). */
export function cancelReciterDownload(): void {
  if (!activeSession) return;
  activeSession.paused = false;
  activeSession.abort?.abort();
  activeSession = null;
}

export function getPausedReciterId(): string | null {
  return activeSession?.paused ? activeSession.reciterId : null;
}

export function isReciterDownloadActive(reciterId: string): boolean {
  return activeSession?.reciterId === reciterId && !activeSession.paused;
}

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


/** يحمّل السور 1..114 تسلسليًا — يتخطى المحمّل، يدعم إيقاف/استئناف. */
export async function downloadReciter(
  reciterId: string,
  onProgress: (p: DownloadProgress) => void,
  control?: (() => boolean) | DownloadControl,
): Promise<"completed" | "paused" | "cancelled"> {
  const { isCancelled, isPaused } = normalizeControl(control);
  activeSession = { reciterId, paused: false, abort: null };

  const status = await getReciterDownloadStatus(reciterId);
  if (!status.complete) {
    const othersComplete = await completeOfflineReciterCount(reciterId);
    if (othersComplete >= MAX_FULL_OFFLINE_RECITERS) {
      activeSession = null;
      throw new OfflineAudioQuotaError(
        `الحد الأقصى ${MAX_FULL_OFFLINE_RECITERS} قرّاء كاملين دون اتصال. احذف تنزيلاً أولاً.`,
      );
    }
  }

  const existing = new Set((await listKeysForReciter(reciterId)).map((e) => e.surah));
  let sessionBytes = (await getReciterDownloadStatus(reciterId)).totalBytes;

  try {
    for (let surah = 1; surah <= TOTAL_SURAHS; surah++) {
      if (isCancelled?.()) {
        activeSession = null;
        return "cancelled";
      }
      if (isPaused?.() || activeSession?.paused) {
        emitProgress(onProgress, {
          currentSurah: surah,
          doneSurahs: surah - 1,
          totalSurahs: TOTAL_SURAHS,
          sessionBytes,
          surahPartialBytes: 0,
          surahTotalBytes: null,
          status: "paused",
        });
        return "paused";
      }

      if (existing.has(surah)) {
        emitProgress(onProgress, {
          currentSurah: surah,
          doneSurahs: surah,
          totalSurahs: TOTAL_SURAHS,
          sessionBytes,
          surahPartialBytes: 0,
          surahTotalBytes: null,
          status: "downloading",
        });
        continue;
      }

      const used = await totalOfflineBytes();
      if (used >= MAX_OFFLINE_AUDIO_BYTES) {
        throw new OfflineAudioQuotaError(
          "تجاوز سقف التخزين المحلي للتلاوات (١٫٥ غيغابايت). احذف تنزيلاً أولاً.",
        );
      }

      const abort = new AbortController();
      if (activeSession) activeSession.abort = abort;

      let surahTotal: number | null = null;

      const blob = await fetchSurahBlob(
        getSurahAudioUrl(surah, reciterId),
        abort.signal,
        (written, total) => {
          surahTotal = total;
          emitProgress(onProgress, {
            currentSurah: surah,
            doneSurahs: surah - 1,
            totalSurahs: TOTAL_SURAHS,
            sessionBytes,
            surahPartialBytes: written,
            surahTotalBytes: total,
            status: "downloading",
          });
        },
      );

      if (isCancelled?.()) {
        activeSession = null;
        return "cancelled";
      }
      if (isPaused?.() || activeSession?.paused || abort.signal.aborted) {
        emitProgress(onProgress, {
          currentSurah: surah,
          doneSurahs: surah - 1,
          totalSurahs: TOTAL_SURAHS,
          sessionBytes,
          surahPartialBytes: 0,
          surahTotalBytes: null,
          status: "paused",
        });
        return "paused";
      }

      if (used + blob.size > MAX_OFFLINE_AUDIO_BYTES) {
        throw new OfflineAudioQuotaError(
          "تجاوز سقف التخزين المحلي للتلاوات (١٫٥ غيغابايت). احذف تنزيلاً أولاً.",
        );
      }

      await putBlob(reciterId, surah, blob);
      sessionBytes += blob.size;
      existing.add(surah);

      emitProgress(onProgress, {
        currentSurah: surah,
        doneSurahs: surah,
        totalSurahs: TOTAL_SURAHS,
        sessionBytes,
        surahPartialBytes: 0,
        surahTotalBytes: surahTotal,
        status: "downloading",
      });
    }

    emitProgress(onProgress, {
      currentSurah: TOTAL_SURAHS,
      doneSurahs: TOTAL_SURAHS,
      totalSurahs: TOTAL_SURAHS,
      sessionBytes,
      surahPartialBytes: 0,
      surahTotalBytes: null,
      status: "completed",
    });
    activeSession = null;
    return "completed";
  } catch (err) {
    activeSession = null;
    if (err instanceof OfflineAudioQuotaError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      return "paused";
    }
    emitProgress(onProgress, {
      currentSurah: 1,
      doneSurahs: 0,
      totalSurahs: TOTAL_SURAHS,
      sessionBytes,
      surahPartialBytes: 0,
      surahTotalBytes: null,
      status: "error",
    });
    throw err;
  }
}

export async function deleteReciterDownloads(reciterId: string): Promise<void> {
  const native = await nativePluginReady();
  if (native) {
    await native.deleteReciter({ reciterId });
    return;
  }
  const entries = await listKeysForReciter(reciterId);
  await Promise.all(entries.map((e) => deleteBlob(reciterId, e.surah)));
}

/** يحذف قاعدة IndexedDB للتلاوات المحمّلة بالكامل (حذف حساب / مسح بيانات). */
export async function clearAllOfflineAudioDownloads(): Promise<void> {
  const native = await nativePluginReady();
  if (native) {
    await Promise.all(RECITERS.map((r) => native.deleteReciter({ reciterId: r.id })));
  }
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

/** رابط تشغيل محلي — Object URL (IDB) أو convertFileSrc (iOS native). */
export async function getOfflineSurahUrl(reciterId: string, surah: number): Promise<string | null> {
  const native = await nativePluginReady();
  if (native) {
    const { url } = await native.getSurahPlaybackUrl({ reciterId, surah });
    if (!url) return null;
    return nativeOfflinePlaybackUrl(url);
  }
  const blob = await getBlob(reciterId, surah);
  return blob ? URL.createObjectURL(blob) : null;
}

export async function estimateStorageUsage(): Promise<{ usage: number; quota: number } | null> {
  try {
    const native = await nativePluginReady();
    let nativeBytes = 0;
    if (native) {
      const usage = await native.getStorageUsage();
      nativeBytes = usage.bytes ?? 0;
    }
    if (!navigator.storage?.estimate) {
      return nativeBytes > 0 ? { usage: nativeBytes, quota: MAX_OFFLINE_AUDIO_BYTES } : null;
    }
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return { usage: Math.max(usage, nativeBytes), quota: quota || MAX_OFFLINE_AUDIO_BYTES };
  } catch {
    return null;
  }
}
