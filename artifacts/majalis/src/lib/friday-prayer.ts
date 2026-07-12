/**
 * Friday prayer window helpers.
 * The Jumuah window runs from Thursday Maghrib until Friday Maghrib
 * based on the user's actual prayer times (Kuwait timezone).
 */

export type FridayWindowPhase = "laylat-jumuah" | "yawm-jumuah" | "none";

export type FridayWindowStatus = {
  inWindow: boolean;
  phase: FridayWindowPhase;
  /** Minutes of day when the window ends (Friday Maghrib), or null. */
  windowEndMinutes: number | null;
};

const WEEKDAY_MAP: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

function kuwaitNow(): { dayOfWeek: number; minutesOfDay: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuwait",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const weekdayName = parts.find((p) => p.type === "weekday")?.value ?? "";
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);

  return {
    dayOfWeek: WEEKDAY_MAP[weekdayName] ?? -1,
    minutesOfDay: h * 60 + m,
  };
}

/**
 * Determines whether the current moment falls inside the Friday Jumuah window.
 * Pass today's Maghrib time in minutes (from PrayerSlot.minutes).
 */
export function getFridayWindowStatus(
  maghribMinutes: number | null,
): FridayWindowStatus {
  if (maghribMinutes == null) {
    return { inWindow: false, phase: "none", windowEndMinutes: null };
  }

  const { dayOfWeek, minutesOfDay } = kuwaitNow();

  const THURSDAY = 4;
  const FRIDAY = 5;

  if (dayOfWeek === THURSDAY && minutesOfDay >= maghribMinutes) {
    return { inWindow: true, phase: "laylat-jumuah", windowEndMinutes: maghribMinutes };
  }

  if (dayOfWeek === FRIDAY && minutesOfDay < maghribMinutes) {
    return { inWindow: true, phase: "yawm-jumuah", windowEndMinutes: maghribMinutes };
  }

  return { inWindow: false, phase: "none", windowEndMinutes: null };
}

const SESSION_DISMISSED_KEY = "majalis-friday-banner-dismissed-v1";

export function isFridayBannerDismissed(): boolean {
  try {
    return sessionStorage.getItem(SESSION_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissFridayBanner(): void {
  try {
    sessionStorage.setItem(SESSION_DISMISSED_KEY, "1");
  } catch { /* ignore */ }
}

export function undismissFridayBanner(): void {
  try {
    sessionStorage.removeItem(SESSION_DISMISSED_KEY);
  } catch { /* ignore */ }
}
