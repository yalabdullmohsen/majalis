import { arabicMatchAny } from "./arabic-search";
import { supabase, isSupabaseConfigured } from "./supabase";
import { logSupabaseError } from "./supabase-config";
import {
  findCircleById,
  getPublicSeedCircles,
  QURAN_SCIENTIFIC_CIRCLES_SEED,
} from "./quran-scientific-circles-seed";
import type { CircleFilters, QuranScientificCircle, SortOption } from "./quran-scientific-circles-types";

const PUBLIC_STATUSES = ["published", "registration_open", "registration_closed", "ongoing"];
const isConfigured = isSupabaseConfigured();

const SEARCH_FIELDS: (keyof QuranScientificCircle)[] = [
  "title",
  "summary",
  "description",
  "organizer",
  "sheikh_name",
  "supervisor_name",
  "venue_name",
  "region",
  "governorate",
  "circle_type",
  "notes",
];

function parseDateKey(d?: string): number {
  if (!d) return Number.MAX_SAFE_INTEGER;
  const t = Date.parse(d);
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

function applyFilters(items: QuranScientificCircle[], filters: CircleFilters): QuranScientificCircle[] {
  let result = [...items];

  if (filters.tab && filters.tab !== "all") {
    result = result.filter((c) => c.tab_group === filters.tab);
  }
  if (filters.country && filters.country !== "الكل") {
    result = result.filter((c) => c.country === filters.country);
  }
  if (filters.governorate) {
    result = result.filter((c) => c.governorate === filters.governorate);
  }
  if (filters.region?.trim()) {
    const q = filters.region.trim();
    result = result.filter((c) => c.region?.includes(q));
  }
  if (filters.category) {
    result = result.filter(
      (c) => c.subcategory_slug === filters.category || c.circle_type === filters.category,
    );
  }
  if (filters.level) {
    result = result.filter((c) => c.level?.includes(filters.level!));
  }
  if (filters.gender && filters.gender !== "الكل") {
    result = result.filter(
      (c) => c.gender_access === filters.gender || c.gender_access === "عام",
    );
  }
  if (filters.delivery === "online") {
    result = result.filter((c) => c.is_online);
  } else if (filters.delivery === "offline") {
    result = result.filter((c) => c.has_attendance && !c.is_online);
  }
  if (filters.freeOnly) {
    result = result.filter((c) => c.is_free);
  }
  if (filters.hasCertificate) {
    result = result.filter((c) => c.has_certificate);
  }
  if (filters.hasIjazah) {
    result = result.filter((c) => c.has_ijazah);
  }
  if (filters.womenOnly) {
    result = result.filter((c) => c.gender_access === "نساء" || c.gender_access === "عام");
  }
  if (filters.childrenOnly) {
    result = result.filter((c) => c.gender_access === "أطفال" || c.target_audience === "أطفال");
  }
  if (filters.day) {
    result = result.filter((c) => c.days?.includes(filters.day!));
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    result = result.filter((c) =>
      arabicMatchAny(
        [
          ...SEARCH_FIELDS.map((f) => String(c[f] ?? "")),
          ...(c.keywords || []),
        ],
        q,
      ),
    );
  }

  return result;
}

function sortCircles(items: QuranScientificCircle[], sort: SortOption = "nearest"): QuranScientificCircle[] {
  const pinned = items.filter((c) => c.is_pinned);
  const rest = items.filter((c) => !c.is_pinned);

  const cmpNearest = (a: QuranScientificCircle, b: QuranScientificCircle): number => {
    const dateDiff = parseDateKey(a.start_date) - parseDateKey(b.start_date);
    if (dateDiff !== 0) return dateDiff;
    const createdDiff = parseDateKey(b.created_at) - parseDateKey(a.created_at);
    if (createdDiff !== 0) return createdDiff;
    const countryDiff = (a.country || "").localeCompare(b.country || "", "ar");
    if (countryDiff !== 0) return countryDiff;
    return (a.circle_type || "").localeCompare(b.circle_type || "", "ar");
  };

  const cmp = (a: QuranScientificCircle, b: QuranScientificCircle): number => {
    switch (sort) {
      case "newest":
        return parseDateKey(b.created_at) - parseDateKey(a.created_at);
      case "views":
        return (b.view_count || 0) - (a.view_count || 0);
      case "country":
        return (a.country || "").localeCompare(b.country || "", "ar") || cmpNearest(a, b);
      case "type":
        return (a.circle_type || "").localeCompare(b.circle_type || "", "ar") || cmpNearest(a, b);
      case "nearest":
      default:
        return cmpNearest(a, b);
    }
  };

  pinned.sort(cmp);
  rest.sort(cmp);
  return [...pinned, ...rest];
}

export async function getQuranScientificCircles(filters: CircleFilters = { tab: "all" }) {
  const seedPublic = getPublicSeedCircles();
  let items = applyFilters(seedPublic, filters);
  items = sortCircles(items, filters.sort);

  if (!isConfigured) return { data: items, usingSeed: true };

  try {
    let query = supabase
      .from("quran_scientific_circles")
      .select("*")
      .in("status", PUBLIC_STATUSES)
      .order("is_pinned", { ascending: false })
      .order("start_date", { ascending: true, nullsFirst: false });

    if (filters.tab && filters.tab !== "all") query = query.eq("tab_group", filters.tab);
    if (filters.country && filters.country !== "الكل") query = query.eq("country", filters.country);
    if (filters.governorate) query = query.eq("governorate", filters.governorate);

    const { data, error } = await query;
    if (error) throw error;

    let result = (data || []) as QuranScientificCircle[];
    result = applyFilters(result, filters);
    result = sortCircles(result, filters.sort);

    if (result.length === 0 && items.length > 0) return { data: items, usingSeed: true };
    return { data: result, usingSeed: false };
  } catch (err) {
    logSupabaseError("getQuranScientificCircles", err);
    return { data: items, usingSeed: true };
  }
}

export async function getQuranScientificCircleById(id: string) {
  const fallback = findCircleById(id);
  const isPublic = fallback && PUBLIC_STATUSES.includes(fallback.status);

  if (!isConfigured) {
    return { data: isPublic ? fallback : undefined, usingSeed: true };
  }

  try {
    const byId = await supabase
      .from("quran_scientific_circles")
      .select("*")
      .eq("id", id)
      .in("status", PUBLIC_STATUSES)
      .maybeSingle();
    if (byId.data) return { data: byId.data as QuranScientificCircle, usingSeed: false };

    const byKey = await supabase
      .from("quran_scientific_circles")
      .select("*")
      .eq("external_key", id)
      .in("status", PUBLIC_STATUSES)
      .maybeSingle();
    if (byKey.data) return { data: byKey.data as QuranScientificCircle, usingSeed: false };

    return { data: isPublic ? fallback : undefined, usingSeed: !byKey.data && !!fallback };
  } catch (err) {
    logSupabaseError("getQuranScientificCircleById", err, { id });
    return { data: isPublic ? fallback : undefined, usingSeed: true };
  }
}

export async function searchQuranScientificCircles(query: string, limit = 8) {
  const { data } = await getQuranScientificCircles({ tab: "all", search: query });
  return data.slice(0, limit).map((c) => ({
    id: c.id,
    title: c.title,
    searchMeta: [c.circle_type, c.country, c.governorate].filter(Boolean).join(" · "),
    tab_group: c.tab_group,
  }));
}

export function getCircleFilterOptions() {
  const publicItems = getPublicSeedCircles();
  const governorates = [...new Set(publicItems.map((c) => c.governorate).filter(Boolean))] as string[];
  const regions = [...new Set(publicItems.map((c) => c.region).filter(Boolean))] as string[];
  const types = [...new Set(publicItems.map((c) => c.circle_type).filter(Boolean))] as string[];
  const days = [...new Set(publicItems.flatMap((c) => c.days || []))];
  return { governorates, regions, types, days };
}

export { QURAN_SCIENTIFIC_CIRCLES_SEED };
