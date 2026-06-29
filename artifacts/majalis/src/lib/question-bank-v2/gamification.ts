/** Local gamification — XP, levels, badges (synced to Supabase when available) */

const STATS_KEY = "majalis-qb-v2-game-stats";
const BADGES_KEY = "majalis-qb-v2-badges";

export type LocalGameStats = {
  xp: number;
  level: number;
  totalCorrect: number;
  totalAnswered: number;
  weeklyXp: number;
  monthlyXp: number;
  weekStart: string;
  monthStart: string;
};

export function loadGameStats(): LocalGameStats {
  const defaults: LocalGameStats = {
    xp: 0,
    level: 1,
    totalCorrect: 0,
    totalAnswered: 0,
    weeklyXp: 0,
    monthlyXp: 0,
    weekStart: new Date().toISOString().slice(0, 10),
    monthStart: new Date().toISOString().slice(0, 7),
  };
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? { ...defaults, ...(JSON.parse(raw) as LocalGameStats) } : defaults;
  } catch {
    return defaults;
  }
}

function saveGameStats(stats: LocalGameStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* ignore */
  }
}

function xpForLevel(level: number): number {
  return level * 100;
}

export function recordGameXp(correct: boolean, streak = 0): LocalGameStats {
  const stats = loadGameStats();
  const today = new Date().toISOString().slice(0, 10);
  const month = new Date().toISOString().slice(0, 7);

  if (stats.weekStart !== today.slice(0, 10)) {
    stats.weeklyXp = 0;
    stats.weekStart = today;
  }
  if (stats.monthStart !== month) {
    stats.monthlyXp = 0;
    stats.monthStart = month;
  }

  stats.totalAnswered += 1;
  if (correct) {
    const gain = 10 + Math.min(streak * 2, 10);
    stats.totalCorrect += 1;
    stats.xp += gain;
    stats.weeklyXp += gain;
    stats.monthlyXp += gain;
  }

  while (stats.xp >= xpForLevel(stats.level + 1)) {
    stats.level += 1;
    awardBadge(`level-${stats.level}`);
  }

  if (stats.totalCorrect >= 10) awardBadge("ten-correct");
  if (stats.totalCorrect >= 50) awardBadge("fifty-correct");

  saveGameStats(stats);
  return stats;
}

export function loadBadges(): string[] {
  try {
    const raw = localStorage.getItem(BADGES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function awardBadge(key: string): void {
  const badges = loadBadges();
  if (!badges.includes(key)) {
    badges.push(key);
    try {
      localStorage.setItem(BADGES_KEY, JSON.stringify(badges));
    } catch {
      /* ignore */
    }
  }
}

export function computeMatchXp(correctCount: number, total: number): number {
  const pct = total ? correctCount / total : 0;
  return Math.round(correctCount * 10 + pct * 20);
}
