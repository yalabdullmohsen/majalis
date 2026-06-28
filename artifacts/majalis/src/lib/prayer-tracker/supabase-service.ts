import { ACHIEVEMENTS } from "./constants";
import { safeSupabaseQuery, safeSupabaseWrite } from "@/lib/safe-supabase";
import { supabase } from "@/lib/supabase";
import type { AchievementKey, PrayerSession, PrayerStats } from "./types";
import { aggregateStats, computeRankMetrics30, resolveRank } from "./scoring";
import type { PrayerStore } from "./types";
import { sessionsToStore } from "./storage";

type DbSession = {
  id: string;
  user_id: string;
  prayer_date: string;
  prayer_key: string;
  status: string;
  place: string;
  congregation: boolean;
  is_first_time: boolean;
  notes: string | null;
  points_earned: number;
  prayed_at: string | null;
  updated_at: string;
};

function rowToSession(row: DbSession): PrayerSession {
  return {
    id: row.id,
    prayerDate: row.prayer_date,
    prayerKey: row.prayer_key as PrayerSession["prayerKey"],
    status: row.status as PrayerSession["status"],
    place: row.place as PrayerSession["place"],
    congregation: row.congregation,
    isFirstTime: row.is_first_time,
    notes: row.notes || "",
    pointsEarned: row.points_earned,
    prayedAt: row.prayed_at,
    updatedAt: row.updated_at,
  };
}

function sessionToRow(userId: string, s: PrayerSession) {
  return {
    user_id: userId,
    prayer_date: s.prayerDate,
    prayer_key: s.prayerKey,
    status: s.status,
    place: s.place,
    congregation: s.congregation,
    is_first_time: s.isFirstTime,
    notes: s.notes || null,
    points_earned: s.pointsEarned,
    prayed_at: s.prayedAt || (s.status === "done" ? new Date().toISOString() : null),
    updated_at: s.updatedAt || new Date().toISOString(),
  };
}

export async function loadPrayerSessionsFromDb(userId: string, days = 400): Promise<PrayerStore> {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const fromKey = from.toISOString().slice(0, 10);

  const { data } = await safeSupabaseQuery(
    "prayer:sessions:load",
    () =>
      supabase
        .from("prayer_sessions")
        .select("*")
        .eq("user_id", userId)
        .gte("prayer_date", fromKey)
        .order("prayer_date", { ascending: false }),
    [] as DbSession[],
  );

  return sessionsToStore((data || []).map(rowToSession));
}

export async function upsertPrayerSession(userId: string, session: PrayerSession) {
  return safeSupabaseWrite("prayer:session:upsert", () =>
    supabase.from("prayer_sessions").upsert(sessionToRow(userId, session), {
      onConflict: "user_id,prayer_date,prayer_key",
    }),
  );
}

export async function syncPrayerStoreToDb(userId: string, store: PrayerStore) {
  const sessions: PrayerSession[] = [];
  for (const day of Object.values(store)) {
    for (const s of Object.values(day)) {
      if (s.status !== "pending") sessions.push(s);
    }
  }
  if (!sessions.length) return { ok: true };

  const rows = sessions.map((s) => sessionToRow(userId, s));
  const { error } = await safeSupabaseWrite("prayer:sessions:bulk", () =>
    supabase.from("prayer_sessions").upsert(rows, { onConflict: "user_id,prayer_date,prayer_key" }),
  );
  return { ok: !error, error };
}

export async function loadAchievementsFromDb(userId: string): Promise<Set<AchievementKey>> {
  const { data } = await safeSupabaseQuery(
    "prayer:achievements:load",
    () => supabase.from("prayer_achievements").select("achievement_key").eq("user_id", userId),
    [] as { achievement_key: string }[],
  );
  return new Set((data || []).map((r) => r.achievement_key as AchievementKey));
}

export async function saveAchievementsToDb(userId: string, keys: AchievementKey[]) {
  if (!keys.length) return;
  const rows = keys.map((key) => {
    const def = ACHIEVEMENTS.find((a) => a.key === key);
    return {
      user_id: userId,
      achievement_key: key,
      title: def?.title || key,
      description: def?.description || "",
    };
  });
  await safeSupabaseWrite("prayer:achievements:save", () =>
    supabase.from("prayer_achievements").upsert(rows, { onConflict: "user_id,achievement_key" }),
  );
}

export async function refreshPrayerAggregates(userId: string, store: PrayerStore) {
  const stats: PrayerStats = aggregateStats(store);
  const rank = resolveRank(computeRankMetrics30(store));

  await safeSupabaseWrite("prayer:stats:upsert", () =>
    supabase.from("prayer_statistics").upsert({
      user_id: userId,
      total_prayers: stats.totalPrayers,
      total_missed: stats.totalMissed,
      total_mosque: stats.totalMosque,
      total_home: stats.totalHome,
      total_congregation: stats.totalCongregation,
      total_first_time: stats.totalFirstTime,
      total_points: stats.totalPoints,
      fajr_count: stats.fajrCount,
      full_days_count: stats.fullDaysCount,
      best_prayer_key: stats.bestPrayerKey,
      best_week_prayers: stats.bestWeekPrayers,
      best_month_prayers: stats.bestMonthPrayers,
      monthly_commitment_pct: stats.monthlyCommitmentPct,
      avg_daily_prayers: stats.avgDailyPrayers,
      updated_at: new Date().toISOString(),
    }),
  );

  await safeSupabaseWrite("prayer:streaks:upsert", () =>
    supabase.from("prayer_streaks").upsert({
      user_id: userId,
      current_streak: stats.currentStreak,
      longest_streak: stats.longestStreak,
      last_full_day: null,
      updated_at: new Date().toISOString(),
    }),
  );

  await safeSupabaseWrite("prayer:levels:upsert", () =>
    supabase.from("prayer_levels").upsert({
      user_id: userId,
      level: stats.level,
      total_points: stats.totalPoints,
      points_in_level: stats.pointsInLevel,
      updated_at: new Date().toISOString(),
    }),
  );

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 29);

  await safeSupabaseWrite("prayer:rank:upsert", () =>
    supabase.from("prayer_rank_history").upsert(
      {
        user_id: userId,
        rank_key: rank.key,
        rank_label: rank.label,
        rank_score: rank.score,
        period_start: monthAgo.toISOString().slice(0, 10),
        period_end: today,
        metrics: computeRankMetrics30(store),
      },
      { onConflict: "user_id,period_end" },
    ),
  );
}

export async function loadRecentPrayerLog(userId: string, limit = 100): Promise<PrayerSession[]> {
  const { data } = await safeSupabaseQuery(
    "prayer:log:load",
    () =>
      supabase
        .from("prayer_sessions")
        .select("*")
        .eq("user_id", userId)
        .neq("status", "pending")
        .order("prayer_date", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(limit),
    [] as DbSession[],
  );
  return (data || []).map(rowToSession);
}
