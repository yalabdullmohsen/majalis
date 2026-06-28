import { LEVEL_TARGET, POINTS, PRAYER_KEYS, RANKS } from "./constants";
import type {
  AchievementKey,
  CalendarDay,
  CalendarDayStatus,
  DayRecord,
  PrayerKey,
  PrayerRank,
  PrayerSession,
  PrayerStats,
  PrayerStore,
  RankMetrics30,
} from "./types";

export function kuwaitDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(date);
}

export function emptyDay(date: string): DayRecord {
  return Object.fromEntries(
    PRAYER_KEYS.map((key) => [
      key,
      {
        prayerDate: date,
        prayerKey: key,
        status: "pending" as const,
        place: "home" as const,
        congregation: false,
        isFirstTime: false,
        notes: "",
        pointsEarned: 0,
      },
    ]),
  ) as DayRecord;
}

export function isFullDay(day: DayRecord): boolean {
  return PRAYER_KEYS.every((k) => day[k]?.status === "done");
}

export function dayDoneCount(day: DayRecord): number {
  return PRAYER_KEYS.filter((k) => day[k]?.status === "done").length;
}

export function dayMissedCount(day: DayRecord): number {
  return PRAYER_KEYS.filter((k) => day[k]?.status === "missed").length;
}

export function calendarStatus(day: DayRecord | undefined): CalendarDayStatus {
  if (!day) return "empty";
  const done = dayDoneCount(day);
  const missed = dayMissedCount(day);
  if (done === 5) return "full";
  if (missed > 0 && done === 0) return "missed";
  if (done > 0 || missed > 0) return "partial";
  return "empty";
}

/** Base points for a completed prayer session */
export function computeSessionPoints(session: Pick<PrayerSession, "status" | "place" | "congregation" | "isFirstTime">): number {
  if (session.status !== "done") return 0;
  let pts: number = POINTS.home;
  if (session.place === "mosque") pts = POINTS.mosque;
  else if (session.congregation) pts = POINTS.congregation;
  if (session.isFirstTime) pts += POINTS.firstTime;
  return pts;
}

export function computeStreaks(store: PrayerStore): { current: number; longest: number } {
  const dates = Object.keys(store).sort((a, b) => b.localeCompare(a));
  let current = 0;
  for (const d of dates) {
    if (isFullDay(store[d])) current += 1;
    else break;
  }

  let longest = 0;
  let run = 0;
  const asc = [...dates].sort((a, b) => a.localeCompare(b));
  for (const d of asc) {
    if (isFullDay(store[d])) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }
  return { current, longest: Math.max(longest, current) };
}

function countInRange(store: PrayerStore, fromDate: string, toDate: string) {
  let done = 0;
  for (const [date, day] of Object.entries(store)) {
    if (date >= fromDate && date <= toDate) {
      done += dayDoneCount(day);
    }
  }
  return done;
}

function addDays(dateKey: string, delta: number): string {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return kuwaitDateKey(d);
}

function bestPrayerKey(store: PrayerStore): PrayerKey | null {
  const counts: Record<PrayerKey, number> = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  for (const day of Object.values(store)) {
    for (const key of PRAYER_KEYS) {
      if (day[key]?.status === "done") counts[key] += 1;
    }
  }
  let best: PrayerKey | null = null;
  let max = 0;
  for (const key of PRAYER_KEYS) {
    if (counts[key] > max) {
      max = counts[key];
      best = key;
    }
  }
  return best;
}

function bestWeekMonth(store: PrayerStore) {
  const dates = Object.keys(store).sort();
  let bestWeek = 0;
  let bestMonth = 0;

  for (let i = 0; i < dates.length; i++) {
    const start = dates[i];
    const weekEnd = addDays(start, 6);
    const monthEnd = addDays(start, 29);
    bestWeek = Math.max(bestWeek, countInRange(store, start, weekEnd));
    bestMonth = Math.max(bestMonth, countInRange(store, start, monthEnd));
  }
  return { bestWeek, bestMonth };
}

