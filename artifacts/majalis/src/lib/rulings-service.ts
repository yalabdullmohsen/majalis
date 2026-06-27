/**
 * Production rulings service — database is the single source of truth at runtime.
 * JSON chunks are seed-only (see lib/rulings-db-seed.mjs).
 */

import type { CategoryStat, RulingListOptions, RulingListResult, ShariaRulingExtended } from "./rulings-types";
import { supabase, isSupabaseConfigured } from "./supabase";
import { logSupabaseError, formatSupabaseError } from "./supabase-config";

const isConfigured = isSupabaseConfigured();

type DbReadyState = { ready: boolean; count: number; reason?: string };
let dbReadyCache: DbReadyState | null = null;
let dbReadyPromise: Promise<DbReadyState> | null = null;

async function checkRulingsDbReady(): Promise<DbReadyState> {
  if (dbReadyCache) return dbReadyCache;
  if (!dbReadyPromise) {
    dbReadyPromise = (async () => {
      if (!isConfigured) {
        dbReadyCache = { ready: false, count: 0, reason: "supabase_not_configured" };
        return dbReadyCache;
      }
      try {
        const { count, error } = await supabase
          .from("sharia_rulings")
          .select("id", { count: "exact", head: true });
        if (error) {
          const msg = formatSupabaseError(error);
          const missing = /Could not find|PGRST205|42P01/i.test(msg);
          dbReadyCache = { ready: false, count: 0, reason: missing ? "table_missing" : msg };
          return dbReadyCache;
        }
        dbReadyCache = { ready: true, count: count ?? 0 };
        return dbReadyCache;
      } catch (err) {
        dbReadyCache = { ready: false, count: 0, reason: String(err) };
        return dbReadyCache;
      }
    })();
  }
  return dbReadyPromise;
}

export function invalidateRulingsDbCache() {
  dbReadyCache = null;
  dbReadyPromise = null;
}

function emptyResult(page: number, limit: number, reason?: string): RulingListResult {
  return {
    data: [],
    total: 0,
    page,
    limit,
    usingSeed: false,
    needsSeed: reason === "empty",
    dbError: reason,
  };
}

export async function getRulingsEncyclopedia(opts?: RulingListOptions): Promise<RulingListResult> {
  const page = Math.max(1, opts?.page ?? 1);
  const limit = Math.min(100, Math.max(12, opts?.limit ?? 24));
  const offset = (page - 1) * limit;

  if (!isConfigured) {
    return emptyResult(page, limit, "supabase_not_configured");
  }

  const db = await checkRulingsDbReady();
  if (!db.ready) {
    return emptyResult(page, limit, db.reason);
  }
  if (db.count === 0) {
    return emptyResult(page, limit, "empty");
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

    return { data: rows, total: total || rows.length, page, limit, usingSeed: false };
  } catch (err) {
    logSupabaseError("getRulingsEncyclopedia", err);
    return emptyResult(page, limit, formatSupabaseError(err));
  }
}

export async function getRulingById(id: string): Promise<{ data: ShariaRulingExtended | null; usingSeed: boolean; dbError?: string }> {
  if (!isConfigured) return { data: null, usingSeed: false, dbError: "supabase_not_configured" };

  const db = await checkRulingsDbReady();
  if (!db.ready) return { data: null, usingSeed: false, dbError: db.reason };

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

    return { data: null, usingSeed: false };
  } catch (err) {
    logSupabaseError("getRulingById", err, { id });
    return { data: null, usingSeed: false, dbError: formatSupabaseError(err) };
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
  if (!isConfigured) return [];

  const db = await checkRulingsDbReady();
  if (!db.ready || db.count === 0) return [];

  try {
    const { data, error } = await supabase.rpc("sharia_rulings_category_stats");
    if (error) throw error;
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
  return [];
}

export async function getRulingsEncyclopediaTotal(): Promise<number> {
  const db = await checkRulingsDbReady();
  if (db.ready) return db.count;
  return 0;
}

export async function getRulingsDbStatus() {
  return checkRulingsDbReady();
}

/** Admin: list all rulings from DB (no JSON). */
export async function getAllRulingsForAdmin(): Promise<ShariaRulingExtended[]> {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from("sharia_rulings")
    .select("*")
    .order("importance_score", { ascending: false })
    .limit(500);
  if (error) {
    logSupabaseError("getAllRulingsForAdmin", error);
    return [];
  }
  return (data || []) as ShariaRulingExtended[];
}
