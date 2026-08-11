/**
 * Hybrid search: lexical (local unified index) + optional semantic/API boost.
 * Caches successful online responses in IndexedDB for offline reuse.
 */
import { normalizeArabic } from "@/shared/arabic-normalize";
import { idbGetValue, idbPut, isOnline, OFFLINE_STORES } from "@/lib/offline-db";
import type { AppSearchResult, AppSearchResponse } from "@/features/search/app-search";
import { kindPriority } from "@/features/search/kind-priority";

const CACHE_PREFIX = "search_embed_cache:";
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 80;

export type HybridSearchSource = "lexical" | "hybrid" | "cache";

export type HybridSearchMeta = {
  source: HybridSearchSource;
  semanticHits: number;
  cached: boolean;
};

type CacheRow = {
  q: string;
  at: number;
  results: AppSearchResult[];
};

function cacheKey(norm: string): string {
  return `${CACHE_PREFIX}${norm.slice(0, 120)}`;
}

export async function readCachedHybridResults(query: string): Promise<AppSearchResult[] | null> {
  const norm = normalizeArabic(query);
  if (!norm || norm.length < 2) return null;
  try {
    const row = await idbGetValue<CacheRow>(OFFLINE_STORES.meta, cacheKey(norm));
    if (!row?.results?.length) return null;
    if (Date.now() - row.at > CACHE_TTL_MS) return null;
    return row.results;
  } catch {
    return null;
  }
}

export async function writeCachedHybridResults(query: string, results: AppSearchResult[]): Promise<void> {
  const norm = normalizeArabic(query);
  if (!norm || results.length === 0) return;
  try {
    await idbPut(
      OFFLINE_STORES.meta,
      cacheKey(norm),
      { q: norm, at: Date.now(), results: results.slice(0, 48) } satisfies CacheRow,
      String(Date.now()),
    );
  } catch {
    /* ignore */
  }
}

type ApiHit = {
  id?: string;
  kind?: string;
  type?: string;
  title?: string;
  titleAr?: string;
  href?: string;
  url?: string;
  summary?: string;
  snippet?: string;
  meta?: string;
};

function mapApiHit(h: ApiHit): AppSearchResult | null {
  const href = h.href || h.url;
  const title = h.titleAr || h.title;
  if (!href || !title) return null;
  return {
    id: String(h.id || href),
    kind: String(h.kind || h.type || "app"),
    title,
    href,
    summary: h.summary || h.snippet || h.meta,
  };
}

/** Fetch semantic/intelligent layer; returns [] on failure (non-blocking). */
export async function fetchSemanticHits(
  query: string,
  opts: { limit?: number; signal?: AbortSignal } = {},
): Promise<AppSearchResult[]> {
  if (!isOnline()) return [];
  const limit = opts.limit ?? 24;
  try {
    const url = `/api/intelligent-search?q=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url, {
      method: "GET",
      signal: opts.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      results?: ApiHit[];
      items?: ApiHit[];
      hits?: ApiHit[];
      ok?: boolean;
    };
    const raw = data.results || data.items || data.hits || [];
    return raw.map(mapApiHit).filter((x): x is AppSearchResult => Boolean(x));
  } catch {
    return [];
  }
}

/** Merge lexical + semantic: semantic boosts matching hrefs and prepends novel hits. */
export function mergeHybridResults(
  lexical: AppSearchResult[],
  semantic: AppSearchResult[],
  limit = 48,
): { results: AppSearchResult[]; semanticHits: number } {
  const byHref = new Map<string, AppSearchResult>();
  for (const r of lexical) byHref.set(r.href, r);

  let semanticHits = 0;
  const boosted: AppSearchResult[] = [];
  for (const s of semantic) {
    semanticHits += 1;
    const existing = byHref.get(s.href);
    if (existing) {
      boosted.push({
        ...existing,
        summary: existing.summary || s.summary,
        match: existing.match
          ? { ...existing.match, rank: 0 as const }
          : { kind: "substring", rank: 0, distance: 0, matchedNorm: "" },
      });
      byHref.delete(s.href);
    } else {
      boosted.push({
        ...s,
        match: { kind: "substring", rank: 1, distance: 0, matchedNorm: "" },
      });
    }
  }

  const rest = [...byHref.values()];
  rest.sort((a, b) => {
    const ra = a.match?.rank ?? 9;
    const rb = b.match?.rank ?? 9;
    if (ra !== rb) return ra - rb;
    return kindPriority(a.kind) - kindPriority(b.kind);
  });

  const merged = [...boosted, ...rest].slice(0, limit);
  return { results: merged, semanticHits };
}

export function attachGroups(results: AppSearchResult[]): Pick<AppSearchResponse, "groups" | "counts"> {
  const groups: Record<string, AppSearchResult[]> = {};
  const counts: Record<string, number> = {};
  for (const r of results) {
    (groups[r.kind] ??= []).push(r);
    counts[r.kind] = (counts[r.kind] ?? 0) + 1;
  }
  return { groups, counts };
}

/** Best-effort prune of old embed caches (call occasionally). */
export async function pruneHybridSearchCache(): Promise<void> {
  try {
    const { idbGetAll, idbDelete } = await import("@/lib/offline-db");
    const rows = await idbGetAll<{ q: string; at: number }>(OFFLINE_STORES.meta);
    const caches = rows
      .filter((r) => r.key.startsWith(CACHE_PREFIX) && r.value)
      .map((r) => ({ key: r.key, at: (r.value as CacheRow).at || 0 }))
      .sort((a, b) => b.at - a.at);
    const stale = caches.filter((c) => Date.now() - c.at > CACHE_TTL_MS);
    const overflow = caches.slice(MAX_CACHE_ENTRIES);
    for (const c of [...stale, ...overflow]) {
      await idbDelete(OFFLINE_STORES.meta, c.key);
    }
  } catch {
    /* ignore */
  }
}
