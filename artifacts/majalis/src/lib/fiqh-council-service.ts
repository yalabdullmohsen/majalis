import { arabicMatchAny } from "./arabic-search";
import {
  FIQH_COUNCIL_PUBLISHED_SEED,
  FIQH_COUNCIL_ALL_SEED,
  FIQH_COUNCIL_ADMIN_ONLY_SEED,
  findFiqhCouncilItemBySlug,
} from "./fiqh-council-seed";
import {
  FIQH_ITEM_TYPE_LABELS,
  type FiqhCouncilCategory,
  type FiqhCouncilItem,
  type FiqhItemStatus,
  type FiqhItemType,
} from "./fiqh-council-types";
import { supabase, isSupabaseConfigured } from "./supabase";
import { logSupabaseError } from "./supabase-config";

const isConfigured = isSupabaseConfigured();
const TABLE = "fiqh_council_items";

export type FiqhCouncilListOptions = {
  type?: FiqhItemType | "الكل";
  category?: FiqhCouncilCategory | "الكل";
  search?: string;
  status?: FiqhItemStatus | "الكل";
  year?: number | "الكل";
  source?: string;
  limit?: number;
};

function filterSeed(items: FiqhCouncilItem[], opts?: FiqhCouncilListOptions, publicOnly = true) {
  let result = [...items];
  if (opts?.status && opts.status !== "الكل") {
    result = result.filter((item) => item.status === opts.status);
  } else if (publicOnly) {
    result = result.filter((item) => item.status === "published");
  }

  if (opts?.type && opts.type !== "الكل") {
    result = result.filter((item) => item.type === opts.type);
  }
  if (opts?.category && opts.category !== "الكل") {
    result = result.filter((item) => item.category === opts.category);
  }
  if (opts?.year && opts.year !== "الكل") {
    result = result.filter((item) => {
      const y = item.session_date?.slice(0, 4) || item.published_at?.slice(0, 4);
      return y === String(opts.year);
    });
  }
  if (opts?.source?.trim()) {
    const s = opts.source.trim();
    result = result.filter((item) => item.source_name?.includes(s));
  }
  if (opts?.search?.trim()) {
    result = result.filter((item) =>
      arabicMatchAny(
        [
          item.title,
          item.summary,
          item.content,
          item.ruling_text,
          item.category,
          item.source_name,
          ...(item.tags || []),
          ...(item.evidence || []).flatMap((e) => [e.text, e.source, e.type]),
        ],
        opts.search!.trim(),
      ),
    );
  }

  result.sort((a, b) => {
    const da = a.session_date || a.published_at || a.created_at || "";
    const db = b.session_date || b.published_at || b.created_at || "";
    return db.localeCompare(da);
  });

  if (opts?.limit) result = result.slice(0, opts.limit);
  return result;
}

function isMissingTableError(err: unknown) {
  const msg = String((err as { message?: string })?.message || err || "");
  return msg.includes("fiqh_council_items") || msg.includes("does not exist") || msg.includes("42P01");
}

export async function getFiqhCouncilItems(opts?: FiqhCouncilListOptions) {
  const seedItems = filterSeed([...FIQH_COUNCIL_PUBLISHED_SEED], opts);
  if (!isConfigured) return { data: seedItems, usingSeed: true };

  try {
    let query = supabase
      .from(TABLE)
      .select("*")
      .eq("status", "published")
      .order("session_date", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false, nullsFirst: false });

    if (opts?.type && opts.type !== "الكل") query = query.eq("type", opts.type);
    if (opts?.category && opts.category !== "الكل") query = query.eq("category", opts.category);
    if (opts?.year && opts.year !== "الكل") {
      query = query.gte("session_date", `${opts.year}-01-01`).lte("session_date", `${opts.year}-12-31`);
    }
    if (opts?.source?.trim()) query = query.ilike("source_name", `%${opts.source.trim()}%`);
    if (opts?.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error)) return { data: seedItems, usingSeed: true };
      throw error;
    }

    let result = (data || []) as FiqhCouncilItem[];
    if (opts?.search?.trim()) {
      result = filterSeed(result, { ...opts, status: "published" });
    }
    if (result.length === 0 && seedItems.length > 0) {
      return { data: seedItems, usingSeed: true };
    }
    return { data: result, usingSeed: false };
  } catch (err) {
    logSupabaseError("getFiqhCouncilItems", err);
    return { data: seedItems, usingSeed: true };
  }
}

