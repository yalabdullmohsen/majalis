/**
 * محمّل JSON كسول لبذور المحتوى الثقيلة تحت /public/data.
 * في المتصفح: fetch. في Node (اختبارات/prerender): قراءة من القرص.
 */
import { pooledFetch } from "@/lib/fetch-pool";

export type SeedManifest = {
  version: number;
  total: number;
  generatedAt?: string;
  chunks: { file: string; count: number; key?: string }[];
};

type CacheEntry<T> = {
  all: T[] | null;
  byKey: Map<string, T[]>;
  loadingAll: Promise<T[]> | null;
  loadingKeys: Map<string, Promise<T[]>>;
  manifest: SeedManifest | null;
  loadingManifest: Promise<SeedManifest> | null;
};

const caches = new Map<string, CacheEntry<unknown>>();

function getCache<T>(basePath: string): CacheEntry<T> {
  let entry = caches.get(basePath) as CacheEntry<T> | undefined;
  if (!entry) {
    entry = {
      all: null,
      byKey: new Map(),
      loadingAll: null,
      loadingKeys: new Map(),
      manifest: null,
      loadingManifest: null,
    };
    caches.set(basePath, entry as CacheEntry<unknown>);
  }
  return entry;
}

async function readJsonFromDisk(urlPath: string): Promise<unknown | null> {
  if (typeof window !== "undefined") return null;
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const candidates = [
      path.resolve(process.cwd(), "public" + urlPath),
      path.resolve(process.cwd(), "artifacts/majalis/public" + urlPath),
    ];
    for (const file of candidates) {
      try {
        const raw = await fs.readFile(file, "utf8");
        return JSON.parse(raw) as unknown;
      } catch {
        /* try next */
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function loadJson(urlPath: string): Promise<unknown> {
  const fromDisk = await readJsonFromDisk(urlPath);
  if (fromDisk != null) return fromDisk;

  if (typeof window === "undefined") {
    throw new Error(`ملف البذرة غير موجود على القرص: ${urlPath}`);
  }

  const res = await pooledFetch(urlPath, {
    dedupeKey: `seed-json:${urlPath}`,
    timeoutMs: 30_000,
  });
  if (!res.ok) throw new Error(`تعذّر تحميل ${urlPath} (${res.status})`);
  return res.json();
}

export async function loadSeedManifest(basePath: string): Promise<SeedManifest> {
  const cache = getCache(basePath);
  if (cache.manifest) return cache.manifest;
  if (cache.loadingManifest) return cache.loadingManifest;

  cache.loadingManifest = (async () => {
    const data = (await loadJson(`${basePath}/manifest.json`)) as SeedManifest;
    cache.manifest = data;
    cache.loadingManifest = null;
    return data;
  })().catch((err) => {
    cache.loadingManifest = null;
    throw err;
  });

  return cache.loadingManifest;
}

export async function loadAllSeedChunks<T>(basePath: string): Promise<T[]> {
  const cache = getCache<T>(basePath);
  if (cache.all) return cache.all;
  if (cache.loadingAll) return cache.loadingAll;

  cache.loadingAll = (async () => {
    const manifest = await loadSeedManifest(basePath);
    if (!manifest.chunks.length) {
      cache.all = [];
      return cache.all;
    }
    const parts = await Promise.all(
      manifest.chunks.map(async (c) => {
        const data = await loadJson(`${basePath}/${c.file}`);
        return Array.isArray(data) ? (data as T[]) : [];
      }),
    );
    cache.all = parts.flat();
    return cache.all;
  })().catch((err) => {
    cache.loadingAll = null;
    throw err;
  });

  return cache.loadingAll;
}

/** تحميل شرائح حسب المفتاح (تصنيف/قسم) — pagination منطقي دون سحب الكل. */
export async function loadSeedChunksByKey<T>(basePath: string, key: string): Promise<T[]> {
  const cache = getCache<T>(basePath);
  if (cache.byKey.has(key)) return cache.byKey.get(key)!;
  if (cache.loadingKeys.has(key)) return cache.loadingKeys.get(key)!;

  const promise = (async () => {
    const manifest = await loadSeedManifest(basePath);
    const matched = manifest.chunks.filter((c) => c.key === key);
    if (!matched.length) {
      cache.byKey.set(key, []);
      return [];
    }
    const parts = await Promise.all(
      matched.map(async (c) => {
        const data = await loadJson(`${basePath}/${c.file}`);
        return Array.isArray(data) ? (data as T[]) : [];
      }),
    );
    const flat = parts.flat();
    cache.byKey.set(key, flat);
    return flat;
  })().finally(() => {
    cache.loadingKeys.delete(key);
  });

  cache.loadingKeys.set(key, promise);
  return promise;
}

export function invalidateSeedCache(basePath?: string) {
  if (basePath) caches.delete(basePath);
  else caches.clear();
}

/** لقطة متزامنة من الذاكرة فقط (بعد loadAllSeedChunks) — لا قراءة قرص. */
export function peekSeedCache<T>(basePath: string): T[] | null {
  return (getCache<T>(basePath).all as T[] | null) ?? null;
}
