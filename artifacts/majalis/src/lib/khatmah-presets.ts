/**
 * Khatmah duration presets → pages/day for the 604-page Mushaf.
 */

import { QURAN_TOTAL_PAGES, setKhatmahPagesPerDay, setKhatmahTargetDate } from "@/lib/quran-khatmah-tracker";
import { getDailyWirdState, saveDailyWirdState } from "@/lib/quran-api";

export type KhatmahPresetId = "30" | "60" | "90" | "custom";

export const KHATMAH_PRESETS: readonly {
  id: Exclude<KhatmahPresetId, "custom">;
  days: number;
  labelAr: string;
}[] = [
  { id: "30", days: 30, labelAr: "ختمة في ٣٠ يوماً" },
  { id: "60", days: 60, labelAr: "ختمة في ٦٠ يوماً" },
  { id: "90", days: 90, labelAr: "ختمة في ٩٠ يوماً" },
] as const;

export function pagesPerDayForKhatmahDays(days: number): number {
  const d = Math.max(1, Math.floor(days));
  return Math.max(1, Math.ceil(QURAN_TOTAL_PAGES / d));
}

/** Apply a duration preset: sync wird + khatmah tracker + target date. */
export function applyKhatmahDurationPreset(days: number): { pagesPerDay: number; targetDate: string } {
  const pagesPerDay = pagesPerDayForKhatmahDays(days);
  const target = new Date();
  target.setDate(target.getDate() + Math.max(1, Math.floor(days)));
  const targetDate = target.toISOString().slice(0, 10);

  setKhatmahPagesPerDay(pagesPerDay);
  setKhatmahTargetDate(targetDate);

  try {
    const wird = getDailyWirdState();
    saveDailyWirdState({ ...wird, pagesPerDay });
  } catch {
    /* ignore */
  }

  return { pagesPerDay, targetDate };
}
