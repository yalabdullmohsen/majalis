/**
 * resolveDailyContext — محرّك السياق اليومي
 * دالة نقية (pure) لا تعتمد على state خارجي.
 * تحدد: التحية، الحدث، واللون بناءً على الوقت والتاريخ.
 */

// ── أوقات الصلاة التقريبية (بتوقيت السعودية للنموذج) ──────────────────────
// الاستخدام الحقيقي يستفيد من API الأوقات، لكن للعرض نستخدم معيار ثابت.

export type TimeOfDay =
  | "fajr"     // الفجر 04:00–05:30
  | "duha"     // الضحى 05:30–11:30
  | "zuhr"     // الظهر 11:30–14:30
  | "asr"      // العصر 14:30–17:00
  | "maghrib"  // المغرب 17:00–18:30
  | "isha"     // العشاء 18:30–21:30
  | "layl";    // الليل 21:30–04:00

export type DayOfWeek =
  | "friday" | "saturday" | "sunday" | "monday"
  | "tuesday" | "wednesday" | "thursday";

export interface HijriDate {
  day: number;
  month: number;  // 1–12
  year: number;
}

export interface DailyContext {
  /** التحية الرئيسية */
  greeting: string;
  /** التحية الثانوية بالاسم */
  subGreeting: string;
  /** نص الحدث الخاص باليوم/الوقت (null = لا حدث) */
  event: string | null;
  /** لون التمييز الدلالي */
  accentColor: string;
  /** وقت اليوم المُستنتج */
  timeOfDay: TimeOfDay;
  /** اقتراح السياق */
  suggestion: string;
  /** رمز الوقت (للأنيميشن) */
  timeIcon: "moon" | "sun" | "sunset" | "dawn";
}

// ── جدول التحيّات حسب وقت اليوم ─────────────────────────────────────────────

const TIME_GREETINGS: Record<TimeOfDay, { main: string; sub: string; icon: DailyContext["timeIcon"] }> = {
  fajr:    { main: "صبَّحك الله بالخير والعافية",  sub: "أهلاً بك في ساعة الفجر المبارك",   icon: "dawn"   },
  duha:    { main: "صبَّحك الله بالخير والبركة",  sub: "أهلاً بك في وقت الضحى المبارك",     icon: "sun"    },
  zuhr:    { main: "صبَّحك الله بالخير والنعمة",  sub: "أهلاً بك في وقت الظهر",             icon: "sun"    },
  asr:     { main: "صبَّحك الله بالخير والتوفيق", sub: "أهلاً بك في وقت العصر المبارك",     icon: "sun"    },
  maghrib: { main: "مسَّاك الله بالخير والرحمة",  sub: "أهلاً بك في ساعة المغرب الكريمة",   icon: "sunset" },
  isha:    { main: "مسَّاك الله بالخير والسلامة", sub: "أهلاً بك في وقت العشاء",             icon: "sunset" },
  layl:    { main: "مسَّاك الله بالخير والهدوء",  sub: "أهلاً بك في جوف الليل المبارك",     icon: "moon"   },
};

// ── الأيام الهجرية المميّزة ──────────────────────────────────────────────────

interface HijriEvent {
  day: number;
  month: number;
  label: string;
  color: string;
}

const HIJRI_EVENTS: HijriEvent[] = [
  { day: 1,  month: 1,  label: "رأس السنة الهجرية",        color: "#0E6E52" },
  { day: 10, month: 1,  label: "يوم عاشوراء",              color: "#5B21B6" },
  { day: 12, month: 3,  label: "ذكرى المولد النبوي الشريف", color: "#0F766E" },
  { day: 27, month: 7,  label: "ليلة الإسراء والمعراج",    color: "#4338CA" },
  { day: 15, month: 8,  label: "ليلة النصف من شعبان",      color: "#7C3AED" },
  { day: 1,  month: 9,  label: "بداية شهر رمضان المبارك",  color: "#059669" },
  { day: 27, month: 9,  label: "ليلة القدر المرتقبة",      color: "#DC2626" },
  { day: 1,  month: 10, label: "عيد الفطر المبارك",         color: "#D97706" },
  { day: 9,  month: 12, label: "يوم عرفة المبارك",          color: "#065F46" },
  { day: 10, month: 12, label: "عيد الأضحى المبارك",        color: "#B45309" },
];

// ── أيام الأسبوع المميّزة ────────────────────────────────────────────────────

