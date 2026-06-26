import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type LessonEngagementStats = {
  views: number;
  saves: number;
  shares: number;
};

const statsCache = new Map<string, { stats: LessonEngagementStats; at: number }>();
const CACHE_MS = 60_000;

export async function fetchLessonEngagementStats(contentId: string): Promise<LessonEngagementStats> {
  const cached = statsCache.get(contentId);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.stats;

  const empty: LessonEngagementStats = { views: 0, saves: 0, shares: 0 };
  if (!contentId || !isSupabaseConfigured()) return empty;

  try {
    const [viewsRes, savesRes] = await Promise.all([
      supabase
        .from("content_views")
        .select("*", { count: "exact", head: true })
        .eq("content_type", "lesson")
        .eq("content_id", contentId),
      supabase
        .from("bookmarks")
        .select("*", { count: "exact", head: true })
        .eq("content_type", "lesson")
        .eq("content_id", contentId),
    ]);

    const stats: LessonEngagementStats = {
      views: viewsRes.count || 0,
      saves: savesRes.count || 0,
      shares: 0,
    };
    statsCache.set(contentId, { stats, at: Date.now() });
    return stats;
  } catch {
    return empty;
  }
}
