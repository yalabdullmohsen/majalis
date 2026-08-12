/**
 * Open Platform — search API facade (text + semantic + filters).
 */

import { unifiedSearch } from "../scholarly-intelligence/unified-search.mjs";
import { searchKnowledgeAll } from "../scholarly-intelligence/semantic-search.mjs";
import { normalizeItem } from "./adapter.mjs";
import { getCache, setCache } from "./cache.mjs";
import { CACHE_TTL } from "./config.mjs";

export async function openSearch(admin, opts = {}) {
  const { q, query, mode = "text", filters = {}, page = 1, limit = 20, sort, order, version = "v1", user_id } = opts;
  const searchQuery = q || query;
  if (!searchQuery?.trim()) return { ok: false, error: "query_required" };

  const cacheKey = `search:${mode}:${searchQuery}:${JSON.stringify({ filters, page, limit, version })}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const started = Date.now();
  let results = [];

  if (mode === "semantic" || mode === "hybrid") {
    const semantic = await searchKnowledgeAll(admin, searchQuery, Number(limit) * 2);
    results = (semantic.results || semantic || []).map((r) => normalizeItem(r.kind || r.content_kind || "knowledge", r, version));
    if (mode === "hybrid") {
      const text = await unifiedSearch(admin, { query: searchQuery, filters, limit: Number(limit) * 2, user_id });
      results = [...results, ...(text.results || []).map((r) => normalizeItem(r.kind || r.content_kind, r, version))];
    }
  } else {
    const text = await unifiedSearch(admin, { query: searchQuery, filters, limit: Number(limit) * 3, user_id });
    results = (text.results || []).map((r) => normalizeItem(r.kind || r.content_kind, r, version));
  }

  if (filters.content_type || filters.type) {
    const types = filters.content_type || filters.type;
    const typeArr = Array.isArray(types) ? types : [types];
    results = results.filter((r) => typeArr.includes(r.kind) || typeArr.includes(r.resource));
  }

  if (sort) {
    const dir = order === "asc" ? 1 : -1;
    results.sort((a, b) => ((a[sort] || "") < (b[sort] || "") ? -dir : dir));
  }

  const total = results.length;
  const p = Math.max(1, Number(page));
  const l = Math.min(100, Math.max(1, Number(limit)));
  const offset = (p - 1) * l;
  const data = results.slice(offset, offset + l);

  const out = {
    ok: true,
    query: searchQuery,
    mode,
    data,
    meta: {
      total,
      page: p,
      limit: l,
      total_pages: Math.ceil(total / l),
      response_ms: Date.now() - started,
      has_semantic: mode === "semantic" || mode === "hybrid",
    },
    pagination: {
      page: p,
      limit: l,
      total,
      total_pages: Math.ceil(total / l),
      has_next: offset + l < total,
      has_prev: p > 1,
    },
  };

  setCache(cacheKey, out, CACHE_TTL.search);
  return out;
}
