/**
 * Production rulings service — database is the single source of truth at runtime.
 * JSON chunks are seed-only (see lib/rulings-db-seed.mjs).
 */

import type { CategoryStat, RulingListOptions, RulingListResult, ShariaRulingExtended } from "./rulings-types";
import { CONTENT_CURRICULUM_ENABLED, isCurriculumRuling } from "./content-flags";
import { supabase, isSupabaseConfigured } from "./supabase";
import { logSupabaseError, formatSupabaseError } from "./supabase-config";
import { isAllowedOnRulingsRoute } from "./rulings-content-type";
import { evaluateRulingRecord, type RulingResolveResult } from "./rulings-resolver";
import { loadAllRulingsFromChunks, RULINGS_ENCYCLOPEDIA_SEED } from "./rulings-data-loader";

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
    let rows = (data || []) as RpcRow[];
    if (!CONTENT_CURRICULUM_ENABLED) {
      rows = rows.filter((r) => !isCurriculumRuling(r));
    }
    rows = rows.filter((r) => isAllowedOnRulingsRoute(r));
    const total = rows.length > 0 && rows[0].total_count != null ? Number(rows[0].total_count) : rows.length;

    return { data: rows, total: total || rows.length, page, limit, usingSeed: false };
  } catch (err) {
    logSupabaseError("getRulingsEncyclopedia", err);
    return emptyResult(page, limit, formatSupabaseError(err));
  }
}

async function findRulingInLocalSeed(id: string): Promise<ShariaRulingExtended | null> {
  const fromInline = RULINGS_ENCYCLOPEDIA_SEED.find(
    (r) => r.id === id || r.external_key === id || r.slug === id,
  );
  if (fromInline && isAllowedOnRulingsRoute(fromInline)) return fromInline;

  try {
    const all = await loadAllRulingsFromChunks();
    const hit = all.find((r) => r.id === id || r.external_key === id || r.slug === id);
    if (hit && isAllowedOnRulingsRoute(hit)) return hit;
  } catch {
    /* ignore */
  }
  return null;
}

export async function resolveRulingByIdentifier(id: string): Promise<RulingResolveResult & { usingSeed: boolean; dbError?: string }> {
  const trimmed = String(id || "").trim();
  const base = evaluateRulingRecord(trimmed, null);
  if (base.status === "invalidType") return { ...base, usingSeed: false };

  if (isConfigured) {
    const db = await checkRulingsDbReady();
    if (db.ready) {
      try {
        const byId = await supabase
          .from("sharia_rulings")
          .select("*")
          .eq("id", trimmed)
          .eq("status", "approved")
          .maybeSingle();
        if (byId.data) {
          const row = byId.data as ShariaRulingExtended;
          if (!CONTENT_CURRICULUM_ENABLED && isCurriculumRuling(row)) {
            return { ...evaluateRulingRecord(trimmed, null), usingSeed: false };
          }
          return { ...evaluateRulingRecord(trimmed, row), usingSeed: false };
        }

        const byKey = await supabase
          .from("sharia_rulings")
          .select("*")
          .eq("external_key", trimmed)
          .eq("status", "approved")
          .maybeSingle();
        if (byKey.data) {
          const row = byKey.data as ShariaRulingExtended;
          if (!CONTENT_CURRICULUM_ENABLED && isCurriculumRuling(row)) {
            return { ...evaluateRulingRecord(trimmed, null), usingSeed: false };
          }
          return { ...evaluateRulingRecord(trimmed, row), usingSeed: false };
        }

        const bySlug = await supabase
          .from("sharia_rulings")
          .select("*")
          .eq("slug", trimmed)
          .eq("status", "approved")
          .maybeSingle();
        if (bySlug.data) {
          const row = bySlug.data as ShariaRulingExtended;
          if (!CONTENT_CURRICULUM_ENABLED && isCurriculumRuling(row)) {
            return { ...evaluateRulingRecord(trimmed, null), usingSeed: false };
          }
          return { ...evaluateRulingRecord(trimmed, row), usingSeed: false };
        }
      } catch (err) {
        logSupabaseError("resolveRulingByIdentifier", err, { id: trimmed });
        const local = await findRulingInLocalSeed(trimmed);
        if (local) return { ...evaluateRulingRecord(trimmed, local), usingSeed: true, dbError: formatSupabaseError(err) };
        return { ...evaluateRulingRecord(trimmed, null), usingSeed: false, dbError: formatSupabaseError(err) };
      }
    }
  }

  const local = await findRulingInLocalSeed(trimmed);
  return { ...evaluateRulingRecord(trimmed, local), usingSeed: Boolean(local) };
}

export async function getRulingById(id: string): Promise<{ data: ShariaRulingExtended | null; usingSeed: boolean; dbError?: string }> {
  const resolved = await resolveRulingByIdentifier(id);
  if (resolved.status === "found" && resolved.data) {
    return { data: resolved.data, usingSeed: resolved.usingSeed, dbError: resolved.dbError };
  }
  return { data: null, usingSeed: resolved.usingSeed, dbError: resolved.dbError || resolved.reason };
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
