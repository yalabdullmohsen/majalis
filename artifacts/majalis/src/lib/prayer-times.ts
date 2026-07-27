import { requestFetch } from "@/lib/request-manager";
import {
  computePrayerDisplayState,
  formatRemainingHms,
} from "./prayer-display-state";

export {
  computePrayerDisplayState,
  formatElapsedMmSs,
  formatRemainingHms,
  PRAYER_ELAPSED_WINDOW_MINUTES as PRAYER_GRACE_MINUTES,
  type PrayerDisplayState,
} from "./prayer-display-state";

// ─── Kuwait Governorates ────────────────────────────────────────────────────

export type KuwaitGovernorate = {
  id: string;
  name: string;
  lat: number;
  lon: number;
};

// الإحداثيات مضبوطة على مراكز المحافظات الجغرافية الفعلية
// المصدر: خرائط الكويت الرسمية + WGS84
// الطريقة: Method 9 (Kuwait Ministry of Awqaf) — زاوية الفجر 18° / العشاء 17.5°
export const KUWAIT_GOVERNORATES: KuwaitGovernorate[] = [
  { id: "capital",   name: "العاصمة",        lat: 29.3697, lon: 47.9783 },
  { id: "hawalli",   name: "حولي",            lat: 29.3339, lon: 48.0668 },
  { id: "farwaniya", name: "الفروانية",       lat: 29.2800, lon: 47.9600 },
  { id: "mubarak",   name: "مبارك الكبير",   lat: 29.2200, lon: 48.0800 },
  { id: "jahra",     name: "الجهراء",         lat: 29.3418, lon: 47.6583 },
  { id: "ahmadi",    name: "الأحمدي",         lat: 29.0769, lon: 48.0838 },
];

const GOV_STORAGE_KEY = "majalis-governorate-v1";

export function getSelectedGovernorate(): KuwaitGovernorate {
  try {
    const id = localStorage.getItem(GOV_STORAGE_KEY);
    return KUWAIT_GOVERNORATES.find((g) => g.id === id) ?? KUWAIT_GOVERNORATES[0];
  } catch {
    return KUWAIT_GOVERNORATES[0];
  }
}

export function setSelectedGovernorate(id: string): void {
  try { localStorage.setItem(GOV_STORAGE_KEY, id); } catch { /* ignore */ }
}

// ───────────────────────────────────────────────────────────────────────────

export type PrayerSlot = {
  key: string;
  name: string;
  obligatory: boolean;
  time24: string;
  time: string;
  minutes: number | null;
};

export type PrayerTimesPayload = {
  ok: boolean;
  city: string;
  timezone: string;
  method: string;
  source: string;
  date: {
    gregorian: string;
    hijri: string | null;
    readable: string | null;
  };
  prayers: PrayerSlot[];
  fetchedAt: string;
  stale?: boolean;
};

export type PrayerStatus = {
  current: PrayerSlot | null;
  next: PrayerSlot | null;
  previous: PrayerSlot | null;
  remainingMs: number;
  remainingLabel: string;
};

