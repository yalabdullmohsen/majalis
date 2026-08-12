/**
 * Open Platform — content CRUD facade over Supabase tables + seeds.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { unifiedSearch, getTopicContent } from "../scholarly-intelligence/unified-search.mjs";
import { getAllTopics } from "../scholarly-intelligence/topics.mjs";
import { buildPayload, fetchAlAdhanTimings, kuwaitDateKey, kuwaitDateParam, payloadFromDbRow, KUWAIT_CITY, KUWAIT_GOVERNORATE } from "../prayer-times-core.mjs";
import { loadAdhkarFromSeed } from "./seeds.mjs";
import { OPEN_RESOURCES } from "./config.mjs";
import { normalizeItem, paginate, sortItems, filterItems } from "./adapter.mjs";
import { getCache, setCache } from "./cache.mjs";

export async function listResource(admin, resource, opts = {}) {
  const config = OPEN_RESOURCES[resource];
  if (!config) return { ok: false, error: "unknown_resource" };

  const cacheKey = `list:${resource}:${JSON.stringify(opts)}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  if (resource === "quran" || resource === "hadith") {
    const results = await unifiedSearch(admin, { query: resource === "quran" ? "قرآن" : "حديث", filters: { content_type: resource }, limit: opts.limit || 20 });
    const items = (results.results || []).map((r) => normalizeItem(resource, r, opts.version));
    const out = paginate(items, opts);
    setCache(cacheKey, { ok: true, ...out });
    return { ok: true, ...out };
  }

  if (resource === "adhkar" || resource === "dua") {
    const items = loadAdhkarFromSeed(resource).map((r) => normalizeItem(resource, r, opts.version));
    const filtered = filterItems(items, opts.filters);
    const sorted = sortItems(filtered, opts.sort, opts.order);
    const out = paginate(sorted, opts);
    setCache(cacheKey, { ok: true, ...out });
    return { ok: true, ...out };
  }

  if (resource === "prayer_times") {
    const todayKey = kuwaitDateKey();
    let payload;
    if (admin) {
      const { data: row } = await admin.from("prayer_times").select("*").eq("city", KUWAIT_CITY).eq("date", todayKey).maybeSingle();
      if (row) payload = payloadFromDbRow(row);
    }
    if (!payload) {
      const data = await fetchAlAdhanTimings(kuwaitDateParam()).catch(() => null);
      payload = data ? buildPayload(data.timings, data.meta, data.date) : { date: todayKey, city: KUWAIT_CITY };
    }
    const out = { ok: true, data: [normalizeItem("prayer_times", payload, opts.version)] };
    setCache(cacheKey, out);
    return out;
  }

  if (resource === "occasion" || resource === "calendar") {
    if (admin) {
      const { data } = await admin.from("islamic_occasions_cache").select("*").order("date", { ascending: true }).limit(opts.limit || 50);
      const items = (data || []).map((r) => normalizeItem(resource, r, opts.version));
      const out = paginate(items, opts);
      setCache(cacheKey, { ok: true, ...out });
      return { ok: true, ...out };
    }
    return { ok: true, data: [], pagination: { page: 1, limit: 20, total: 0 } };
  }

  if (!config.table || !admin) {
    return { ok: true, data: [], pagination: { page: 1, limit: 20, total: 0 } };
  }

  let query = admin.from(config.table).select("*", { count: "exact" });

  if (config.filter) {
    for (const [k, v] of Object.entries(config.filter)) {
      query = query.eq(k, v);
    }
  }

  if (opts.filters?.category) query = query.eq("category", opts.filters.category);
  if (opts.filters?.status) query = query.eq("status", opts.filters.status);

  const limit = Math.min(Number(opts.limit) || 20, 100);
  const page = Math.max(1, Number(opts.page) || 1);
  const offset = (page - 1) * limit;

  query = query.range(offset, offset + limit - 1);

  const sortField = opts.sort || "updated_at";
  query = query.order(sortField, { ascending: opts.order === "asc", nullsFirst: false });

  const { data, count, error } = await query;
  if (error) return { ok: false, error: error.message };

  const items = (data || []).map((r) => normalizeItem(resource, r, opts.version));
  const out = {
    ok: true,
    data: items,
    pagination: {
      page,
      limit,
      total: count || items.length,
      total_pages: Math.ceil((count || items.length) / limit),
      has_next: offset + limit < (count || 0),
      has_prev: page > 1,
    },
  };
  setCache(cacheKey, out);
  return out;
}

export async function getResourceItem(admin, resource, id, opts = {}) {
  const config = OPEN_RESOURCES[resource];
  if (!config) return { ok: false, error: "unknown_resource" };

  const cacheKey = `item:${resource}:${id}:${opts.version}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  if (resource === "adhkar" || resource === "dua") {
    const item = loadAdhkarFromSeed(resource).find((r) => r.id === id || r.slug === id);
    if (!item) return { ok: false, error: "not_found" };
    const out = { ok: true, data: normalizeItem(resource, item, opts.version) };
    setCache(cacheKey, out);
    return out;
  }

  if (!config.table || !admin) return { ok: false, error: "not_found" };

  const { data, error } = await admin.from(config.table).select("*").eq("id", id).maybeSingle();
  if (error || !data) {
    const { data: bySlug } = await admin.from(config.table).select("*").eq("slug", id).maybeSingle();
    if (!bySlug) return { ok: false, error: "not_found" };
    const out = { ok: true, data: normalizeItem(resource, bySlug, opts.version) };
    setCache(cacheKey, out);
    return out;
  }

  const out = { ok: true, data: normalizeItem(resource, data, opts.version) };
  setCache(cacheKey, out);
  return out;
}

export async function listTopics(admin) {
  return { ok: true, data: getAllTopics().map((t) => ({ slug: t.slug, title: t.title, title_en: t.title_en, category: t.category })) };
}

export async function getTopic(admin, slug, opts = {}) {
  const content = await getTopicContent(slug, { limit: opts.limit || 15 });
  return { ok: true, topic: content.topic, sections: content.sections };
}

export function listResources() {
  return {
    ok: true,
    data: Object.entries(OPEN_RESOURCES).map(([id, r]) => ({
      id,
      kind: r.kind,
      label: r.label,
      label_en: r.label_en,
    })),
  };
}
