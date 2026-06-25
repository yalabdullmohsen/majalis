import { computePrayerStatus, fetchPrayerTimes, type PrayerSlot } from "./prayer-times";

export type SunnahSuggestion = {
  label: string;
  href: string;
};

export type SunnahPeriod = {
  id: string;
  title: string;
  suggestions: SunnahSuggestion[];
};

const PERIODS: Record<string, SunnahPeriod> = {
  afterFajr: {
    id: "afterFajr",
    title: "بعد الفجر",
    suggestions: [
      { label: "أذكار الصباح", href: "/adhkar?cat=morning" },
      { label: "ركعتا الإشراق", href: "/adhkar?cat=salah" },
      { label: "ورد القرآن", href: "/daily-wird" },
    ],
  },
  beforeDhuhr: {
    id: "beforeDhuhr",
    title: "قبل الظهر",
    suggestions: [
      { label: "صلاة الضحى", href: "/adhkar?cat=salah" },
      { label: "قراءة القرآن", href: "/quran" },
      { label: "الدعاء", href: "/adhkar?cat=distress" },
    ],
  },
  afterAsr: {
    id: "afterAsr",
    title: "بعد العصر",
    suggestions: [
      { label: "أذكار المساء", href: "/adhkar?cat=evening" },
      { label: "قراءة القرآن", href: "/quran" },
      { label: "صلة الرحم", href: "/fawaid" },
    ],
  },
  afterMaghrib: {
    id: "afterMaghrib",
    title: "بعد المغرب",
    suggestions: [
      { label: "أذكار المساء", href: "/adhkar?cat=evening" },
      { label: "أذكار النوم", href: "/adhkar?cat=sleep" },
      { label: "قراءة سورة الملك", href: "/quran?surah=67" },
    ],
  },
  afterIsha: {
    id: "afterIsha",
    title: "بعد العشاء",
    suggestions: [
      { label: "الوتر", href: "/adhkar?cat=after-salah" },
      { label: "أذكار النوم", href: "/adhkar?cat=sleep" },
      { label: "قيام الليل", href: "/adhkar?cat=salah" },
    ],
  },
};

function periodFromPrayer(current: PrayerSlot | null): SunnahPeriod {
  if (!current) return PERIODS.beforeDhuhr;

  switch (current.key) {
    case "Fajr":
      return PERIODS.afterFajr;
    case "Dhuhr":
      return PERIODS.beforeDhuhr;
    case "Asr":
      return PERIODS.afterAsr;
    case "Maghrib":
      return PERIODS.afterMaghrib;
    case "Isha":
      return PERIODS.afterIsha;
    default:
      return PERIODS.beforeDhuhr;
  }
}

function periodFromLocalHour(hour: number): SunnahPeriod {
  if (hour >= 4 && hour < 10) return PERIODS.afterFajr;
  if (hour >= 10 && hour < 14) return PERIODS.beforeDhuhr;
  if (hour >= 14 && hour < 17) return PERIODS.afterAsr;
  if (hour >= 17 && hour < 20) return PERIODS.afterMaghrib;
  return PERIODS.afterIsha;
}

export async function getCurrentSunnahPeriod(): Promise<SunnahPeriod & { source: "prayer" | "local" }> {
  try {
    const times = await fetchPrayerTimes();
    const status = computePrayerStatus(times.prayers);
    return { ...periodFromPrayer(status.current), source: "prayer" };
  } catch {
    const hour = new Date().getHours();
    return { ...periodFromLocalHour(hour), source: "local" };
  }
}

export function getLocalSunnahPeriod(): SunnahPeriod {
  return periodFromLocalHour(new Date().getHours());
}
