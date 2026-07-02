import { supabase } from "@/lib/supabase";

export type StudySession = {
  id: string;
  user_id: string;
  duration_minutes: number;
  goal: string | null;
  completed: boolean;
  session_date: string;
  created_at: string;
};

export type DailyStudyStats = {
  totalMinutesToday: number;
  sessionsToday: number;
  totalMinutesWeek: number;
  longestSession: number;
};

export async function logStudySession(
  userId: string,
  durationMinutes: number,
  goal?: string,
): Promise<void> {
  await supabase.from("study_sessions").insert({
    user_id: userId,
    duration_minutes: durationMinutes,
    goal: goal ?? null,
    completed: true,
    session_date: new Date().toISOString().slice(0, 10),
  });
}

export async function getDailyStudyStats(userId: string): Promise<DailyStudyStats> {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const { data } = await supabase
    .from("study_sessions")
    .select("duration_minutes, session_date, completed")
    .eq("user_id", userId)
    .gte("session_date", weekAgo)
    .order("session_date", { ascending: false });

  const rows = (data ?? []) as Pick<StudySession, "duration_minutes" | "session_date" | "completed">[];
  const todayRows = rows.filter((r) => r.session_date === today);

  return {
    totalMinutesToday: todayRows.reduce((s, r) => s + r.duration_minutes, 0),
    sessionsToday: todayRows.length,
    totalMinutesWeek: rows.reduce((s, r) => s + r.duration_minutes, 0),
    longestSession: rows.reduce((m, r) => Math.max(m, r.duration_minutes), 0),
  };
}

export async function getRecentSessions(userId: string, limit = 10): Promise<StudySession[]> {
  const { data } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as StudySession[];
}
