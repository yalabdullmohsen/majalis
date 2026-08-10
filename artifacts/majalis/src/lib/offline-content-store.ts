/**
 * Offline-first content cache for Quran text, Adhkar, and article/book excerpts.
 * Network wins when online; IndexedDB is the graceful offline fallback (no error UI).
 */
import {
  idbGet,
  idbGetValue,
  idbPut,
  isOnline,
  OFFLINE_STORES,
  type LegacyOfflineRecord,
} from "@/lib/offline-db";
import type { SurahDetail, SurahSummary } from "@/lib/quran-api";
import type { AdhkarItem } from "@/lib/adhkar-seed";

export type OfflineArticle = {
  id: string;
  title: string;
  href: string;
  text: string;
  contentType: "fawaid" | "library" | "article" | "book";
};

const META_LAST_SYNC = "last-content-sync";
const QURAN_LIST_KEY = "surah-list";
const ADHKAR_PACK_KEY = "adhkar-pack-v1";

export async function cacheQuranSurahList(list: SurahSummary[], revision?: string): Promise<void> {
  await idbPut(OFFLINE_STORES.quran, QURAN_LIST_KEY, list, revision);
}

export async function getCachedQuranSurahList(): Promise<SurahSummary[] | null> {
  return idbGetValue<SurahSummary[]>(OFFLINE_STORES.quran, QURAN_LIST_KEY);
}

export async function cacheQuranSurah(detail: SurahDetail, revision?: string): Promise<void> {
  await idbPut(OFFLINE_STORES.quran, `surah-${detail.number}`, detail, revision);
}

export async function getCachedQuranSurah(surahNumber: number): Promise<SurahDetail | null> {
  return idbGetValue<SurahDetail>(OFFLINE_STORES.quran, `surah-${surahNumber}`);
}

export async function cacheAdhkarPack(items: AdhkarItem[], revision?: string): Promise<void> {
  // Cap payload — full seed is large; keep a practical offline subset.
  const trimmed: AdhkarItem[] = items.slice(0, 800).map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    text: item.text,
    count: item.count,
    narrator: item.narrator,
    source: item.source,
    grade: item.grade,
    reference: item.reference,
    keywords: item.keywords ?? [],
  }));
  await idbPut(OFFLINE_STORES.adhkar, ADHKAR_PACK_KEY, trimmed, revision);
}

export async function getCachedAdhkarPack(): Promise<AdhkarItem[] | null> {
  return idbGetValue<AdhkarItem[]>(OFFLINE_STORES.adhkar, ADHKAR_PACK_KEY);
}

export async function cacheArticle(article: OfflineArticle): Promise<void> {
  await idbPut(OFFLINE_STORES.articles, article.id, article);
}

export async function getCachedArticle(id: string): Promise<OfflineArticle | null> {
  return idbGetValue<OfflineArticle>(OFFLINE_STORES.articles, id);
}

export async function getLastContentSync(): Promise<LegacyOfflineRecord<string> | null> {
  return idbGet<string>(OFFLINE_STORES.meta, META_LAST_SYNC);
}

export async function markContentSynced(revision = new Date().toISOString()): Promise<void> {
  await idbPut(OFFLINE_STORES.meta, META_LAST_SYNC, revision, revision);
}

/**
 * Prefer network fetcher; on failure or offline, return IndexedDB value.
 * Never throws — callers get `null` only when both network and cache miss.
 */
export async function withOfflineFallback<T>(options: {
  fetchOnline: () => Promise<T>;
  readCache: () => Promise<T | null>;
  writeCache?: (value: T) => Promise<void>;
}): Promise<{ data: T | null; fromCache: boolean }> {
  if (isOnline()) {
    try {
      const data = await options.fetchOnline();
      if (options.writeCache) {
        try {
          await options.writeCache(data);
        } catch {
          /* cache write best-effort */
        }
      }
      return { data, fromCache: false };
    } catch {
      /* fall through to cache */
    }
  }

  try {
    const cached = await options.readCache();
    return { data: cached, fromCache: true };
  } catch {
    return { data: null, fromCache: true };
  }
}

/**
 * Offline-first: اقرأ IndexedDB أولًا؛ إن كان فارغًا اجلب من الشبكة واملأ الكاش.
 * عند وجود كاش واتصال: أعد الكاش فورًا وحدّث في الخلفية (SWR خفيف).
 */
export async function withOfflineFirst<T>(options: {
  fetchOnline: () => Promise<T>;
  readCache: () => Promise<T | null>;
  writeCache?: (value: T) => Promise<void>;
  /** إن true (افتراضي) يُحدَّث الكاش من الشبكة في الخلفية بعد إرجاع الكاش */
  revalidate?: boolean;
}): Promise<{ data: T | null; fromCache: boolean }> {
  const revalidate = options.revalidate !== false;

  let cached: T | null;
  try {
    cached = await options.readCache();
  } catch {
    cached = null;
  }

  if (cached != null) {
    if (revalidate && isOnline()) {
      void (async () => {
        try {
          const fresh = await options.fetchOnline();
          if (options.writeCache) await options.writeCache(fresh);
        } catch {
          /* background refresh best-effort */
        }
      })();
    }
    return { data: cached, fromCache: true };
  }

  if (!isOnline()) {
    return { data: null, fromCache: true };
  }

  try {
    const data = await options.fetchOnline();
    if (options.writeCache) {
      try {
        await options.writeCache(data);
      } catch {
        /* ignore */
      }
    }
    return { data, fromCache: false };
  } catch {
    return { data: null, fromCache: false };
  }
}
