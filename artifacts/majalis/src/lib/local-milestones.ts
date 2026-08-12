/**
 * Local milestone flags for gamification badges (surah complete, adhkar streak).
 */

import { readLocalJson, writeLocalJson, isPlainObject } from "@/lib/safe-json";

const KEY = "majalis-local-milestones-v1";

export type LocalMilestones = {
  completedSurahs: number[];
  /** Consecutive calendar days morning adhkar marked done */
  morningAdhkarStreak: number;
  lastMorningAdhkarDate: string | null;
  /** Successful AI recitation ayah count (mirror) */
  recitationSuccessAyahs: number;
};

const DEFAULTS: LocalMilestones = {
  completedSurahs: [],
  morningAdhkarStreak: 0,
  lastMorningAdhkarDate: null,
  recitationSuccessAyahs: 0,
};

function isMilestones(v: unknown): v is LocalMilestones {
  return (
    isPlainObject(v) &&
    Array.isArray(v.completedSurahs) &&
    typeof v.morningAdhkarStreak === "number"
  );
}

function todayKey(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuwait",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function loadLocalMilestones(): LocalMilestones {
  const raw = readLocalJson<LocalMilestones>(KEY, DEFAULTS, isMilestones);
  return { ...DEFAULTS, ...raw, completedSurahs: [...(raw.completedSurahs ?? [])] };
}

function save(m: LocalMilestones): LocalMilestones {
  writeLocalJson(KEY, m);
  return m;
}

export function markSurahCompleted(surahNum: number): LocalMilestones {
  const m = loadLocalMilestones();
  const n = Math.floor(surahNum);
  if (!Number.isFinite(n) || n < 1 || n > 114) return m;
  if (!m.completedSurahs.includes(n)) m.completedSurahs.push(n);
  return save(m);
}

/** Call when user completes morning adhkar once per day. */
export function markMorningAdhkarDone(): LocalMilestones {
  const m = loadLocalMilestones();
  const today = todayKey();
  if (m.lastMorningAdhkarDate === today) return m;
  if (m.lastMorningAdhkarDate) {
    const prev = new Date(`${m.lastMorningAdhkarDate}T12:00:00`);
    const cur = new Date(`${today}T12:00:00`);
    const gap = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
    m.morningAdhkarStreak = gap === 1 ? m.morningAdhkarStreak + 1 : 1;
  } else {
    m.morningAdhkarStreak = 1;
  }
  m.lastMorningAdhkarDate = today;
  return save(m);
}

export function addRecitationSuccessAyahs(count: number): LocalMilestones {
  const m = loadLocalMilestones();
  m.recitationSuccessAyahs += Math.max(0, Math.floor(count));
  return save(m);
}
