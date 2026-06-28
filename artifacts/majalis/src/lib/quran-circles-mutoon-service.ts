import { arabicMatchAny } from "./arabic-search";
import { QURAN_CIRCLES_SEED, findQuranCircleById } from "./quran-circles-seed";
import { MUTOON_SEED, findMutoonById } from "./mutoon-seed";
import { supabase, isSupabaseConfigured } from "./supabase";
import { logSupabaseError } from "./supabase-config";
import type { ContactMessage, MutoonLesson, MutoonText, QuranCircle } from "./platform-types";

const isConfigured = isSupabaseConfigured();

function filterBySearch<T>(items: T[], fields: string[], query?: string): T[] {
  if (!query?.trim()) return items;
  return items.filter((item) =>
    arabicMatchAny(
      fields.map((f) => String((item as Record<string, unknown>)[f] ?? "")),
      query.trim(),
    ),
  );
}

// ─── Quran Circles ───────────────────────────────────────────────────────────

export async function getQuranCircles(opts?: { type?: string; city?: string; search?: string }) {
  let items = [...QURAN_CIRCLES_SEED];
  if (opts?.type && opts.type !== "الكل") {
    items = items.filter((c) => c.circle_type === opts.type);
  }
  if (opts?.city && opts.city !== "الكل") {
    items = items.filter((c) => c.city === opts.city);
  }
  items = filterBySearch(items, ["title", "summary", "sheikh_name", "mosque", "city"], opts?.search);

  if (!isConfigured) return { data: items, usingSeed: true };

  try {
    let query = supabase
      .from("quran_circles")
      .select("*")
      .eq("status", "approved")
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (opts?.type && opts.type !== "الكل") query = query.eq("circle_type", opts.type);
    if (opts?.city && opts.city !== "الكل") query = query.eq("city", opts.city);

    const { data, error } = await query;
    if (error) throw error;

    let result = (data || []) as QuranCircle[];
    if (opts?.search?.trim()) {
      result = filterBySearch(result, ["title", "summary", "sheikh_name"], opts.search);
    }
    if (result.length === 0 && items.length > 0) return { data: items, usingSeed: true };
    return { data: result, usingSeed: false };
  } catch (err) {
    logSupabaseError("getQuranCircles", err);
    return { data: items, usingSeed: true };
  }
}

export async function getQuranCircleById(id: string) {
  const fallback = findQuranCircleById(id);
  if (!isConfigured) return { data: fallback, usingSeed: true };

  try {
    const byId = await supabase.from("quran_circles").select("*").eq("id", id).eq("status", "approved").maybeSingle();
    if (byId.data) return { data: byId.data as QuranCircle, usingSeed: false };

    const bySlug = await supabase.from("quran_circles").select("*").eq("slug", id).eq("status", "approved").maybeSingle();
    if (bySlug.data) return { data: bySlug.data as QuranCircle, usingSeed: false };

    const byKey = await supabase.from("quran_circles").select("*").eq("external_key", id).eq("status", "approved").maybeSingle();
    return { data: (byKey.data as QuranCircle) || fallback, usingSeed: !byKey.data && !!fallback };
  } catch (err) {
    logSupabaseError("getQuranCircleById", err, { id });
    return { data: fallback, usingSeed: true };
  }
}

export async function getRelatedQuranCircles(currentId: string, limit = 4) {
  const { data } = await getQuranCircles();
  return data.filter((c) => c.id !== currentId).slice(0, limit);
}

// ─── Mutoon ──────────────────────────────────────────────────────────────────

export async function getMutoonTexts(opts?: { category?: string; level?: string; search?: string }) {
  let items = [...MUTOON_SEED];
  if (opts?.category && opts.category !== "الكل") {
    items = items.filter((m) => m.category === opts.category);
  }
  if (opts?.level && opts.level !== "الكل") {
    items = items.filter((m) => m.level === opts.level);
  }
  items = filterBySearch(items, ["title", "author", "summary", "body"], opts?.search);

  if (!isConfigured) return { data: items, usingSeed: true };

  try {
    let query = supabase
      .from("mutoon_texts")
      .select("*")
      .eq("status", "approved")
      .is("archived_at", null)
      .order("title");

    if (opts?.category && opts.category !== "الكل") query = query.eq("category", opts.category);
    if (opts?.level && opts.level !== "الكل") query = query.eq("level", opts.level);

    const { data, error } = await query;
    if (error) throw error;

    let result = (data || []) as MutoonText[];
    if (opts?.search?.trim()) {
      result = filterBySearch(result, ["title", "author", "summary"], opts.search);
    }
    if (result.length === 0 && items.length > 0) return { data: items, usingSeed: true };
    return { data: result, usingSeed: false };
  } catch (err) {
    logSupabaseError("getMutoonTexts", err);
    return { data: items, usingSeed: true };
  }
}

export async function getMutoonById(id: string) {
  const fallback = findMutoonById(id);
  if (!isConfigured) return { data: fallback, usingSeed: true };

  try {
    const byId = await supabase.from("mutoon_texts").select("*").eq("id", id).eq("status", "approved").maybeSingle();
    if (byId.data) return { data: byId.data as MutoonText, usingSeed: false };

    const bySlug = await supabase.from("mutoon_texts").select("*").eq("slug", id).eq("status", "approved").maybeSingle();
    if (bySlug.data) return { data: bySlug.data as MutoonText, usingSeed: false };

    const byKey = await supabase.from("mutoon_texts").select("*").eq("external_key", id).eq("status", "approved").maybeSingle();
    return { data: (byKey.data as MutoonText) || fallback, usingSeed: !byKey.data && !!fallback };
  } catch (err) {
    logSupabaseError("getMutoonById", err, { id });
    return { data: fallback, usingSeed: true };
  }
}

export async function getMutoonLessons(mutoonId: string) {
  if (!isConfigured) return { data: [] as MutoonLesson[], usingSeed: true };

  try {
    const { data, error } = await supabase
      .from("mutoon_lessons")
      .select("*")
      .eq("mutoon_id", mutoonId)
      .eq("status", "approved")
      .order("sort_order");
    if (error) throw error;
    return { data: (data || []) as MutoonLesson[], usingSeed: false };
  } catch (err) {
    logSupabaseError("getMutoonLessons", err, { mutoonId });
    return { data: [], usingSeed: true };
  }
}

export async function getRelatedMutoon(currentId: string, limit = 4) {
  const { data } = await getMutoonTexts();
  return data.filter((m) => m.id !== currentId).slice(0, limit);
}

// ─── Contact Messages ────────────────────────────────────────────────────────

export async function submitContactMessage(msg: ContactMessage) {
  if (!isConfigured) {
    return { data: null, error: new Error("خدمة التواصل غير متاحة حالياً") };
  }

  const payload = {
    name: msg.name.trim(),
    email: msg.email.trim(),
    subject: msg.subject?.trim() || "استفسار عام",
    message: msg.message.trim(),
    category: msg.category || "general",
    status: "new",
  };

  const { data, error } = await supabase.from("contact_messages").insert(payload).select("id").single();
  if (error) logSupabaseError("submitContactMessage", error);
  return { data, error };
}

export { QURAN_CIRCLES_SEED, MUTOON_SEED };
