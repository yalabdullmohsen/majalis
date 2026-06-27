import { arabicMatchAny } from "./arabic-search";
import {
  getFiqhDecisions,
  getFiqhDecisionById,
  getRelatedFiqhDecisions,
  searchFiqhCouncilSeed,
  FIQH_COUNCIL_SEED,
} from "./fiqh-council-service";
import { FATWA_SEED, findFatwaById } from "./fatwa-seed";
import { RULINGS_SEED } from "./rulings-seed";
import { ANNUAL_COURSES_SEED, findAnnualCourseById } from "./annual-courses-seed";
import { UPDATES_SEED, getSortedUpdates } from "./updates-seed";
import { supabase, isSupabaseConfigured } from "./supabase";
import { logSupabaseError } from "./supabase-config";
import { allowSeedFallback } from "@/lib/cms/production-config";
import type {
  AnnualCourse,
  Fatwa,
  PlatformUpdate,
  ShariaRuling,
} from "./platform-types";

const isConfigured = isSupabaseConfigured();

function filterBySearch<T>(items: T[], fields: (keyof T | string)[], query?: string): T[] {
  if (!query?.trim()) return items;
  return items.filter((item) =>
    arabicMatchAny(
      fields.map((f) => String((item as Record<string, unknown>)[f as string] ?? "")),
      query.trim(),
    ),
  );
}

export {
  getFiqhDecisions,
  getFiqhDecisionById,
  getRelatedFiqhDecisions,
  FIQH_COUNCIL_SEED,
};

// ─── Fatwas ──────────────────────────────────────────────────────────────────

export async function getFatwas(opts?: { category?: string; search?: string; format?: string }) {
  let items = allowSeedFallback() ? [...FATWA_SEED] : [];
  if (opts?.category && opts.category !== "الكل") {
    items = items.filter((f) => f.category === opts.category);
  }
  if (opts?.format && opts.format !== "الكل") {
    items = items.filter((f) => f.format === opts.format || f.format === "both");
  }
  items = filterBySearch(items, ["question", "answer", "summary", "category"], opts?.search);

  if (!isConfigured) return { data: items, usingSeed: false };

  try {
    let query = supabase
      .from("fatwas")
      .select("*")
      .eq("status", "approved")
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (opts?.category && opts.category !== "الكل") query = query.eq("category", opts.category);
    if (opts?.format && opts.format !== "الكل") {
      query = query.or(`format.eq.${opts.format},format.eq.both`);
    }

    const { data, error } = await query;
    if (error) throw error;

    let result = (data || []) as Fatwa[];
    if (opts?.search?.trim()) {
      result = filterBySearch(result, ["question", "answer"], opts.search);
    }
    if (result.length === 0 && items.length > 0 && allowSeedFallback()) return { data: items, usingSeed: false };
    return { data: result, usingSeed: false };
  } catch (err) {
    logSupabaseError("getFatwas", err);
    return { data: allowSeedFallback() ? items : [], usingSeed: false };
  }
}

export async function getFatwaById(id: string) {
  const fallback = allowSeedFallback() ? findFatwaById(id) : null;
  if (!isConfigured) return { data: fallback, usingSeed: false };

  try {
    const byId = await supabase.from("fatwas").select("*").eq("id", id).eq("status", "approved").maybeSingle();
    if (byId.data) return { data: byId.data as Fatwa, usingSeed: false };

    const byKey = await supabase.from("fatwas").select("*").eq("external_key", id).eq("status", "approved").maybeSingle();
    return { data: (byKey.data as Fatwa) || fallback, usingSeed: !byKey.data && !!fallback };
  } catch (err) {
    logSupabaseError("getFatwaById", err, { id });
    return { data: fallback, usingSeed: false };
  }
}

// ─── Sharia Rulings ──────────────────────────────────────────────────────────

export async function getShariaRulings(opts?: { category?: string; search?: string }) {
  const { getRulingsEncyclopedia } = await import("./rulings-service");
  const result = await getRulingsEncyclopedia({
    category: opts?.category,
    search: opts?.search,
    limit: 500,
  });
  return { data: result.data as ShariaRuling[], usingSeed: result.usingSeed };
}

