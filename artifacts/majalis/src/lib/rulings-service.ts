import type { CategoryStat, RulingListOptions, RulingListResult, ShariaRulingExtended } from "./rulings-types";
import { arabicMatchAny } from "./arabic-search";
import { supabase, isSupabaseConfigured } from "./supabase";
import { logSupabaseError } from "./supabase-config";
import { dedupeRulings } from "./rulings-validator";
import {
  loadAllRulingsFromChunks,
  loadRulingsManifest,
  RULINGS_ENCYCLOPEDIA_SEED,
  RULINGS_ENCYCLOPEDIA_TOTAL,
} from "./rulings-data-loader";
import { findRulingById as findLegacyRulingById, RULINGS_SEED } from "./rulings-seed";

const isConfigured = isSupabaseConfigured();
let cachedSeed: ShariaRulingExtended[] | null = null;
let cachePromise: Promise<ShariaRulingExtended[]> | null = null;

async function getSeedPool(): Promise<ShariaRulingExtended[]> {
  if (cachedSeed) return cachedSeed;
  if (!cachePromise) {
    cachePromise = loadAllRulingsFromChunks()
      .then((items) => {
        cachedSeed = items.length > 0 ? items : dedupeRulings([...RULINGS_ENCYCLOPEDIA_SEED, ...RULINGS_SEED] as ShariaRulingExtended[]);
        return cachedSeed;
      })
      .catch(() => {
        cachedSeed = dedupeRulings([...RULINGS_ENCYCLOPEDIA_SEED, ...RULINGS_SEED] as ShariaRulingExtended[]);
        return cachedSeed;
      });
  }
  return cachePromise;
}

function filterSeed(items: ShariaRulingExtended[], opts?: RulingListOptions): ShariaRulingExtended[] {
  let result = items.filter((r) => r.status !== "draft" && r.verification_status !== "rejected");
  if (opts?.category && opts.category !== "الكل") {
    result = result.filter((r) => r.category === opts.category);
  }
  if (opts?.subcategory) {
    result = result.filter((r) => r.subcategory === opts.subcategory);
  }
  if (opts?.search?.trim()) {
    const q = opts.search.trim();
    result = result.filter((r) =>
      arabicMatchAny(
        [
          r.title,
          r.summary ?? "",
          r.body,
          r.category,
          r.subcategory ?? "",
          r.prevailing_view ?? "",
          r.hadith_grade ?? "",
          ...(r.keywords ?? []),
          ...(r.subcategories ?? []),
          JSON.stringify(r.evidence ?? []),
          JSON.stringify(r.quran_evidence ?? []),
          JSON.stringify(r.sunnah_evidence ?? []),
          JSON.stringify(r.references ?? []),
          JSON.stringify(r.scholar_opinions ?? []),
        ],
        q,
      ),
    );
  }

  const sort = opts?.sort ?? "newest";
  result = [...result].sort((a, b) => {
    if (sort === "views") return (b.view_count ?? 0) - (a.view_count ?? 0);
    if (sort === "importance") return (b.importance_score ?? 0) - (a.importance_score ?? 0);
    if (sort === "search") return (b.search_count ?? 0) - (a.search_count ?? 0);
    const da = new Date(a.published_at || a.created_at || 0).getTime();
    const db = new Date(b.published_at || b.created_at || 0).getTime();
    return db - da;
  });
  return result;
}

