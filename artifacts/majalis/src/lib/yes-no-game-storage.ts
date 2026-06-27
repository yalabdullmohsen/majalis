import type { MatchProgress } from "./sin-jeem-engine";
import type { YesNoCategory } from "./yes-no-game-seed";

const FAV_KEY = "majalis-sin-jeem-favorites-v1";
const POS_KEY = "majalis-sin-jeem-position-v1";
const MATCH_KEY = "majalis-sin-jeem-match-v1";
const LEADER_KEY = "majalis-sin-jeem-leaderboard-v1";
const STATS_KEY = "majalis-sin-jeem-stats-v1";

export type LeaderboardEntry = {
  id: string;
  teamName: string;
  score: number;
  category: YesNoCategory | "all";
  mode: "solo" | "team";
  at: number;
};

export type SinJeemStats = {
  gamesPlayed: number;
  totalCorrect: number;
  totalWrong: number;
  bestSoloScore: number;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function getSinJeemFavorites(): string[] {
  return readJson<string[]>(FAV_KEY, []);
}

export function toggleSinJeemFavorite(id: string): string[] {
  const current = getSinJeemFavorites();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  writeJson(FAV_KEY, next);
  return next;
}

export function saveSinJeemPosition(index: number, questionId: string) {
  writeJson(POS_KEY, { index, questionId, at: Date.now() });
}

export function getSinJeemPosition(): { index: number; questionId: string } | null {
  return readJson(POS_KEY, null);
}

export function saveActiveMatch(match: MatchProgress | null) {
  writeJson(MATCH_KEY, match);
}

export function getActiveMatch(): MatchProgress | null {
  return readJson<MatchProgress | null>(MATCH_KEY, null);
}

export function pushLeaderboard(entry: Omit<LeaderboardEntry, "id" | "at">) {
  const list = readJson<LeaderboardEntry[]>(LEADER_KEY, []);
  const row: LeaderboardEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
  };
  const next = [row, ...list].sort((a, b) => b.score - a.score).slice(0, 20);
  writeJson(LEADER_KEY, next);
  return next;
}

export function getLeaderboard(): LeaderboardEntry[] {
  return readJson<LeaderboardEntry[]>(LEADER_KEY, []);
}

export function getSinJeemStats(): SinJeemStats {
  return readJson<SinJeemStats>(STATS_KEY, {
    gamesPlayed: 0,
    totalCorrect: 0,
    totalWrong: 0,
    bestSoloScore: 0,
  });
}

export function recordMatchResult(match: MatchProgress, soloScore?: number) {
  const stats = getSinJeemStats();
  stats.gamesPlayed += 1;
  stats.totalCorrect += match.correct;
  stats.totalWrong += match.wrong;
  if (soloScore != null) stats.bestSoloScore = Math.max(stats.bestSoloScore, soloScore);
  writeJson(STATS_KEY, stats);
}