export async function getFiqhCouncilItemBySlug(slug: string) {
  const fallback = findFiqhCouncilItemBySlug(slug);
  if (!isConfigured) return { data: fallback, usingSeed: true };

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) return { data: fallback, usingSeed: true };
      throw error;
    }
    return { data: (data as FiqhCouncilItem) || fallback, usingSeed: !data && !!fallback };
  } catch (err) {
    logSupabaseError("getFiqhCouncilItemBySlug", err, { slug });
    return { data: fallback, usingSeed: true };
  }
}

export async function getRelatedFiqhCouncilItems(currentSlug: string, category?: string, limit = 4) {
  const { data } = await getFiqhCouncilItems({ category: category as FiqhCouncilCategory | "الكل" });
  return data.filter((item) => item.slug !== currentSlug).slice(0, limit);
}

export async function incrementFiqhCouncilViews(slug: string) {
  if (!isConfigured) return;
  try {
    await supabase.rpc("increment_fiqh_item_views", { item_slug: slug });
  } catch {
    /* optional RPC — ignore if missing */
  }
}

export function searchFiqhCouncilSeed(query: string) {
  const q = query.trim();
  if (!q) return [];
  return filterSeed(FIQH_COUNCIL_PUBLISHED_SEED, { search: q }).map((item) => ({
    id: item.slug,
    slug: item.slug,
    title: item.title,
    category: item.category,
    decision_type: item.type,
    searchMeta: [FIQH_ITEM_TYPE_LABELS[item.type], item.category, item.session_date].filter(Boolean).join(" · "),
  }));
}

export async function getFiqhCouncilCategoryCounts() {
  const { data } = await getFiqhCouncilItems();
  const counts: Record<string, number> = {};
  for (const item of data) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }
  return counts;
}

export async function searchFiqhCouncil(query: string, limit = 20) {
  const q = query.trim();
  if (!q) return { data: [] as FiqhCouncilItem[], usingSeed: true };

  const seedResults = filterSeed(FIQH_COUNCIL_PUBLISHED_SEED, { search: q, limit });
  if (!isConfigured) return { data: seedResults, usingSeed: true };

  try {
    const { data, error } = await supabase.rpc("search_fiqh_council", { query: q, result_limit: limit });
    if (error) {
      if (isMissingTableError(error)) return { data: seedResults, usingSeed: true };
      throw error;
    }
    const rows = (data || []) as FiqhCouncilItem[];
    if (rows.length === 0 && seedResults.length > 0) return { data: seedResults, usingSeed: true };
    return { data: rows, usingSeed: false };
  } catch (err) {
    logSupabaseError("searchFiqhCouncil", err);
    return { data: seedResults, usingSeed: true };
  }
}

export async function getFiqhSearchSuggestions(query: string) {
  const q = query.trim();
  if (q.length < 2) return [] as string[];

  const { data } = await getFiqhCouncilItems({ search: q, limit: 5 });
  const fromTitles = data.map((i) => i.title).slice(0, 3);
  const fromTags = [...new Set(data.flatMap((i) => i.tags || []))].slice(0, 3);
  const fromCats = [...new Set(data.map((i) => i.category))].slice(0, 2);
  return [...new Set([...fromTitles, ...fromTags, ...fromCats])].slice(0, 6);
}

export async function getArchivedFiqhCouncilItems(opts?: Omit<FiqhCouncilListOptions, "status">) {
  return getFiqhCouncilItemsAdmin({ ...opts, status: "archived" });
}

