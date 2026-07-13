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
      { label: "ورد القرآن اليومي", href: "/daily-wird" },
      { label: "فائدة علمية", href: "/fawaid" },
      { label: "حكمة السلف", href: "/hikam-salaf" },
    ],
  },
  beforeDhuhr: {
    id: "beforeDhuhr",
    title: "قبل الظهر",
    suggestions: [
      { label: "صلاة الضحى", href: "/adhkar?cat=salah" },
      { label: "قراءة القرآن", href: "/quran-hub" },
      { label: "الأسئلة الشرعية", href: "/qa" },
      { label: "دروس الأسبوع", href: "/lessons" },
    ],
  },
  afterDhuhr: {
    id: "afterDhuhr",
    title: "بعد الظهر",
    suggestions: [
      { label: "سنة الظهر البعدية", href: "/adhkar?cat=salah" },
      { label: "أذكار ما بعد الصلاة", href: "/adhkar?cat=after-salah" },
      { label: "قراءة القرآن", href: "/quran-hub" },
      { label: "فوائد علمية", href: "/fawaid" },
    ],
  },
  afterAsr: {
    id: "afterAsr",
    title: "بعد العصر",
    suggestions: [
      { label: "أذكار المساء", href: "/adhkar?cat=evening" },
      { label: "قراءة القرآن", href: "/quran-hub" },
      { label: "قصص الأنبياء", href: "/prophets" },
      { label: "الرقائق والزهد", href: "/raqaiq" },
    ],
  },
  afterMaghrib: {
    id: "afterMaghrib",
    title: "بعد المغرب",
    suggestions: [
      { label: "أذكار المساء", href: "/adhkar?cat=evening" },
      { label: "قراءة سورة الملك", href: "/quran?surah=67" },
      { label: "الفوائد العلمية", href: "/fawaid" },
      { label: "الوصايا النبوية", href: "/wasaya-nabawiyya" },
    ],
  },
  afterIsha: {
    id: "afterIsha",
    title: "بعد العشاء",
    suggestions: [
      { label: "الوتر", href: "/adhkar?cat=after-salah" },
      { label: "أذكار النوم", href: "/adhkar?cat=sleep" },
      { label: "قيام الليل", href: "/adhkar?cat=salah" },
      { label: "الرقائق والمواعظ", href: "/raqaiq" },
    ],
  },
};

function periodFromPrayer(current: PrayerSlot | null): SunnahPeriod {
  if (!current) return PERIODS.beforeDhuhr;

  switch (current.key) {
    case "Fajr":
      return PERIODS.afterFajr;
    case "Dhuhr":
      return PERIODS.afterDhuhr;
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
  if (hour >= 10 && hour < 12) return PERIODS.beforeDhuhr;
  if (hour >= 12 && hour < 15) return PERIODS.afterDhuhr;
  if (hour >= 15 && hour < 18) return PERIODS.afterAsr;
  if (hour >= 18 && hour < 21) return PERIODS.afterMaghrib;
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
