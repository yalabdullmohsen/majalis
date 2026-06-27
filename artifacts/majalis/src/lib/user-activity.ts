import { incrementChallenge } from "./challenges";

export type ActivityKind =
  | "quran"
  | "tafsir"
  | "lesson"
  | "qa"
  | "surah-story"
  | "faida"
  | "book"
  | "miracle"
  | "sin-jeem"
  | "adhkar";

export type ActivityItem = {
  kind: ActivityKind;
  id: string;
  title: string;
  href: string;
  meta?: string;
  at: number;
};

export type UsageStats = {
  quranSessions: number;
  lessonsWatched: number;
  qaAnswered: number;
  surahStoriesRead: number;
  fawaidRead: number;
  booksOpened: number;
  sinJeemGames: number;
  searchCount: number;
  totalVisits: number;
};

export type UserActivityState = {
  lastRead: ActivityItem | null;
  lastQa: ActivityItem | null;
  lastSurah: ActivityItem | null;
  lastLesson: ActivityItem | null;
  lastTafsir: ActivityItem | null;
  lastSurahStory: ActivityItem | null;
  lastSinJeem: ActivityItem | null;
  streakDays: number;
  lastVisitDate: string;
  stats: UsageStats;
  recent: ActivityItem[];
};

const STORAGE_KEY = "majalis-user-activity-v1";

const DEFAULT_STATS: UsageStats = {
  quranSessions: 0,
  lessonsWatched: 0,
  qaAnswered: 0,
  surahStoriesRead: 0,
  fawaidRead: 0,
  booksOpened: 0,
  sinJeemGames: 0,
  searchCount: 0,
  totalVisits: 0,
};

export const DEFAULT_ACTIVITY: UserActivityState = {
  lastRead: null,
  lastQa: null,
  lastSurah: null,
  lastLesson: null,
  lastTafsir: null,
  lastSurahStory: null,
  lastSinJeem: null,
  streakDays: 0,
  lastVisitDate: "",
  stats: { ...DEFAULT_STATS },
  recent: [],
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function readActivity(): UserActivityState {
  if (typeof window === "undefined") return { ...DEFAULT_ACTIVITY, stats: { ...DEFAULT_STATS }, recent: [] };
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!raw) return { ...DEFAULT_ACTIVITY, stats: { ...DEFAULT_STATS }, recent: [] };
    return {
      ...DEFAULT_ACTIVITY,
      ...raw,
      stats: { ...DEFAULT_STATS, ...(raw.stats || {}) },
      recent: Array.isArray(raw.recent) ? raw.recent : [],
    };
  } catch {
    return { ...DEFAULT_ACTIVITY, stats: { ...DEFAULT_STATS }, recent: [] };
  }
}

function writeActivity(state: UserActivityState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("majalis-activity-updated"));
}

export function recordVisit() {
  const state = readActivity();
  const today = todayKey();
  if (state.lastVisitDate === today) {
    state.stats.totalVisits += 1;
    writeActivity(state);
    return state;
  }
  if (state.lastVisitDate === yesterdayKey()) {
    state.streakDays = Math.max(1, state.streakDays) + 1;
  } else if (state.lastVisitDate) {
    state.streakDays = 1;
  } else {
    state.streakDays = 1;
  }
  state.lastVisitDate = today;
  state.stats.totalVisits += 1;
  writeActivity(state);
  return state;
}

export function recordActivity(
  item: Omit<ActivityItem, "at"> & { at?: number },
  statKey?: keyof UsageStats,
) {
  const state = readActivity();
  const entry: ActivityItem = { ...item, at: item.at ?? Date.now() };
  state.recent = [entry, ...state.recent.filter((r) => !(r.kind === entry.kind && r.id === entry.id))].slice(0, 40);

  switch (item.kind) {
    case "quran":
      state.lastSurah = entry;
      state.lastRead = entry;
      state.stats.quranSessions += 1;
      break;
    case "tafsir":
      state.lastTafsir = entry;
      state.lastRead = entry;
      break;
    case "lesson":
      state.lastLesson = entry;
      state.lastRead = entry;
      state.stats.lessonsWatched += 1;
      break;
    case "qa":
      state.lastQa = entry;
      state.lastRead = entry;
      state.stats.qaAnswered += 1;
      break;
    case "surah-story":
      state.lastSurahStory = entry;
      state.lastRead = entry;
      state.stats.surahStoriesRead += 1;
      break;
    case "faida":
      state.lastRead = entry;
      state.stats.fawaidRead += 1;
      break;
    case "book":
      state.lastRead = entry;
      state.stats.booksOpened += 1;
      break;
    case "sin-jeem":
      state.lastSinJeem = entry;
      state.stats.sinJeemGames += 1;
      break;
    default:
      state.lastRead = entry;
  }

  if (item.kind === "surah-story") incrementChallenge("daily-surah-story");
  if (item.kind === "qa") incrementChallenge("ten-qa");
  if (item.kind === "lesson") incrementChallenge("daily-lesson");
  if (item.kind === "tafsir") incrementChallenge("tafsir-page");

  if (statKey && statKey in state.stats) {
    state.stats[statKey] += 1;
  }

  writeActivity(state);
  return state;
}

export function recordSearch() {
  const state = readActivity();
  state.stats.searchCount += 1;
  writeActivity(state);
}

export function getContinueItems(): ActivityItem[] {
  const s = readActivity();
  const items = [s.lastSurah, s.lastTafsir, s.lastSurahStory, s.lastLesson, s.lastSinJeem, s.lastQa].filter(
    Boolean,
  ) as ActivityItem[];
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.kind}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