export function computeRankMetrics30(store: PrayerStore): RankMetrics30 {
  const today = kuwaitDateKey();
  const from = addDays(today, -29);
  let prayersDone = 0;
  let mosqueCount = 0;
  let firstTimeCount = 0;
  let fullDays = 0;

  for (const [date, day] of Object.entries(store)) {
    if (date < from || date > today) continue;
    if (isFullDay(day)) fullDays += 1;
    for (const key of PRAYER_KEYS) {
      const s = day[key];
      if (s?.status !== "done") continue;
      prayersDone += 1;
      if (s.place === "mosque") mosqueCount += 1;
      if (s.isFirstTime) firstTimeCount += 1;
    }
  }

  const { current: currentStreak } = computeStreaks(store);

  // Weighted score 0–100 based on last 30 days (max ~150 prayers)
  const prayerScore = Math.min(40, (prayersDone / 150) * 40);
  const mosqueScore = Math.min(20, (mosqueCount / 60) * 20);
  const firstTimeScore = Math.min(15, (firstTimeCount / 60) * 15);
  const fullDayScore = Math.min(15, (fullDays / 30) * 15);
  const streakScore = Math.min(10, (currentStreak / 30) * 10);
  const score = Math.round((prayerScore + mosqueScore + firstTimeScore + fullDayScore + streakScore) * 10) / 10;

  return { prayersDone, mosqueCount, firstTimeCount, fullDays, currentStreak, score };
}

export function resolveRank(metrics: RankMetrics30): PrayerRank {
  const score = metrics.score;
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (score >= r.score) rank = r;
  }
  return { ...rank, score };
}

export function computeLevel(totalPoints: number) {
  const level = Math.floor(totalPoints / LEVEL_TARGET) + 1;
  const pointsInLevel = totalPoints % LEVEL_TARGET;
  return { level, pointsInLevel, levelTarget: LEVEL_TARGET };
}

export function computeMonthlyCommitment(store: PrayerStore): number {
  const today = kuwaitDateKey();
  const from = addDays(today, -29);
  let done = 0;
  let expected = 0;
  for (const [date, day] of Object.entries(store)) {
    if (date < from || date > today) continue;
    expected += 5;
    done += dayDoneCount(day);
  }
  if (expected === 0) return 0;
  return Math.round((done / expected) * 1000) / 10;
}

export function aggregateStats(store: PrayerStore): PrayerStats {
  const today = kuwaitDateKey();
  const todayDay = store[today] || emptyDay(today);
  const weekStart = addDays(today, -6);
  const monthStart = addDays(today, -29);

  let totalPrayers = 0;
  let totalMissed = 0;
  let totalMosque = 0;
  let totalHome = 0;
  let totalCongregation = 0;
  let totalFirstTime = 0;
  let totalPoints = 0;
  let fajrCount = 0;
  let fullDaysCount = 0;

  for (const day of Object.values(store)) {
    if (isFullDay(day)) fullDaysCount += 1;
    for (const key of PRAYER_KEYS) {
      const s = day[key];
      if (!s) continue;
      totalPoints += s.pointsEarned || computeSessionPoints(s);
      if (s.status === "done") {
        totalPrayers += 1;
        if (s.place === "mosque") totalMosque += 1;
        else totalHome += 1;
        if (s.congregation) totalCongregation += 1;
        if (s.isFirstTime) totalFirstTime += 1;
        if (key === "fajr") fajrCount += 1;
      } else if (s.status === "missed") {
        totalMissed += 1;
      }
    }
  }

  // Bonus points for full day/week/month streaks (computed once from history)
  totalPoints += fullDaysCount * POINTS.fullDay;

  const { current: currentStreak, longest: longestStreak } = computeStreaks(store);
  const { bestWeek, bestMonth } = bestWeekMonth(store);
  const daysTracked = Object.keys(store).length || 1;
  const { level, pointsInLevel, levelTarget } = computeLevel(totalPoints);

  return {
    todayDone: dayDoneCount(todayDay),
    todayMissed: dayMissedCount(todayDay),
    todayPending: 5 - dayDoneCount(todayDay) - dayMissedCount(todayDay),
    weekDone: countInRange(store, weekStart, today),
    monthDone: countInRange(store, monthStart, today),
    totalPrayers,
    totalMissed,
    totalMosque,
    totalHome,
    totalCongregation,
    totalFirstTime,
    totalPoints,
    fajrCount,
    fullDaysCount,
    currentStreak,
    longestStreak,
    bestPrayerKey: bestPrayerKey(store),
    bestWeekPrayers: bestWeek,
    bestMonthPrayers: bestMonth,
    monthlyCommitmentPct: computeMonthlyCommitment(store),
    avgDailyPrayers: Math.round((totalPrayers / daysTracked) * 10) / 10,
    level,
    pointsInLevel,
    levelTarget,
  };
}

