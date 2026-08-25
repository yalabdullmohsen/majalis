/**
 * كاش IndexedDB لملفات JSON الثابتة تحت /data/ —
 * مع الشبكة: يفضّل الجلب الحي (no-store) ثم يحدّث الكاش.
 * بدون شبكة: يعيد آخر نسخة محفوظة إن وُجدت.
 */
import { idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";
import { pooledFetch, type PooledFetchInit } from "@/lib/fetch-pool";

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

type CacheRow<T> = { t: number; v: T };

function cacheKey(url: string): string {
  return `static-json:${url}`;
}

function isDataUrl(url: string): boolean {
  return url.startsWith("/data/") || url.includes("/data/");
}

function isLikelyOnline(): boolean {
  try {
    return typeof navigator === "undefined" || navigator.onLine !== false;
  } catch {
    return true;
  }
}

/** جلب JSON — شبكة أولًا عند الاتصال، ثم IndexedDB كـ fallback أوفلاين. */
export async function fetchStaticJsonCached<T>(
  url: string,
  fallback: T,
  init?: PooledFetchInit,
): Promise<T> {
  const key = cacheKey(url);
  let cached: CacheRow<T> | null = null;
  if (isDataUrl(url)) {
    try {
      cached = await idbGetValue<CacheRow<T>>(OFFLINE_STORES.meta, key);
    } catch {
      cached = null;
    }
  }

  if (isLikelyOnline()) {
    try {
      const res = await pooledFetch(url, { ...init, cache: "no-store" });
      if (res.ok) {
        const v = (await res.json()) as T;
        if (isDataUrl(url)) {
          void idbPut(OFFLINE_STORES.meta, key, { t: Date.now(), v } satisfies CacheRow<T>).catch(
            () => undefined,
          );
        }
        return v;
      }
    } catch {
      /* fall through to cache */
    }
  }

  if (cached?.v != null && Date.now() - cached.t < TTL_MS) {
    if (isLikelyOnline()) void revalidate(url, key, init);
    return cached.v;
  }

  try {
    const res = await pooledFetch(url, { ...init, cache: "no-store" });
    if (!res.ok) return cached?.v ?? fallback;
    const v = (await res.json()) as T;
    if (isDataUrl(url)) {
      void idbPut(OFFLINE_STORES.meta, key, { t: Date.now(), v } satisfies CacheRow<T>).catch(() => undefined);
    }
    return v;
  } catch {
    return cached?.v ?? fallback;
  }
}

async function revalidate(url: string, key: string, init?: RequestInit): Promise<void> {
  try {
    const res = await pooledFetch(url, { ...init, cache: "no-store" });
    if (!res.ok) return;
    const v = await res.json();
    await idbPut(OFFLINE_STORES.meta, key, { t: Date.now(), v });
  } catch {
    /* ignore */
  }
}
