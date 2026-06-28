export type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type PrayerStatus = "pending" | "done" | "missed";
export type PrayerPlace = "home" | "mosque";

export type PrayerSession = {
  id?: string;
  prayerDate: string;
  prayerKey: PrayerKey;
  status: PrayerStatus;
  place: PrayerPlace;
  congregation: boolean;
  isFirstTime: boolean;
  notes: string;
  pointsEarned: number;
  prayedAt?: string | null;
  updatedAt?: string;
};

export type DayRecord = Record<PrayerKey, PrayerSession>;

export type PrayerStore = Record<string, DayRecord>;

export type PrayerRankKey =
  | "beginner"
  | "regular"
  | "excellent"
  | "role_model"
  | "preceding";

export type PrayerRank = {
  key: PrayerRankKey;
  label: string;
  emoji: string;
  score: number;
  description: string;
};

export type AchievementKey =
  | "first_prayer"
  | "first_full_week"
  | "first_full_month"
  | "prayers_100"
  | "prayers_500"
  | "fajr_100"
  | "congregation_100"
  | "streak_30"
  | "streak_365";

export type AchievementDef = {
  key: AchievementKey;
  title: string;
  description: string;
  emoji: string;
};

export type PrayerStats = {
  todayDone: number;
  todayMissed: number;
  todayPending: number;
  weekDone: number;
  monthDone: number;
  totalPrayers: number;
  totalMissed: number;
  totalMosque: number;
  totalHome: number;
  totalCongregation: number;
  totalFirstTime: number;
  totalPoints: number;
  fajrCount: number;
  fullDaysCount: number;
  currentStreak: number;
  longestStreak: number;
  bestPrayerKey: PrayerKey | null;
  bestWeekPrayers: number;
  bestMonthPrayers: number;
  monthlyCommitmentPct: number;
  avgDailyPrayers: number;
  level: number;
  pointsInLevel: number;
  levelTarget: number;
};

export type PrayerLogEntry = PrayerSession & {
  prayerLabel: string;
};

export type CalendarDayStatus = "full" | "partial" | "missed" | "empty";

export type CalendarDay = {
  date: string;
  status: CalendarDayStatus;
  done: number;
  missed: number;
};

export type RankMetrics30 = {
  prayersDone: number;
  mosqueCount: number;
  firstTimeCount: number;
  fullDays: number;
  currentStreak: number;
  score: number;
};

export type PointReason =
  | "home"
  | "congregation"
  | "mosque"
  | "first_time"
  | "full_day"
  | "full_week"
  | "full_month";
