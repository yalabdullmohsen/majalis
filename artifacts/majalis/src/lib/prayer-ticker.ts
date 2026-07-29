/**
 * Prayer countdown / post-adhan ticker state machine (Asia/Kuwait).
 * Pure logic for unit tests + UI consumers.
 */

export type PrayerKey = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

export type PrayerSlot = {
  key: PrayerKey;
  nameAr: string;
  /** Instant of adhan for today (or next day if wrapped). */
  at: Date;
};

export type PrayerTickerMode = "countdown" | "elapsed" | "upcoming";

export type PrayerTickerState = {
  mode: PrayerTickerMode;
  active: PrayerSlot;
  /** Milliseconds until next adhan (countdown/upcoming) or since adhan (elapsed). */
  ms: number;
};

const PRE_ADHAN_WINDOW_MS = 15 * 60 * 1000;
const POST_ADHAN_WINDOW_MS = 35 * 60 * 1000;

/** Tick interval: 1s only while showing seconds to the user; otherwise 30s. */
export function recommendedTickMs(state: PrayerTickerState): number {
  if (state.mode === "countdown" || state.mode === "elapsed") return 1_000;
  return 30_000;
}

/**
 * Given ordered prayer slots for the rolling window and `now`, pick display mode.
 * - Within 15m before adhan → countdown
 * - 0–35m after adhan → elapsed ("مضى على الأذان")
 * - Otherwise → upcoming next prayer
 */
export function computePrayerTicker(slots: PrayerSlot[], now: Date): PrayerTickerState | null {
  if (!slots.length) return null;
  const t = now.getTime();
  const sorted = [...slots].sort((a, b) => a.at.getTime() - b.at.getTime());

  for (const slot of sorted) {
    const at = slot.at.getTime();
    const delta = at - t;
    if (delta > 0 && delta <= PRE_ADHAN_WINDOW_MS) {
      return { mode: "countdown", active: slot, ms: delta };
    }
    if (delta <= 0 && -delta <= POST_ADHAN_WINDOW_MS) {
      return { mode: "elapsed", active: slot, ms: -delta };
    }
  }

  const next = sorted.find((s) => s.at.getTime() > t) || sorted[0];
  return {
    mode: "upcoming",
    active: next,
    ms: Math.max(0, next.at.getTime() - t),
  };
}

export function formatDurationAr(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
