export type PrayerSlot = {
  key: string;
  name: string;
  icon: string;
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

export async function fetchPrayerTimes(): Promise<PrayerTimesPayload> {
  const response = await fetch("/api/prayer-times", {
    headers: { Accept: "application/json" },
  });

  const data = (await response.json()) as PrayerTimesPayload & { message?: string };

  if (!response.ok || !data.ok) {
    throw new Error(data.message || "تعذر تحميل مواقيت الصلاة.");
  }

  return data;
}
