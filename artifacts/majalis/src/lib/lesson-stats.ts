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
    // عدد المشاهدات عام؛ bookmarks محمي بـ RLS — لا يُطلب للزائر غير المسجّل (401).
    const { data: sessionData } = await supabase.auth.getSession();
    const isAuthed = Boolean(sessionData?.session?.user?.id);

    const viewsPromise = supabase
      .from("content_views")
      .select("id", { count: "exact", head: true })
      .eq("content_type", "lesson")
      .eq("content_id", contentId);

    const savesPromise = isAuthed
      ? supabase
          .from("bookmarks")
          .select("id", { count: "exact", head: true })
          .eq("content_type", "lesson")
          .eq("content_id", contentId)
      : Promise.resolve({ count: 0, error: null });

    const [viewsRes, savesRes] = await Promise.all([viewsPromise, savesPromise]);

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
