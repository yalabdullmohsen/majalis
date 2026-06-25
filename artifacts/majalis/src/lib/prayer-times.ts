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

const KUWAIT_LAT = 29.3759;
const KUWAIT_LON = 47.9774;
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

function buildPayload(timings: Record<string, string>, meta: { timezone?: string } | null, date: any): PrayerTimesPayload {
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
    city: "الكويت – محافظة العاصمة",
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

/** Approximate Kuwait prayer times when all network sources fail. */
function staticPrayerFallback(): PrayerTimesPayload {
  const timings: Record<string, string> = {
    Fajr: "04:30",
    Sunrise: "05:50",
    Dhuhr: "11:45",
    Asr: "15:10",
    Maghrib: "17:35",
    Isha: "19:00",
  };

  const readable = new Intl.DateTimeFormat("ar-KW", {
    timeZone: "Asia/Kuwait",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return {
    ...buildPayload(timings, { timezone: "Asia/Kuwait" }, { readable }),
    source: "AlAdhan (طريقة الكويت)",
    stale: true,
  };
}

async function fetchAlAdhanDirect(): Promise<PrayerTimesPayload> {
  const dateParam = kuwaitDateParam();
  const url =
    `https://api.aladhan.com/v1/timings/${dateParam}` +
    `?latitude=${KUWAIT_LAT}&longitude=${KUWAIT_LON}&method=${KUWAIT_METHOD}`;

  const response = await fetch(url, {
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

  return buildPayload(json.data.timings, json.data.meta, json.data.date);
}

function kuwaitNowMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuwait",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
  return hour * 60 + minute;
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
};

function kuwaitNowParts(): { minutes: number; seconds: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuwait",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
  const second = Number(parts.find((p) => p.type === "second")?.value || 0);
  return { minutes: hour * 60 + minute, seconds: second };
}

function formatHms(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function computePrayerCountdown(prayers: PrayerSlot[]): PrayerCountdown {
  const status = computePrayerStatus(prayers);
  const now = kuwaitNowParts();
  let remainingSeconds = 0;

  if (status.next?.minutes != null) {
    if (status.next.minutes > now.minutes) {
      remainingSeconds = (status.next.minutes - now.minutes) * 60 - now.seconds;
    } else {
      remainingSeconds = ((24 * 60 - now.minutes) + status.next.minutes) * 60 - now.seconds;
    }
  }

  return {
    ...status,
    remainingMs: remainingSeconds * 1000,
    remainingLabel: formatHms(remainingSeconds),
    remainingHms: formatHms(remainingSeconds),
  };
}

export function computePrayerStatus(prayers: PrayerSlot[]): PrayerStatus {
  const nowMinutes = kuwaitNowMinutes();
  const obligatory = prayers.filter((p) => OBLIGATORY_KEYS.has(p.key) && p.minutes != null);

  let previous: PrayerSlot | null = null;
  let current: PrayerSlot | null = null;
  let next: PrayerSlot | null = null;

  for (const prayer of obligatory) {
    if (prayer.minutes! <= nowMinutes) {
      previous = prayer;
      current = prayer;
    } else if (!next) {
      next = prayer;
      break;
    }
  }

  if (!next && obligatory.length > 0) {
    next = obligatory[0];
    previous = obligatory[obligatory.length - 1];
    current = previous;
  }

  if (!previous && obligatory.length > 0) {
    previous = obligatory[obligatory.length - 1];
  }

  let remainingMs = 0;
  if (next?.minutes != null) {
    if (next.minutes > nowMinutes) {
      remainingMs = (next.minutes - nowMinutes) * 60_000;
    } else {
      remainingMs = ((24 * 60 - nowMinutes) + next.minutes) * 60_000;
    }
  }

  return {
    current,
    next,
    previous,
    remainingMs,
    remainingLabel: formatRemaining(remainingMs),
  };
}

/** Never throws — always returns usable prayer times. */
export async function fetchPrayerTimes(): Promise<PrayerTimesPayload> {
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
        }),
        source: "Supabase (مواقيت محدّثة)",
      };
    }
  } catch {
    // fall through
  }

  try {
    const response = await fetch("/api/prayer-times", {
      headers: { Accept: "application/json" },
    });

    const data = (await response.json()) as PrayerTimesPayload & { message?: string };

    if (response.ok && data.ok) {
      return data;
    }
  } catch {
    // fall through to direct fetch
  }

  try {
    return await fetchAlAdhanDirect();
  } catch {
    return staticPrayerFallback();
  }
}
