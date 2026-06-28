import type { GameSession, LeaderboardEntry, MatchResult } from "./types";

const SESSION_KEY = "sin-jeem-session";
const HISTORY_KEY = "sin-jeem-history";
const LEADERBOARD_KEY = "sin-jeem-leaderboard";
const STATS_KEY = "sin-jeem-stats";

export function saveSession(session: GameSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore quota */
  }
}

export function loadSession(): GameSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as GameSession) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function saveMatchResult(result: MatchResult, mode: string): void {
  try {
    const history = loadHistory();
    history.unshift({
      ...result,
      mode,
      savedAt: Date.now(),
    });
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));

    updateLeaderboard(result);
    incrementStats();
  } catch {
    /* ignore */
  }
}

export function loadHistory(): Array<MatchResult & { mode: string; savedAt: number }> {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function updateLeaderboard(result: MatchResult): void {
  const board = loadLeaderboard();
  const entries = [
    { name: result.teamA.name, score: result.teamA.score, win: result.winner === "a" || result.winner === "solo" },
    ...(result.teamB.name ? [{ name: result.teamB.name, score: result.teamB.score, win: result.winner === "b" }] : []),
  ];

  for (const e of entries) {
    const existing = board.find((b) => b.name === e.name);
    if (existing) {
      existing.score += e.score;
      existing.games += 1;
      if (e.win) existing.wins += 1;
    } else {
      board.push({ id: `lb-${e.name}`, name: e.name, score: e.score, games: 1, wins: e.win ? 1 : 0, rank: 0 });
    }
  }

  board.sort((a, b) => b.score - a.score);
  board.forEach((b, i) => { b.rank = i + 1; });
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board.slice(0, 100)));
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function incrementStats(): void {
  const stats = loadLocalStats();
  stats.matchCount += 1;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function loadLocalStats(): { matchCount: number; playerCount: number } {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : { matchCount: 0, playerCount: 0 };
  } catch {
    return { matchCount: 0, playerCount: 0 };
  }
}

export function trackPlayer(name: string): void {
  const key = "sin-jeem-players";
  try {
    const raw = localStorage.getItem(key);
    const set = new Set<string>(raw ? JSON.parse(raw) : []);
    set.add(name.trim());
    localStorage.setItem(key, JSON.stringify([...set]));
    const stats = loadLocalStats();
    stats.playerCount = set.size;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* ignore */
  }
}

export function getPlayerCount(): number {
  try {
    const raw = localStorage.getItem("sin-jeem-players");
    const set: string[] = raw ? JSON.parse(raw) : [];
    return set.length;
  } catch {
    return 0;
  }
}
