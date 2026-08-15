/**
 * تنزيل اختياري لمقاطع التفسير الصوتي — IndexedDB بسقف ٨٠ ميغابايت.
 * لا يُنزَّل شيء ما لم يكن المقطع مفعّلاً ومرخّصاً في الكتالوج.
 */
import {
  getTafsirDownloadCapBytes,
  type TafsirAudioClip,
} from "@/lib/quran-data/tafsir-audio";

const DB_NAME = "majalis-tafsir-audio";
const DB_VERSION = 1;
const STORE = "clips";

export type TafsirOfflineMeta = {
  clipId: string;
  bytes: number;
  savedAt: number;
  titleAr: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function totalBytes(): Promise<number> {
  const list = await listOfflineTafsirClips();
  return list.reduce((s, r) => s + r.bytes, 0);
}

export async function listOfflineTafsirClips(): Promise<TafsirOfflineMeta[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    const db = await openDb();
    const rows = await new Promise<TafsirOfflineMeta[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        const vals = (req.result as Array<{ meta?: TafsirOfflineMeta; blob?: Blob }>) ?? [];
        resolve(
          vals
            .map((v) => v.meta)
            .filter((m): m is TafsirOfflineMeta => Boolean(m?.clipId)),
        );
      };
      req.onerror = () => reject(req.error);
    });
    db.close();
    return rows;
  } catch {
    return [];
  }
}

export async function getOfflineTafsirUsage(): Promise<{ used: number; cap: number }> {
  return { used: await totalBytes(), cap: getTafsirDownloadCapBytes() };
}

export async function getOfflineTafsirObjectUrl(clipId: string): Promise<string | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openDb();
    const row = await new Promise<{ blob?: Blob } | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(clipId);
      req.onsuccess = () => resolve(req.result as { blob?: Blob } | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!row?.blob) return null;
    return URL.createObjectURL(row.blob);
  } catch {
    return null;
  }
}

export async function downloadTafsirClipOffline(
  clip: TafsirAudioClip,
): Promise<{ ok: boolean; reason?: string }> {
  if (!clip.enabled || !clip.streamUrl) {
    return { ok: false, reason: "المقطع غير مفعّل" };
  }
  if (typeof indexedDB === "undefined" || typeof fetch === "undefined") {
    return { ok: false, reason: "التخزين المحلي غير متاح" };
  }
  const cap = getTafsirDownloadCapBytes();
  const used = await totalBytes();
  const estimate = clip.bytesEstimate ?? 0;
  if (estimate > 0 && used + estimate > cap) {
    return { ok: false, reason: `تجاوز سقف التخزين (${Math.round(cap / (1024 * 1024))} ميغابايت)` };
  }
  try {
    const res = await fetch(clip.streamUrl, { credentials: "omit" });
    if (!res.ok) return { ok: false, reason: `فشل التنزيل (${res.status})` };
    const blob = await res.blob();
    if (used + blob.size > cap) {
      return { ok: false, reason: `تجاوز سقف التخزين (${Math.round(cap / (1024 * 1024))} ميغابايت)` };
    }
    const meta: TafsirOfflineMeta = {
      clipId: clip.id,
      bytes: blob.size,
      savedAt: Date.now(),
      titleAr: clip.titleAr,
    };
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ meta, blob }, clip.id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return { ok: true };
  } catch {
    return { ok: false, reason: "تعذّر حفظ المقطع" };
  }
}

export async function deleteOfflineTafsirClip(clipId: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(clipId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}

export async function clearAllOfflineTafsirClips(): Promise<void> {
  const list = await listOfflineTafsirClips();
  for (const row of list) {
    await deleteOfflineTafsirClip(row.clipId);
  }
}
