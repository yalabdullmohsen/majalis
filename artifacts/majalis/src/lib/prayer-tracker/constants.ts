import type { AchievementDef, PrayerKey, PrayerRank } from "./types";

export const PRAYER_KEYS: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

export const PRAYER_SLOT_MAP: Record<PrayerKey, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export const TRACK_STORAGE_KEY = "majalis-prayer-tracker-v2";

/** Points per prayer action */
export const POINTS = {
  home: 10,
  congregation: 20,
  mosque: 30,
  firstTime: 15,
  fullDay: 50,
  fullWeek: 200,
  fullMonth: 1000,
} as const;

/** Points required to advance each level */
export const LEVEL_TARGET = 1000;

export const RANKS: PrayerRank[] = [
  {
    key: "beginner",
    label: "محافظ مبتدئ",
    emoji: "🥉",
    score: 0,
    description: "بداية الطريق — استمر على المحافظة",
  },
  {
    key: "regular",
    label: "محافظ",
    emoji: "🥈",
    score: 35,
    description: "التزام جيد خلال آخر 30 يوماً",
  },
  {
    key: "excellent",
    label: "متميز",
    emoji: "🥇",
    score: 55,
    description: "أداء متميز في الصلوات والجماعات",
  },
  {
    key: "role_model",
    label: "قدوة",
    emoji: "⭐",
    score: 75,
    description: "مثال يُحتذى به في المحافظة",
  },
  {
    key: "preceding",
    label: "سابق بالخيرات",
    emoji: "👑",
    score: 90,
    description: "من السابقين — بارك الله فيك",
  },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first_prayer", title: "أول صلاة", description: "سجّلت أول صلاة", emoji: "✅" },
  { key: "first_full_week", title: "أول أسبوع كامل", description: "5/5 لمدة 7 أيام متتالية", emoji: "✅" },
  { key: "first_full_month", title: "أول شهر كامل", description: "5/5 لمدة 30 يوماً", emoji: "✅" },
  { key: "prayers_100", title: "100 صلاة", description: "أتممت 100 صلاة", emoji: "✅" },
  { key: "prayers_500", title: "500 صلاة", description: "أتممت 500 صلاة", emoji: "✅" },
  { key: "fajr_100", title: "100 فجر", description: "100 صلاة فجر", emoji: "✅" },
  { key: "congregation_100", title: "100 جماعة", description: "100 صلاة جماعة", emoji: "✅" },
  { key: "streak_30", title: "30 يوماً متتالياً", description: "30 يوماً بدون انقطاع", emoji: "✅" },
  { key: "streak_365", title: "365 يوماً", description: "سنة كاملة من المحافظة", emoji: "✅" },
];
