import { supabase } from "@/lib/supabase";
import {
  BADGE_DEFS,
  BADGE_MAP,
  computeUserLevel,
  computeXp,
  type BadgeCheckStats,
  type UserLevel,
} from "@/lib/user-badges";
import { computeStreakDays, readTasbeehAwrad, computeTasbeehStats } from "@/lib/tasbeeh-storage";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ResumeItem = {
  content_type: string;
  content_id: string;
  content_title: string;
  content_url: string;
  thumbnail_icon: string;
  position: { pct?: number; section?: string; item_index?: number };
  last_opened_at: string;
};

export type EarnedBadge = {
  key: string;
  titleAr: string;
  descAr: string;
  icon: string;
  category: string;
  earned_at: string;
};

export type ProfileStats = {
  streakDays: number;
  completedLessons: number;
  booksRead: number;
  tasbihLifetime: number;
  tasbihToday: number;
  savedItems: number;
  pathsCompleted: string[];
  earnedBadges: EarnedBadge[];
  level: UserLevel;
  recitationSessions: number;
  recitationPerfectSessions: number;
  recitationVersesTotal: number;
};

// ─── Resume positions ─────────────────────────────────────────────────────────

export async function saveResumePosition(
  userId: string,
  item: Omit<ResumeItem, "last_opened_at">,
): Promise<void> {
  await supabase.from("reading_resume").upsert(
    {
      user_id: userId,
      content_type: item.content_type,
      content_id: item.content_id,
      content_title: item.content_title,
      content_url: item.content_url,
      thumbnail_icon: item.thumbnail_icon,
      position: item.position,
      last_opened_at: new Date().toISOString(),
    },
    { onConflict: "user_id,content_type,content_id" },
  );
}

export async function getResumeItems(userId: string): Promise<ResumeItem[]> {
  const { data } = await supabase
    .from("reading_resume")
    .select("content_type,content_id,content_title,content_url,thumbnail_icon,position,last_opened_at")
    .eq("user_id", userId)
    .order("last_opened_at", { ascending: false })
    .limit(5);
  return (data ?? []) as ResumeItem[];
}

export async function deleteResumeItem(
  userId: string,
  contentType: string,
  contentId: string,
): Promise<void> {
  await supabase
    .from("reading_resume")
    .delete()
    .eq("user_id", userId)
    .eq("content_type", contentType)
    .eq("content_id", contentId);
}

// ─── Aggregated profile stats ─────────────────────────────────────────────────

export async function getUserProfileStats(userId: string): Promise<ProfileStats> {
  // Run DB queries in parallel
  const [lessonsRes, bookmarksRes, badgesRes, pathsRes, recitationRes] = await Promise.all([
    supabase
      .from("lesson_registrations")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),

    supabase
      .from("bookmarks")
      .select("id,content_type", { count: "exact" })
      .eq("user_id", userId),

    supabase
      .from("achievements")
      .select("achievement_key,title,description,earned_at,metadata")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false }),

    supabase
      .from("lesson_registrations")
      .select("lesson_id")
      .eq("user_id", userId)
      .eq("status", "completed"),

    // اختبار التسميع بالذكاء الاصطناعي — جدول قد لا يزال بلا صفوف لمستخدم
    // جديد، أو (نادرًا) بلا الجدول نفسه على قاعدة لم تُطبَّق عليها
    // الهجرة بعد؛ كلا الحالتين تُعامَلان بأمان أدناه بقيم صفرية افتراضية.
    supabase
      .from("recitation_sessions")
      .select("accuracy_pct,verses_count")
      .eq("user_id", userId)
      .eq("status", "completed")
      .then((r) => r, () => ({ data: null, error: null } as { data: null; error: null })),
  ]);

  const completedLessons = lessonsRes.count ?? 0;
  const allBookmarks = bookmarksRes.data ?? [];
  const savedItems = bookmarksRes.count ?? 0;
  const booksRead = allBookmarks.filter((b: any) => b.content_type === "book").length;

  const rawBadges = badgesRes.data ?? [];
  const earnedBadges: EarnedBadge[] = rawBadges.map((b: any) => {
    const def = BADGE_MAP.get(b.achievement_key);
    return {
      key: b.achievement_key,
      titleAr: def?.titleAr ?? b.title,
      descAr: def?.descAr ?? b.description ?? "",
      icon: def?.icon ?? "Medal",
      category: def?.category ?? "content",
      earned_at: b.earned_at,
    };
  });

  const pathsCompleted: string[] = (pathsRes.data ?? []).map((r: any) => r.lesson_id as string);

  const recitationRows: Array<{ accuracy_pct: number | null; verses_count: number | null }> = recitationRes.data ?? [];
  const recitationSessions = recitationRows.length;
  const recitationPerfectSessions = recitationRows.filter((r) => r.accuracy_pct === 100).length;
  const recitationVersesTotal = recitationRows.reduce((sum, r) => sum + (r.verses_count ?? 0), 0);

  // Local stats (localStorage — available in browser only)
  const tasbihItems = typeof window !== "undefined" ? readTasbeehAwrad() : [];
  const streakDays = computeStreakDays(tasbihItems);
  const tasbihLifetime = tasbihItems.reduce((s, w) => s + (w.lifetimeTotal ?? 0), 0);
  const tasbihToday = tasbihItems.reduce((s, w) => s + computeTasbeehStats(w).today, 0);

  // XP and level
  const xp = computeXp({
    completedLessons,
    booksRead,
    streakDays,
    tasbihLifetime,
    savedItems,
    badgesEarned: earnedBadges.length,
    recitationVersesTotal,
  });
  const level = computeUserLevel(xp);

  return {
    streakDays,
    completedLessons,
    booksRead,
    tasbihLifetime,
    tasbihToday,
    savedItems,
    pathsCompleted,
    earnedBadges,
    level,
    recitationSessions,
    recitationPerfectSessions,
    recitationVersesTotal,
  };
}

// ─── Badge award (client-side evaluation → DB write) ─────────────────────────

export async function checkAndAwardBadges(
  userId: string,
  stats: ProfileStats,
): Promise<string[]> {
  const alreadyEarned = new Set(stats.earnedBadges.map((b) => b.key));

  const checkStats: BadgeCheckStats = {
    streakDays: stats.streakDays,
    completedLessons: stats.completedLessons,
    booksRead: stats.booksRead,
    tasbihLifetime: stats.tasbihLifetime,
    savedItems: stats.savedItems,
    pathsCompleted: stats.pathsCompleted,
    achievementsEarned: [...alreadyEarned],
    recitationSessions: stats.recitationSessions,
    recitationPerfectSessions: stats.recitationPerfectSessions,
    recitationVersesTotal: stats.recitationVersesTotal,
  };

  const newKeys: string[] = [];
  for (const def of BADGE_DEFS) {
    if (alreadyEarned.has(def.key)) continue;
    if (!def.condition(checkStats)) continue;
    newKeys.push(def.key);
  }

  if (newKeys.length === 0) return [];

  await supabase.from("achievements").upsert(
    newKeys.map((key) => {
      const def = BADGE_MAP.get(key)!;
      return {
        user_id: userId,
        achievement_key: key,
        title: def.titleAr,
        description: def.descAr,
        earned_at: new Date().toISOString(),
        metadata: { icon: def.icon, category: def.category },
      };
    }),
    { onConflict: "user_id,achievement_key" },
  );

  return newKeys;
}
