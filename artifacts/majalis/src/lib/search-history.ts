import { supabase } from "./supabase";
import { isSupabaseConfigured } from "./supabase-config";
import { logSupabaseError } from "./supabase-config";

const STORAGE_KEY = "majalis-search-history";
const ANALYTICS_KEY = "majalis-search-analytics";
const MAX_HISTORY = 12;
const SESSION_KEY = "majalis-search-session";

export type SearchHistoryEntry = {
  query: string;
  at: number;
};

function sessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `anon-${Date.now()}`;
  }
}

function readLocalHistory(): SearchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SearchHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalHistory(entries: SearchHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {
    /* quota */
  }
}

async function fetchSupabaseHistory(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    let query = supabase.from("user_search_history").select("query").order("created_at", { ascending: false }).limit(MAX_HISTORY);
    if (user?.id) {
      query = query.eq("user_id", user.id);
    } else {
      query = query.eq("session_id", sessionId());
    }
    const { data, error } = await query;
    if (error) throw error;
    return [...new Set((data || []).map((r) => r.query))];
  } catch (err) {
    logSupabaseError("fetchSupabaseHistory", err);
    return [];
  }
}

async function persistSupabaseHistory(query: string, resultCount = 0) {
  if (!isSupabaseConfigured()) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("user_search_history").insert({
      user_id: user?.id || null,
      session_id: user?.id ? null : sessionId(),
      query,
      result_count: resultCount,
    });

    const { data: existing } = await supabase.from("search_analytics").select("id, hit_count").eq("query", query).maybeSingle();
    if (existing?.id) {
      await supabase.from("search_analytics").update({ hit_count: (existing.hit_count || 0) + 1, last_searched_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("search_analytics").insert({ query, hit_count: 1 });
    }
  } catch (err) {
    logSupabaseError("persistSupabaseHistory", err);
  }
}

export function getSearchHistory(): string[] {
  const local = readLocalHistory().map((e) => e.query);
  void fetchSupabaseHistory().then((remote) => {
    if (remote.length > 0) writeLocalHistory(remote.map((q) => ({ query: q, at: Date.now() })));
  });
  return local;
}

export function addSearchHistory(query: string, resultCount = 0) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return;

  const next = [{ query: trimmed, at: Date.now() }, ...readLocalHistory().filter((e) => e.query !== trimmed)];
  writeLocalHistory(next);
  void persistSupabaseHistory(trimmed, resultCount);

  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    const counts = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    counts[trimmed] = (counts[trimmed] || 0) + 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 50);
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(Object.fromEntries(sorted)));
  } catch {
    /* optional cache */
  }
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export async function getTopSearchQueries(limit = 8): Promise<{ query: string; count: number }[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("search_analytics")
        .select("query, hit_count")
        .order("hit_count", { ascending: false })
        .limit(limit);
      if (!error && data?.length) {
        return data.map((r) => ({ query: r.query, count: r.hit_count }));
      }
    } catch (err) {
      logSupabaseError("getTopSearchQueries", err);
    }
  }

  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    if (!raw) return [];
    const counts = JSON.parse(raw) as Record<string, number>;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  } catch {
    return [];
  }
}