const DAY_EVENTS: Partial<Record<DayOfWeek, { label: string; color: string }>> = {
  friday:   { label: "يوم الجمعة المبارك — يوم العيد الأسبوعي", color: "#0E6E52" },
  saturday: { label: "بداية أسبوع مثمر بإذن الله",             color: "#1F4D3A" },
  monday:   { label: "يوم الإثنين — يوم صيام مستحب",           color: "#0F5132" },
  thursday: { label: "يوم الخميس — يوم صيام مستحب",            color: "#0F5132" },
};

// ── الاقتراحات حسب الوقت ────────────────────────────────────────────────────

const TIME_SUGGESTIONS: Record<TimeOfDay, string> = {
  fajr:    "ابدأ يومك بقراءة أذكار الصباح",
  duha:    "وقت مثالي لمراجعة الفقه والعقيدة",
  zuhr:    "استكشف دروس العلماء وخطب الجمعة",
  asr:     "وقت الاستذكار ومراجعة ما حفظت",
  maghrib: "وقت أذكار المساء والتأمل",
  isha:    "تصفح الكتب والمقالات العلمية",
  layl:    "ساعة الخلوة والدعاء والمناجاة",
};

// ── الألوان الافتراضية حسب الوقت ────────────────────────────────────────────

const TIME_COLORS: Record<TimeOfDay, string> = {
  fajr:    "#1F4D3A",
  duha:    "#0E6E52",
  zuhr:    "#0F766E",
  asr:     "#0E6E52",
  maghrib: "#B45309",
  isha:    "#5B21B6",
  layl:    "#1F2937",
};

// ── استنتاج وقت اليوم ────────────────────────────────────────────────────────

export function resolveTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 4  && hour < 5.5)  return "fajr";
  if (hour >= 5.5 && hour < 11.5) return "duha";
  if (hour >= 11.5 && hour < 14.5) return "zuhr";
  if (hour >= 14.5 && hour < 17)  return "asr";
  if (hour >= 17 && hour < 18.5)  return "maghrib";
  if (hour >= 18.5 && hour < 21.5) return "isha";
  return "layl"; // 21:30–04:00
}

// ── استنتاج اليوم ────────────────────────────────────────────────────────────

function resolveDayOfWeek(jsDay: number): DayOfWeek {
  const days: DayOfWeek[] = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  return days[jsDay] ?? "sunday";
}

// ── تحويل ميلادي → هجري (تقريب رياضي ± يوم) ─────────────────────────────────
// الخوارزمية: Jean Meeus "Astronomical Algorithms" — دقة ±1 يوم

export function toHijri(date: Date, offsetDays = 0): HijriDate {
  const jd = Math.floor(
    (date.getTime() / 86400000) + 2440587.5
  ) + offsetDays;

  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
    + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  const day   = l3 - Math.floor((709 * month) / 24);
  const year  = 30 * n + j - 30;

  return { day, month, year };
}

// ── المحرّك الرئيسي ───────────────────────────────────────────────────────────

/**
 * resolveDailyContext — دالة نقية تأخذ وقتاً وتُعيد سياق اليوم.
 * @param now  كائن Date (الافتراضي: new Date())
 * @param hijriOffset تعديل يدوي على اليوم الهجري (±1) لتصحيح بداية الشهر
 */
export function resolveDailyContext(
  now: Date = new Date(),
  hijriOffset = 0
): DailyContext {
  const hour      = now.getHours() + now.getMinutes() / 60;
  const timeOfDay = resolveTimeOfDay(hour);
  const dayOfWeek = resolveDayOfWeek(now.getDay());
  const hijri     = toHijri(now, hijriOffset);

  // البحث عن حدث هجري
  const hijriEvent = HIJRI_EVENTS.find(
    (e) => e.day === hijri.day && e.month === hijri.month
  );

  // البحث عن حدث أسبوعي
  const dayEvent = DAY_EVENTS[dayOfWeek];

  // أولوية: هجري > أسبوعي
  const event       = hijriEvent?.label ?? dayEvent?.label ?? null;
  const accentColor = hijriEvent?.color ?? dayEvent?.color ?? TIME_COLORS[timeOfDay];

  const greetingData = TIME_GREETINGS[timeOfDay];

  return {
    greeting:    greetingData.main,
    subGreeting: greetingData.sub,
    event,
    accentColor,
    timeOfDay,
    suggestion:  TIME_SUGGESTIONS[timeOfDay],
    timeIcon:    greetingData.icon,
  };
}
