/**
 * Personal learning achievements — awarded from real user progress.
 */
import { supabase } from "@/lib/supabase";
import type { AcademicProfileStats } from "./types";

export type AchievementDef = {
  key: string;
  title: string;
  description: string;
  icon: string;
};

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  { key: "first_lesson", title: "أول درس", description: "أكملت أو حفظت أول درس", icon: "📖" },
  { key: "lessons_10", title: "10 دروس", description: "عشرة دروس في رصيدك العلمي", icon: "📚" },
  { key: "lessons_100", title: "100 درس", description: "مائة درس — استمر!", icon: "🏆" },
  { key: "first_book", title: "أول كتاب", description: "حفظت أول كتاب في مكتبتك", icon: "📕" },
  { key: "first_research", title: "أول بحث", description: "قرأت أول بحث علمي", icon: "🔬" },
  { key: "first_mutoon", title: "أول متن", description: "بدأت بأول متن علمي", icon: "📜" },
  { key: "qa_100_correct", title: "100 سؤال", description: "مائة سؤال في المراجعات", icon: "✅" },
  { key: "weekly_plan_done", title: "خطة أسبوعية", description: "أكملت أهداف الأسبوع", icon: "📅" },
  { key: "streak_7", title: "7 أيام متتالية", description: "المحافظة على التعلم أسبوعًا", icon: "🔥" },
];

type StatsInput = Partial<AcademicProfileStats> & {
  saved_lessons?: number;
  weekly_goals_done?: boolean;
};

function eligibleKeys(stats: StatsInput): string[] {
  const lessons = Math.max(stats.completed_lessons ?? 0, stats.saved_lessons ?? 0);
  const keys: string[] = [];
  if (lessons >= 1) keys.push("first_lesson");
  if (lessons >= 10) keys.push("lessons_10");
  if (lessons >= 100) keys.push("lessons_100");
  if ((stats.books_read ?? 0) >= 1) keys.push("first_book");
  if ((stats.research_read ?? 0) >= 1) keys.push("first_research");
  if ((stats.mutoon_studied ?? 0) >= 1) keys.push("first_mutoon");
  if ((stats.questions_answered ?? 0) >= 100) keys.push("qa_100_correct");
  if (stats.weekly_goals_done) keys.push("weekly_plan_done");
  if ((stats.current_streak ?? 0) >= 7) keys.push("streak_7");
  return keys;
}

export async function fetchUserAchievements(): Promise<Array<AchievementDef & { earned_at: string }>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_learning_achievements")
    .select("achievement_key, title, earned_at")
    .eq("user_id", user.id)
    .order("earned_at", { ascending: false });

  const byKey = new Map((data || []).map((r) => [r.achievement_key, r]));
  return ACHIEVEMENT_DEFINITIONS.filter((d) => byKey.has(d.key)).map((d) => ({
    ...d,
    earned_at: byKey.get(d.key)!.earned_at,
  }));
}

export async function checkAndAwardAchievements(stats: StatsInput): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const eligible = eligibleKeys(stats);
  if (!eligible.length) return [];

  const { data: existing } = await supabase
    .from("user_learning_achievements")
    .select("achievement_key")
    .eq("user_id", user.id);

  const have = new Set((existing || []).map((r) => r.achievement_key));
  const newly = eligible.filter((k) => !have.has(k));
  if (!newly.length) return [];

  const rows = newly.map((key) => {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.key === key)!;
    return {
      user_id: user.id,
      achievement_key: key,
      title: def.title,
      description: def.description,
      metadata: { icon: def.icon },
    };
  });

  await supabase.from("user_learning_achievements").upsert(rows, { onConflict: "user_id,achievement_key" });

  for (const key of newly) {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.key === key)!;
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: `إنجاز جديد: ${def.title}`,
      body: def.description,
      type: "achievement",
      link: "/my-profile",
    }).then(() => undefined);
  }

  return newly;
}

export function achievementProgress(stats: StatsInput): Array<AchievementDef & { earned: boolean; progress: number }> {
  const earned = new Set(eligibleKeys(stats));
  return ACHIEVEMENT_DEFINITIONS.map((def) => {
    let progress = 0;
    const lessons = Math.max(stats.completed_lessons ?? 0, stats.saved_lessons ?? 0);
    if (def.key === "first_lesson") progress = Math.min(100, lessons * 100);
    else if (def.key === "lessons_10") progress = Math.min(100, (lessons / 10) * 100);
    else if (def.key === "lessons_100") progress = Math.min(100, (lessons / 100) * 100);
    else if (def.key === "first_book") progress = (stats.books_read ?? 0) >= 1 ? 100 : 0;
    else if (def.key === "first_research") progress = (stats.research_read ?? 0) >= 1 ? 100 : 0;
    else if (def.key === "first_mutoon") progress = (stats.mutoon_studied ?? 0) >= 1 ? 100 : 0;
    else if (def.key === "qa_100_correct") progress = Math.min(100, ((stats.questions_answered ?? 0) / 100) * 100);
    else if (def.key === "streak_7") progress = Math.min(100, ((stats.current_streak ?? 0) / 7) * 100);
    else if (def.key === "weekly_plan_done") progress = stats.weekly_goals_done ? 100 : 0;
    return { ...def, earned: earned.has(def.key), progress: Math.round(progress) };
  });
}
