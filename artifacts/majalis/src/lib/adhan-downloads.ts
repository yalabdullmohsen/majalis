/**
 * تنزيل اختياري لنسخ الأذان الكاملة — جهاز فقط، بسقف حجم واضح.
 * يُحذف مع حذف الحساب عبر clearUserLocalDataAndMedia.
 */

import { getMuezzin, listSelectableMuezzins } from "./adhan-audio";

export const ADHAN_FULL_DOWNLOAD_CAP_BYTES = 80 * 1024 * 1024; // 80 MiB
const CACHE_NAME = "majalis-adhan-full-v1";
const META_KEY = "majalis-adhan-full-meta-v1";

export type AdhanDownloadMeta = {
  /** bytes تقديرية/فعلية */
  totalBytes: number;
  urls: string[];
  updatedAt: number;
};

function readMeta(): AdhanDownloadMeta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return { totalBytes: 0, urls: [], updatedAt: 0 };
    return JSON.parse(raw) as AdhanDownloadMeta;
  } catch {
    return { totalBytes: 0, urls: [], updatedAt: 0 };
  }
}

function writeMeta(meta: AdhanDownloadMeta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

export function getAdhanDownloadUsage(): AdhanDownloadMeta {
  return readMeta();
}

export function formatAdhanDownloadCap(): string {
  return `${Math.round(ADHAN_FULL_DOWNLOAD_CAP_BYTES / (1024 * 1024))} ميغابايت`;
}

async function openCache(): Promise<Cache | null> {
  if (typeof caches === "undefined") return null;
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

/** يحذف كل تنزيلات الأذان الكامل */
export async function clearAdhanFullDownloads(): Promise<void> {
  try {
    if (typeof caches !== "undefined") await caches.delete(CACHE_NAME);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(META_KEY);
  } catch {
    /* ignore */
  }
}

function collectFullUrls(muezzinId?: string): string[] {
  const list = muezzinId
    ? [getMuezzin(muezzinId)].filter((m) => m.audioAvailable)
    : listSelectableMuezzins();
  const urls = new Set<string>();
  for (const m of list) {
    if (m.audioUrl) urls.add(m.audioUrl);
    if (m.fajrUrl) urls.add(m.fajrUrl);
  }
  return [...urls];
}

/**
 * ينزّل نسخًا كاملة للمؤذن (أو الكل) مع احترام السقف.
 * يعيد عدد البايتات المضافة أو خطأ السقف.
 */
export async function downloadAdhanFullClips(opts?: {
  muezzinId?: string;
}): Promise<{ ok: boolean; addedBytes: number; reason?: string }> {
  const cache = await openCache();
  if (!cache) return { ok: false, addedBytes: 0, reason: "cache_unavailable" };

  const meta = readMeta();
  const urls = collectFullUrls(opts?.muezzinId);
  let added = 0;

  for (const url of urls) {
    if (meta.urls.includes(url)) continue;
    if (meta.totalBytes + added >= ADHAN_FULL_DOWNLOAD_CAP_BYTES) {
      writeMeta({ ...meta, totalBytes: meta.totalBytes + added, updatedAt: Date.now() });
      return { ok: false, addedBytes: added, reason: "cap_reached" };
    }
    try {
      const res = await fetch(url, { mode: "cors", credentials: "omit" });
      if (!res.ok) continue;
      const buf = await res.clone().arrayBuffer();
      const size = buf.byteLength;
      if (meta.totalBytes + added + size > ADHAN_FULL_DOWNLOAD_CAP_BYTES) {
        writeMeta({
          ...meta,
          totalBytes: meta.totalBytes + added,
          urls: [...meta.urls],
          updatedAt: Date.now(),
        });
        return { ok: false, addedBytes: added, reason: "cap_reached" };
      }
      await cache.put(url, res);
      meta.urls.push(url);
      added += size;
    } catch {
      /* تخطَّ الملف الفاشل */
    }
  }

  writeMeta({
    totalBytes: meta.totalBytes + added,
    urls: meta.urls,
    updatedAt: Date.now(),
  });
  return { ok: true, addedBytes: added };
}

/** يسترجع Blob من التخزين المحلي إن وُجد */
export async function getCachedAdhanUrl(remoteUrl: string): Promise<string | null> {
  const cache = await openCache();
  if (!cache) return null;
  try {
    const hit = await cache.match(remoteUrl);
    if (!hit) return null;
    const blob = await hit.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