async function getFiqhCouncilItemsAdmin(opts?: FiqhCouncilListOptions) {
  const targetStatus = (opts?.status && opts.status !== "الكل") ? opts.status : "archived";
  let items = FIQH_COUNCIL_ALL_SEED.filter((i) => i.status === targetStatus);
  items = filterSeed(items, { ...opts, status: targetStatus }, false);

  if (!isConfigured) return { data: items, usingSeed: true };

  try {
    let query = supabase.from(TABLE).select("*").order("archived_at", { ascending: false, nullsFirst: false });
    if (opts?.status && opts.status !== "الكل") query = query.eq("status", opts.status);
    else query = query.eq("status", "archived");
    if (opts?.type && opts.type !== "الكل") query = query.eq("type", opts.type);
    if (opts?.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error)) return { data: items, usingSeed: true };
      throw error;
    }
    let result = (data || []) as FiqhCouncilItem[];
    if (opts?.search?.trim()) result = filterSeed(result, opts, false);
    return { data: result, usingSeed: false };
  } catch (err) {
    logSupabaseError("getFiqhCouncilItemsAdmin", err);
    return { data: items, usingSeed: true };
  }
}

export async function getFiqhCouncilReviewItems(limit = 50) {
  if (!isConfigured) {
    return { data: FIQH_COUNCIL_ADMIN_ONLY_SEED.filter((i) => i.status === "review"), usingSeed: true };
  }
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .in("status", ["review", "draft"])
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { data: (data || []) as FiqhCouncilItem[], usingSeed: false };
  } catch (err) {
    logSupabaseError("getFiqhCouncilReviewItems", err);
    return { data: [], usingSeed: true };
  }
}

// Backward-compatible aliases
export async function getFiqhDecisions(opts?: { category?: string; search?: string; type?: string }) {
  const typeMap: Record<string, FiqhItemType | "الكل"> = {
    قرار: "resolution",
    "فتوى جماعية": "fatwa",
    بحث: "research",
    توصية: "recommendation",
    بيان: "ruling",
    حكم: "ruling",
  };
  const mappedType = opts?.type && opts.type !== "الكل" ? (typeMap[opts.type] || opts.type) : "الكل";
  const { data, usingSeed } = await getFiqhCouncilItems({
    category: (opts?.category as FiqhCouncilCategory) || "الكل",
    search: opts?.search,
    type: mappedType as FiqhItemType | "الكل",
  });
  const legacy = data.map(toLegacyDecision);
  return { data: legacy, usingSeed };
}

export async function getFiqhDecisionById(id: string) {
  const { data, usingSeed } = await getFiqhCouncilItemBySlug(id);
  return { data: data ? toLegacyDecision(data) : null, usingSeed };
}

export async function getRelatedFiqhDecisions(currentId: string, category?: string, limit = 4) {
  const related = await getRelatedFiqhCouncilItems(currentId, category, limit);
  return related.map(toLegacyDecision);
}

function toLegacyDecision(item: FiqhCouncilItem) {
  const typeLabels: Record<FiqhItemType, string> = {
    resolution: "قرار",
    fatwa: "فتوى جماعية",
    research: "بحث",
    recommendation: "توصية",
    ruling: "حكم",
  };
  return {
    id: item.slug,
    external_key: item.slug,
    title: item.title,
    summary: item.summary,
    body: item.content || item.ruling_text,
    decision_type: typeLabels[item.type],
    category: item.category,
    session_number: item.session_number,
    decision_date: item.session_date,
    source_urls: item.source_url ? [item.source_url] : [],
    references: item.evidence,
    keywords: item.tags,
    status: item.status === "published" ? "approved" : item.status,
    view_count: item.views_count,
    created_at: item.created_at,
    updated_at: item.updated_at,
    slug: item.slug,
    type: item.type,
    content: item.content,
    ruling_text: item.ruling_text,
    source_name: item.source_name,
    source_url: item.source_url,
    council_name: item.council_name,
    published_at: item.published_at,
  };
}

export { FIQH_COUNCIL_PUBLISHED_SEED as FIQH_COUNCIL_SEED };
