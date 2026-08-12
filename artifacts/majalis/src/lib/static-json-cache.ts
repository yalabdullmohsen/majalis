/**
 * كاش IndexedDB لملفات JSON الثابتة تحت /data/ —
 * يقلّل round-trips عند التنقّل بين القصص/الفئات بعد أول جلب.
 */
import { idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";
import { pooledFetch } from "@/lib/fetch-pool";

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

type CacheRow<T> = { t: number; v: T };

function cacheKey(url: string): string {
  return `static-json:${url}`;
}

function isDataUrl(url: string): boolean {
  return url.startsWith("/data/") || url.includes("/data/");
}

/** جلب JSON مع قراءة فورية من IndexedDB وإعادة تحقق في الخلفية. */
export async function fetchStaticJsonCached<T>(
  url: string,
  fallback: T,
  init?: RequestInit,
): Promise<T> {
  const key = cacheKey(url);
  let cached: CacheRow<T> | null = null;
  if (isDataUrl(url)) {
    try {
      cached = await idbGetValue<CacheRow<T>>(OFFLINE_STORES.meta, key);
      if (cached?.v != null && Date.now() - cached.t < TTL_MS) {
        void revalidate(url, key, init);
        return cached.v;
      }
    } catch {
      /* ignore */
    }
  }

  try {
    const res = await pooledFetch(url, init);
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
    const res = await pooledFetch(url, init);
    if (!res.ok) return;
    const v = await res.json();
    await idbPut(OFFLINE_STORES.meta, key, { t: Date.now(), v });
  } catch {
    /* ignore */
  }
}
