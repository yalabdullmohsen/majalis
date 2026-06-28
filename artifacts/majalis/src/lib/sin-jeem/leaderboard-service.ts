import type { LeaderboardEntry, MatchResult } from "./types";

export type LeaderboardPeriod = "day" | "week" | "month" | "all";

export type LeaderboardSnapshot = {
  players: LeaderboardEntry[];
  teams: LeaderboardEntry[];
  period: LeaderboardPeriod;
};

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  day: "اليوم",
  week: "الأسبوع",
  month: "الشهر",
  all: "الكل",
};

export function periodLabel(period: LeaderboardPeriod): string {
  return PERIOD_LABELS[period];
}

export async function fetchLeaderboardByPeriod(period: LeaderboardPeriod = "all"): Promise<LeaderboardSnapshot> {
  try {
    const res = await fetch(`/api/sin-jeem?action=leaderboard&period=${period}`, { credentials: "same-origin" });
    if (!res.ok) throw new Error("leaderboard_fetch_failed");
    const data = await res.json();
    if (data.ok) {
      return {
        players: data.players || [],
        teams: data.teams || [],
        period,
      };
    }
  } catch {
    /* fall through */
  }

  return { players: [], teams: [], period };
}

export async function submitVerifiedMatchResult(
  result: MatchResult,
  mode: string,
  sessionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const payload = {
    action: "submit_match",
    session_id: sessionId,
    mode,
    team_a_name: result.teamA.name,
    team_b_name: result.teamB.name || null,
    team_a_score: result.teamA.score,
    team_b_score: result.teamB.score,
    team_a_correct: result.teamA.correct,
    team_b_correct: result.teamB.correct,
    team_a_wrong: result.teamA.wrong,
    team_b_wrong: result.teamB.wrong,
    total_questions: result.totalQuestions,
    duration_ms: result.durationMs,
    winner: result.winner,
  };

  try {
    const res = await fetch("/api/sin-jeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "same-origin",
    });
    const data = await res.json();
    return { ok: Boolean(data.ok), error: data.error };
  } catch {
    return { ok: false, error: "network_error" };
  }
}