export async function getRulingsEncyclopedia(opts?: RulingListOptions): Promise<RulingListResult> {
  const page = Math.max(1, opts?.page ?? 1);
  const limit = Math.min(100, Math.max(12, opts?.limit ?? 24));
  const seedPool = await getSeedPool();
  const filtered = filterSeed(seedPool, opts);
  const offset = (page - 1) * limit;

  if (!isConfigured) {
    return {
      data: filtered.slice(offset, offset + limit),
      total: filtered.length,
      page,
      limit,
      usingSeed: true,
    };
  }

  try {
    const { data, error } = await supabase.rpc("search_sharia_rulings", {
      q: opts?.search?.trim() || null,
      p_category: opts?.category && opts.category !== "الكل" ? opts.category : null,
      p_subcategory: opts?.subcategory || null,
      p_sort: opts?.sort || "newest",
      p_limit: limit,
      p_offset: offset,
    });

    if (error) throw error;
    type RpcRow = ShariaRulingExtended & { total_count?: number };
    const rows = (data || []) as RpcRow[];
    const total = rows.length > 0 && rows[0].total_count != null ? Number(rows[0].total_count) : rows.length;

    if (rows.length === 0 && filtered.length > 0) {
      return {
        data: filtered.slice(offset, offset + limit),
        total: filtered.length,
        page,
        limit,
        usingSeed: true,
      };
    }

    return { data: rows, total: total || rows.length, page, limit, usingSeed: false };
  } catch (err) {
    logSupabaseError("getRulingsEncyclopedia", err);
    return {
      data: filtered.slice(offset, offset + limit),
      total: filtered.length,
      page,
      limit,
      usingSeed: true,
    };
  }
}

export async function getRulingById(id: string): Promise<{ data: ShariaRulingExtended | null; usingSeed: boolean }> {
  const seedPool = await getSeedPool();
  const fallback =
    seedPool.find((r) => r.id === id || r.external_key === id || r.slug === id) ||
    findLegacyRulingById(id);

  if (!isConfigured) return { data: fallback as ShariaRulingExtended | null, usingSeed: true };

  try {
    const byId = await supabase
      .from("sharia_rulings")
      .select("*")
      .eq("id", id)
      .eq("status", "approved")
      .maybeSingle();
    if (byId.data) return { data: byId.data as ShariaRulingExtended, usingSeed: false };

    const byKey = await supabase
      .from("sharia_rulings")
      .select("*")
      .eq("external_key", id)
      .eq("status", "approved")
      .maybeSingle();
    if (byKey.data) return { data: byKey.data as ShariaRulingExtended, usingSeed: false };

    return { data: fallback as ShariaRulingExtended | null, usingSeed: !!fallback };
  } catch (err) {
    logSupabaseError("getRulingById", err, { id });
    return { data: fallback as ShariaRulingExtended | null, usingSeed: true };
  }
}

export async function getRelatedRulingsEncyclopedia(
  currentId: string,
  category?: string,
  subcategory?: string,
  limit = 6,
): Promise<ShariaRulingExtended[]> {
  const { data } = await getRulingsEncyclopedia({
    category: category || "الكل",
    subcategory,
    limit: limit + 5,
    sort: "importance",
  });
  return data.filter((r) => r.id !== currentId).slice(0, limit);
}

export async function getRulingCategoryStats(): Promise<CategoryStat[]> {
  const seedPool = await getSeedPool();
  const map = new Map<string, CategoryStat>();

  for (const r of seedPool) {
    const key = `${r.category}::${r.subcategory ?? ""}`;
    const cur = map.get(key) ?? { category: r.category, subcategory: r.subcategory, count: 0 };
    cur.count++;
    map.set(key, cur);
  }

  if (isConfigured) {
    try {
      const { data } = await supabase.rpc("sharia_rulings_category_stats");
      if (data?.length) {
        return (data as { category: string; subcategory: string; cnt: number }[]).map((row) => ({
          category: row.category,
          subcategory: row.subcategory || undefined,
          count: Number(row.cnt),
        }));
      }
    } catch (err) {
      logSupabaseError("getRulingCategoryStats", err);
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count);
}

export async function getRulingsEncyclopediaTotal(): Promise<number> {
  if (RULINGS_ENCYCLOPEDIA_TOTAL > 0) return RULINGS_ENCYCLOPEDIA_TOTAL;
  try {
    const manifest = await loadRulingsManifest();
    return manifest.total;
  } catch {
    const pool = await getSeedPool();
    return pool.length;
  }
}

export { getSeedPool as getAllRulingsForAdmin };