export function buildCalendarMonth(store: PrayerStore, year: number, month: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  const lastDay = new Date(year, month, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const day = store[date];
    days.push({
      date,
      status: calendarStatus(day),
      done: day ? dayDoneCount(day) : 0,
      missed: day ? dayMissedCount(day) : 0,
    });
  }
  return days;
}

export function detectAchievements(store: PrayerStore, earned: Set<AchievementKey>): AchievementKey[] {
  const stats = aggregateStats(store);
  const newly: AchievementKey[] = [];

  const check = (key: AchievementKey, cond: boolean) => {
    if (cond && !earned.has(key)) newly.push(key);
  };

  check("first_prayer", stats.totalPrayers >= 1);
  check("prayers_100", stats.totalPrayers >= 100);
  check("prayers_500", stats.totalPrayers >= 500);
  check("fajr_100", stats.fajrCount >= 100);
  check("congregation_100", stats.totalCongregation >= 100);
  check("streak_30", stats.longestStreak >= 30);
  check("streak_365", stats.longestStreak >= 365);

  // Full week: 7 consecutive full days
  const dates = Object.keys(store).sort();
  let weekRun = 0;
  for (const d of dates) {
    if (isFullDay(store[d])) {
      weekRun += 1;
      if (weekRun >= 7) break;
    } else {
      weekRun = 0;
    }
  }
  check("first_full_week", weekRun >= 7);

  let monthRun = 0;
  for (const d of dates) {
    if (isFullDay(store[d])) {
      monthRun += 1;
      if (monthRun >= 30) break;
    } else {
      monthRun = 0;
    }
  }
  check("first_full_month", monthRun >= 30);

  return newly;
}

export function applySessionUpdate(
  store: PrayerStore,
  date: string,
  key: PrayerKey,
  patch: Partial<PrayerSession>,
): PrayerStore {
  const day = store[date] || emptyDay(date);
  const prev = day[key];
  const next: PrayerSession = {
    ...prev,
    ...patch,
    prayerDate: date,
    prayerKey: key,
    updatedAt: new Date().toISOString(),
  };
  next.pointsEarned = computeSessionPoints(next);
  return { ...store, [date]: { ...day, [key]: next } };
}

export function flattenLog(store: PrayerStore, limit = 100) {
  const entries: (PrayerSession & { prayedAtSort: string })[] = [];
  for (const day of Object.values(store)) {
    for (const key of PRAYER_KEYS) {
      const s = day[key];
      if (s && s.status !== "pending") {
        entries.push({
          ...s,
          prayedAtSort: s.prayedAt || s.updatedAt || `${s.prayerDate}T12:00:00`,
        });
      }
    }
  }
  return entries
    .sort((a, b) => b.prayedAtSort.localeCompare(a.prayedAtSort))
    .slice(0, limit);
}
