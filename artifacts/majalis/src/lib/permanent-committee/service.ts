import { arabicMatchAny } from "@/lib/arabic-search";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { logSupabaseError } from "@/lib/supabase-config";
import {
  PC_FATWA_SEED,
  findPcFatwaById,
  getLatestPcFatwas,
  getPopularPcFatwas,
} from "./seed";
import type { PermanentCommitteeFatwa, PermanentCommitteeSearchFilters } from "./types";

const isConfigured = isSupabaseConfigured();

function filterSeed(items: PermanentCommitteeFatwa[], opts?: PermanentCommitteeSearchFilters) {
  let list = [...items];
  if (opts?.category && opts.category !== "الكل") {
    list = list.filter((f) => f.category === opts.category || f.subcategory === opts.category);
  }
  if (opts?.subcategory) {
    list = list.filter((f) => f.subcategory === opts.subcategory);
  }
  if (opts?.fatwaNumber?.trim()) {
    const n = opts.fatwaNumber.trim();
    list = list.filter((f) => f.fatwa_number?.includes(n));
  }
  if (opts?.keyword?.trim()) {
    const k = opts.keyword.trim();
    list = list.filter((f) => f.keywords?.some((w) => w.includes(k)));
  }
  if (opts?.q?.trim()) {
    list = list.filter((f) =>
      arabicMatchAny(
        [f.title, f.question, f.answer, f.summary, f.category, f.subcategory, ...(f.keywords || [])],
        opts.q!.trim(),
      ),
    );
  }
  const limit = opts?.limit ?? 100;
  return list.slice(0, limit);
}

export async function getPermanentCommitteeFatwas(opts?: PermanentCommitteeSearchFilters) {
  const seed = filterSeed(PC_FATWA_SEED, opts);
  if (!isConfigured) return { data: seed, usingSeed: true };

  try {
    let query = supabase
      .from("permanent_committee_fatwas")
      .select("*")
      .eq("status", "approved")
      .is("archived_at", null)
      .order("issued_at", { ascending: false, nullsFirst: false });

    if (opts?.category && opts.category !== "الكل") {
      query = query.or(`category.eq.${opts.category},subcategory.eq.${opts.category}`);
    }
    if (opts?.fatwaNumber?.trim()) {
      query = query.ilike("fatwa_number", `%${opts.fatwaNumber.trim()}%`);
    }

    const { data, error } = await query.limit(opts?.limit ?? 100);
    if (error) throw error;

    let result = (data || []) as PermanentCommitteeFatwa[];
    if (opts?.q?.trim() || opts?.keyword?.trim()) {
      result = filterSeed(result, opts);
    }
    if (result.length === 0 && seed.length > 0) return { data: seed, usingSeed: true };
    return { data: result, usingSeed: false };
  } catch (err) {
    logSupabaseError("getPermanentCommitteeFatwas", err);
    return { data: seed, usingSeed: true };
  }
}

export async function getPermanentCommitteeFatwaById(id: string) {
  const fallback = findPcFatwaById(id);
  if (!isConfigured) return { data: fallback, usingSeed: true };

  try {
    const byId = await supabase
      .from("permanent_committee_fatwas")
      .select("*")
      .eq("id", id)
      .eq("status", "approved")
      .maybeSingle();
    if (byId.data) return { data: byId.data as PermanentCommitteeFatwa, usingSeed: false };

    const byKey = await supabase
      .from("permanent_committee_fatwas")
      .select("*")
      .eq("external_key", id)
      .eq("status", "approved")
      .maybeSingle();
    return {
      data: (byKey.data as PermanentCommitteeFatwa) || fallback,
      usingSeed: !byKey.data && !!fallback,
    };
  } catch (err) {
    logSupabaseError("getPermanentCommitteeFatwaById", err, { id });
    return { data: fallback, usingSeed: true };
  }
}

export async function getRelatedPermanentCommitteeFatwas(
  id: string,
  category?: string,
  limit = 6,
): Promise<PermanentCommitteeFatwa[]> {
  const { data } = await getPermanentCommitteeFatwas({ category: category || "الكل", limit: limit + 4 });
  return data.filter((f) => f.id !== id).slice(0, limit);
}

export async function searchPermanentCommittee(filters: PermanentCommitteeSearchFilters) {
  return getPermanentCommitteeFatwas(filters);
}

export function getPermanentCommitteeHubStats() {
  return {
    latest: getLatestPcFatwas(6),
    popular: getPopularPcFatwas(6),
    totalSeed: PC_FATWA_SEED.length,
  };
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function adminGetPermanentCommitteeFatwas() {
  if (!isConfigured) return { data: PC_FATWA_SEED, error: null };
  const { data, error } = await supabase
    .from("permanent_committee_fatwas")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function adminUpsertPermanentCommitteeFatwa(row: Partial<PermanentCommitteeFatwa> & { id?: string }) {
  const { id, ...rest } = row;
  if (!isConfigured) return { data: null, error: new Error("Supabase not configured") };
  if (id) return supabase.from("permanent_committee_fatwas").update(rest).eq("id", id);
  return supabase.from("permanent_committee_fatwas").insert(rest);
}

export async function adminDeletePermanentCommitteeFatwa(id: string) {
  if (!isConfigured) return { error: null };
  return supabase.from("permanent_committee_fatwas").delete().eq("id", id);
}

export async function getPermanentCommitteeStats() {
  if (!isConfigured) {
    return {
      total: PC_FATWA_SEED.length,
      approved: PC_FATWA_SEED.filter((f) => f.status === "approved").length,
      pending: 0,
      categories: new Set(PC_FATWA_SEED.map((f) => f.category)).size,
    };
  }
  const { count: total } = await supabase
    .from("permanent_committee_fatwas")
    .select("*", { count: "exact", head: true });
  const { count: approved } = await supabase
    .from("permanent_committee_fatwas")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");
  const { count: pending } = await supabase
    .from("permanent_committee_fatwas")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  return { total: total ?? 0, approved: approved ?? 0, pending: pending ?? 0, categories: 20 };
}