export async function getShariaRulingById(id: string) {
  const { getRulingById } = await import("./rulings-service");
  const result = await getRulingById(id);
  return { data: result.data as ShariaRuling | null, usingSeed: result.usingSeed };
}

// ─── Annual Courses ──────────────────────────────────────────────────────────

export async function getAnnualCourses(opts?: { type?: string; search?: string; year?: number }) {
  let items = allowSeedFallback() ? [...ANNUAL_COURSES_SEED] : [];
  if (opts?.type && opts.type !== "الكل") {
    items = items.filter((c) => c.course_type === opts.type);
  }
  if (opts?.year) {
    items = items.filter((c) => c.year === opts.year);
  }
  items = filterBySearch(items, ["title", "summary", "body"], opts?.search);

  if (!isConfigured) return { data: items, usingSeed: false };

  try {
    let query = supabase
      .from("annual_courses")
      .select("*")
      .eq("status", "approved")
      .is("archived_at", null)
      .order("year", { ascending: false, nullsFirst: false });

    if (opts?.type && opts.type !== "الكل") query = query.eq("course_type", opts.type);
    if (opts?.year) query = query.eq("year", opts.year);

    const { data, error } = await query;
    if (error) throw error;

    let result = (data || []) as AnnualCourse[];
    if (opts?.search?.trim()) {
      result = filterBySearch(result, ["title", "summary"], opts.search);
    }
    if (result.length === 0 && items.length > 0 && allowSeedFallback()) return { data: items, usingSeed: false };
    return { data: result, usingSeed: false };
  } catch (err) {
    logSupabaseError("getAnnualCourses", err);
    return { data: allowSeedFallback() ? items : [], usingSeed: false };
  }
}

export async function getAnnualCourseById(id: string) {
  const fallback = allowSeedFallback() ? findAnnualCourseById(id) : null;
  if (!isConfigured) return { data: fallback, usingSeed: false };

  try {
    const byId = await supabase.from("annual_courses").select("*").eq("id", id).eq("status", "approved").maybeSingle();
    if (byId.data) return { data: byId.data as AnnualCourse, usingSeed: false };

    const byKey = await supabase.from("annual_courses").select("*").eq("external_key", id).eq("status", "approved").maybeSingle();
    return { data: (byKey.data as AnnualCourse) || fallback, usingSeed: !byKey.data && !!fallback };
  } catch (err) {
    logSupabaseError("getAnnualCourseById", err, { id });
    return { data: fallback, usingSeed: false };
  }
}

// ─── Updates ─────────────────────────────────────────────────────────────────

export async function getPlatformUpdates(limit = 50) {
  const fallback = allowSeedFallback() ? getSortedUpdates(limit) : [];
  if (!isConfigured) return { data: fallback, usingSeed: false };

  try {
    const { data, error } = await supabase
      .from("platform_updates")
      .select("*")
      .eq("status", "approved")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    const result = (data || []) as PlatformUpdate[];
    if (result.length === 0 && fallback.length > 0 && allowSeedFallback()) return { data: fallback, usingSeed: false };
    return { data: result, usingSeed: false };
  } catch (err) {
    logSupabaseError("getPlatformUpdates", err);
    return { data: allowSeedFallback() ? fallback : [], usingSeed: false };
  }
}

// ─── Related content ─────────────────────────────────────────────────────────

export async function getRelatedFatwas(currentId: string, category?: string, limit = 4) {
  const { data } = await getFatwas({ category });
  return data.filter((f) => f.id !== currentId).slice(0, limit);
}

export async function getRelatedRulings(currentId: string, category?: string, limit = 4) {
  const { getRelatedRulingsEncyclopedia } = await import("./rulings-service");
  return getRelatedRulingsEncyclopedia(currentId, category, undefined, limit) as Promise<ShariaRuling[]>;
}

export async function getRelatedCourses(currentId: string, limit = 4) {
  const { data } = await getAnnualCourses();
  return data.filter((c) => c.id !== currentId).slice(0, limit);
}

export {
  FATWA_SEED,
  RULINGS_SEED,
  ANNUAL_COURSES_SEED,
  UPDATES_SEED,
  searchFiqhCouncilSeed,
};
