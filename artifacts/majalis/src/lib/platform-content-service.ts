import { arabicMatchAny } from "./arabic-search";
import {
  getFiqhDecisions,
  getFiqhDecisionById,
  getRelatedFiqhDecisions,
  searchFiqhCouncilSeed,
  FIQH_COUNCIL_SEED,
} from "./fiqh-council-service";
import { RULINGS_SEED } from "./rulings-seed";
import { ANNUAL_COURSES_SEED, findAnnualCourseById } from "./annual-courses-seed";
import { UPDATES_SEED, getSortedUpdates } from "./updates-seed";
import { supabase, isSupabaseConfigured } from "./supabase";
import { logSupabaseError } from "./supabase-config";
import type {
  AnnualCourse,
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
  let items = [...ANNUAL_COURSES_SEED];
  if (opts?.type && opts.type !== "الكل") {
    items = items.filter((c) => c.course_type === opts.type);
  }
  if (opts?.year) {
    items = items.filter((c) => c.year === opts.year);
  }
  items = filterBySearch(items, ["title", "summary", "body"], opts?.search);

  if (!isConfigured) return { data: items, usingSeed: true };

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
    if (result.length === 0 && items.length > 0) return { data: items, usingSeed: true };
    return { data: result, usingSeed: false };
  } catch (err) {
    logSupabaseError("getAnnualCourses", err);
    return { data: items, usingSeed: true };
  }
}

export async function getAnnualCourseById(id: string) {
  const fallback = findAnnualCourseById(id);
  if (!isConfigured) return { data: fallback, usingSeed: true };

  try {
    const byId = await supabase.from("annual_courses").select("*").eq("id", id).eq("status", "approved").maybeSingle();
    if (byId.data) return { data: byId.data as AnnualCourse, usingSeed: false };

    const byKey = await supabase.from("annual_courses").select("*").eq("external_key", id).eq("status", "approved").maybeSingle();
    return { data: (byKey.data as AnnualCourse) || fallback, usingSeed: !byKey.data && !!fallback };
  } catch (err) {
    logSupabaseError("getAnnualCourseById", err, { id });
    return { data: fallback, usingSeed: true };
  }
}

// ─── Updates ─────────────────────────────────────────────────────────────────

export async function getPlatformUpdates(limit = 50) {
  const fallback = getSortedUpdates(limit);
  if (!isConfigured) return { data: fallback, usingSeed: true };

  try {
    const { data, error } = await supabase
      .from("platform_updates")
      .select("*")
      .eq("status", "approved")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    const result = (data || []) as PlatformUpdate[];
    if (result.length === 0 && fallback.length > 0) return { data: fallback, usingSeed: true };
    return { data: result, usingSeed: false };
  } catch (err) {
    logSupabaseError("getPlatformUpdates", err);
    return { data: fallback, usingSeed: true };
  }
}

// ─── Related content ─────────────────────────────────────────────────────────

export async function getRelatedRulings(currentId: string, category?: string, limit = 4) {
  const { getRelatedRulingsEncyclopedia } = await import("./rulings-service");
  return getRelatedRulingsEncyclopedia(currentId, category, undefined, limit) as Promise<ShariaRuling[]>;
}

export async function getRelatedCourses(currentId: string, limit = 4) {
  const { data } = await getAnnualCourses();
  return data.filter((c) => c.id !== currentId).slice(0, limit);
}

export {
  RULINGS_SEED,
  ANNUAL_COURSES_SEED,
  UPDATES_SEED,
  searchFiqhCouncilSeed,
};