const OBLIGATORY_KEYS = new Set(["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]);

const KUWAIT_METHOD = 9;

const PRAYER_META = [
  { key: "Fajr", name: "الفجر", obligatory: true },
  { key: "Sunrise", name: "الشروق", obligatory: false },
  { key: "Dhuhr", name: "الظهر", obligatory: true },
  { key: "Asr", name: "العصر", obligatory: true },
  { key: "Maghrib", name: "المغرب", obligatory: true },
  { key: "Isha", name: "العشاء", obligatory: true },
];

function kuwaitDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuwait",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function kuwaitDateParam(date = new Date()) {
  const parts = kuwaitDateKey(date).split("-");
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function parseTimeToMinutes(value: string) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatTime12(value: string) {
  const minutes = parseTimeToMinutes(value);
  if (minutes == null) return value;
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? "م" : "ص";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${period}`;
}

function buildPayload(
  timings: Record<string, string>,
  meta: { timezone?: string } | null,
  date: any,
  cityName = "الكويت – محافظة العاصمة",
): PrayerTimesPayload {
  const prayers: PrayerSlot[] = PRAYER_META.map(({ key, name, obligatory }) => ({
    key,
    name,
    obligatory,
    time24: timings[key],
    time: formatTime12(timings[key]),
    minutes: parseTimeToMinutes(timings[key]),
  }));

  return {
    ok: true,
    city: cityName,
    timezone: meta?.timezone || "Asia/Kuwait",
    method: "Kuwait",
    source: "AlAdhan (طريقة الكويت)",
    date: {
      gregorian: date?.gregorian?.date || kuwaitDateParam(),
      hijri: date?.hijri?.date || null,
      readable: date?.readable || null,
    },
    prayers,
    fetchedAt: new Date().toISOString(),
  };
}

function pad2(n: number) { return String(Math.floor(n)).padStart(2, "0"); }
function toKuwaitTime(date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuwait",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const h = parts.find((p) => p.type === "hour")?.value ?? "00";
    const m = parts.find((p) => p.type === "minute")?.value ?? "00";
    return `${h}:${m}`;
  } catch {
    const h = date.getUTCHours() + 3; // Kuwait UTC+3
    const m = date.getUTCMinutes();
    return `${pad2(h % 24)}:${pad2(m)}`;
  }
}

async function computePrayerTimesLocal(
  lat: number,
  lon: number,
  cityName: string,
): Promise<PrayerTimesPayload> {
  const { Coordinates, CalculationMethod, PrayerTimes, Madhab } = await import("adhan");
  const coordinates = new Coordinates(lat, lon);
  const params = CalculationMethod.Kuwait();
  params.madhab = Madhab.Shafi;
  const now = new Date();
  const pt = new PrayerTimes(coordinates, now, params);
  const timings: Record<string, string> = {
    Fajr:    toKuwaitTime(pt.fajr),
    Sunrise: toKuwaitTime(pt.sunrise),
    Dhuhr:   toKuwaitTime(pt.dhuhr),
    Asr:     toKuwaitTime(pt.asr),
    Maghrib: toKuwaitTime(pt.maghrib),
    Isha:    toKuwaitTime(pt.isha),
  };
  const readable = new Intl.DateTimeFormat("ar-KW", {
    timeZone: "Asia/Kuwait",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);
  return {
    ...buildPayload(timings, { timezone: "Asia/Kuwait" }, { readable }, cityName),
    source: "حساب محلي (adhan-js، طريقة الكويت)",
  };
}

function staticPrayerFallback(cityName = "الكويت – محافظة العاصمة"): PrayerTimesPayload {
  const month = new Date().getMonth() + 1;
  const isSummer = month >= 5 && month <= 9;
  const timings: Record<string, string> = isSummer
    ? { Fajr: "04:00", Sunrise: "05:30", Dhuhr: "12:05", Asr: "16:35", Maghrib: "19:10", Isha: "20:35" }
    : { Fajr: "05:10", Sunrise: "06:30", Dhuhr: "12:00", Asr: "15:05", Maghrib: "17:25", Isha: "18:45" };
  const readable = new Intl.DateTimeFormat("ar-KW", {
    timeZone: "Asia/Kuwait",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
  return {
    ...buildPayload(timings, { timezone: "Asia/Kuwait" }, { readable }, cityName),
    source: "تقديري (بدون اتصال)",
    stale: true,
  };
}

async function fetchAlAdhanDirect(
  lat: number,
  lon: number,
  cityName: string,
): Promise<PrayerTimesPayload> {
  const dateParam = kuwaitDateParam();
  // school=0: حساب العصر على مذهب الشافعية (ظل الشيء مساوٍ لطوله) — المعتمد لدى الأوقاف الكويتية
  // timezonestring: صريح لمنع أي خطأ في التوقيت
  const url =
    `https://api.aladhan.com/v1/timings/${dateParam}` +
    `?latitude=${lat}&longitude=${lon}&method=${KUWAIT_METHOD}&school=0&timezonestring=Asia%2FKuwait`;

  const response = await requestFetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`AlAdhan responded with ${response.status}`);
  }

  const json = await response.json();
  if (json?.code !== 200 || !json?.data?.timings) {
    throw new Error("Invalid AlAdhan payload");
  }

  return buildPayload(json.data.timings, json.data.meta, json.data.date, cityName);
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} س ${minutes} د`;
  }
  if (minutes > 0) {
    return `${minutes} د ${seconds} ث`;
  }
  return `${seconds} ث`;
}

export type PrayerCountdown = PrayerStatus & {
  remainingHms: string;
  /** ثواني مضت منذ الأذان الأخير (خلال نافذة السماح)، وإلا null */
  sinceSeconds: number | null;
  /** MM:SS تصاعدي منذ الأذان الأخير أثناء نافذة الـ35 دقيقة، وإلا null */
  sinceHms: string | null;
  /** ثواني متبقية للصلاة التالية الفعلية أثناء فترة السماح، وإلا null */
  graceNextSeconds: number | null;
  /** HH:MM:SS للصلاة التالية الفعلية أثناء فترة السماح، وإلا null */
  graceNextHms: string | null;
  /** الصلاة الفعلية التالية (بعد التي أذّنت للتو) أثناء فترة السماح، وإلا null */
  graceNextSlot: PrayerSlot | null;
  /** وضع العرض: elapsed = مضى على الأذان، remaining = الوقت المتبقي */
  displayMode: "elapsed" | "remaining";
  /** نص التلميح المعروض في البطاقة */
  displayLabel: "مضى على الأذان" | "الوقت المتبقي";
};

function formatHms(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * عدّاد الصلاة بمرحلتين — يُشتق بالكامل من الوقت الحقيقي عبر computePrayerDisplayState.
 * يمكن تمرير `now` للاختبارات.
 */
export function computePrayerCountdown(
  prayers: PrayerSlot[],
  now: Date = new Date(),
  timeZone = "Asia/Kuwait",
): PrayerCountdown {
  const state = computePrayerDisplayState(prayers, now, timeZone);
  const obligatory = prayers.filter((p) => OBLIGATORY_KEYS.has(p.key) && p.minutes != null);

  if (!state) {
    const fallbackNext = obligatory[0] ?? null;
    return {
      current: null,
      next: fallbackNext,
      previous: obligatory.length > 1 ? obligatory[obligatory.length - 1] : null,
      remainingMs: 0,
      remainingLabel: formatRemaining(0),
      remainingHms: formatHms(0),
      sinceSeconds: null,
      sinceHms: null,
      graceNextSeconds: null,
      graceNextHms: null,
      graceNextSlot: null,
      displayMode: "remaining",
      displayLabel: "الوقت المتبقي",
    };
  }

  const inElapsed = state.mode === "elapsed";
  // توافق الواجهات: أثناء elapsed يكون `next` = الصلاة التي أذّنت (المعروضة)
  const displayed = state.displayedPrayer;
  const previous =
    obligatory.find((p) => p.key === state.currentPrayer.key) ?? state.currentPrayer;

  const remainingMs = inElapsed ? 0 : state.counterMs;
  const sinceSeconds = inElapsed && state.elapsedSinceAdhanMs != null
    ? Math.floor(state.elapsedSinceAdhanMs / 1000)
    : null;

  const graceNextSeconds = inElapsed && state.remainingUntilNextPrayerMs != null
    ? Math.floor(state.remainingUntilNextPrayerMs / 1000)
    : null;

  return {
    current: state.currentPrayer,
    next: displayed,
    previous,
    remainingMs,
    remainingLabel: formatRemaining(inElapsed ? (state.remainingUntilNextPrayerMs ?? 0) : remainingMs),
    remainingHms: inElapsed
      ? formatHms(0)
      : (state.counterText || formatRemainingHms(remainingMs)),
    sinceSeconds,
    sinceHms: inElapsed ? state.counterText : null,
    graceNextSeconds,
    graceNextHms: graceNextSeconds != null ? formatHms(graceNextSeconds) : null,
    graceNextSlot: inElapsed ? state.nextPrayer : null,
    displayMode: state.mode,
    displayLabel: state.label,
  };
}

export function computePrayerStatus(
  prayers: PrayerSlot[],
  now: Date = new Date(),
  timeZone = "Asia/Kuwait",
): PrayerStatus {
  const cd = computePrayerCountdown(prayers, now, timeZone);
  return {
    current: cd.current,
    next: cd.next,
    previous: cd.previous,
    remainingMs: cd.remainingMs,
    remainingLabel: cd.remainingLabel,
  };
}

/**
 * Never throws — always returns usable prayer times.
 * Pass a governorateId to get times for a specific governorate;
 * omit to use the governorate stored in localStorage.
 */
export async function fetchPrayerTimes(governorateId?: string): Promise<PrayerTimesPayload> {
  const gov = governorateId
    ? (KUWAIT_GOVERNORATES.find((g) => g.id === governorateId) ?? KUWAIT_GOVERNORATES[0])
    : getSelectedGovernorate();

  const cityName = `الكويت – محافظة ${gov.name}`;
  const isCapital = gov.id === "capital";

  // Supabase / API cache only has Capital times — skip for other governorates
  if (isCapital) {
    try {
      const { getPrayerTimesFromDb } = await import("./supabase");
      const row = await getPrayerTimesFromDb(kuwaitDateKey());
      if (row) {
        const timings: Record<string, string> = {
          Fajr: row.fajr,
          Sunrise: row.sunrise,
          Dhuhr: row.dhuhr,
          Asr: row.asr,
          Maghrib: row.maghrib,
          Isha: row.isha,
        };
        return {
          ...buildPayload(timings, { timezone: "Asia/Kuwait" }, {
            gregorian: { date: kuwaitDateParam() },
          }, cityName),
          source: "مواقيت محدّثة",
        };
      }
    } catch {
      // fall through
    }

    try {
      const response = await requestFetch("/api/prayer-times", {
        headers: { Accept: "application/json" },
      });

      const data = (await response.json()) as PrayerTimesPayload & { message?: string };

      if (response.ok && data.ok) {
        // Tag the city correctly even when using the cached API response
        return { ...data, city: cityName };
      }
    } catch {
      // fall through to AlAdhan direct
    }
  }

  try {
    return await fetchAlAdhanDirect(gov.lat, gov.lon, cityName);
  } catch {
    /* API فشل — استخدم الحساب المحلي بدون اتصال */
  }

  try {
    return await computePrayerTimesLocal(gov.lat, gov.lon, cityName);
  } catch {
    return staticPrayerFallback(cityName);
  }
}
