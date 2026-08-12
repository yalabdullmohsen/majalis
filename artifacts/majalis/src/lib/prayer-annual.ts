/**
 * Offline annual / monthly prayer timetable generation (adhan-js, no network).
 */

import { computePrayerTimesForDate, type PrayerTimesPayload } from "@/lib/prayer-times";
import { getActivePrayerLocation } from "@/lib/prayer-location-prefs";
import { getPrayerCalcMethod } from "@/lib/prayer-calc-prefs";

export type AnnualDayRow = {
  dateKey: string; // YYYY-MM-DD
  readable: string | null;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
};

function slot(payload: PrayerTimesPayload, key: string): string {
  return payload.prayers.find((p) => p.key === key)?.time24 ?? "--:--";
}

export async function generateMonthTimetable(
  year: number,
  month1to12: number,
  opts?: { lat?: number; lon?: number; timeZone?: string; label?: string },
): Promise<AnnualDayRow[]> {
  const loc = getActivePrayerLocation();
  const lat = opts?.lat ?? loc.lat;
  const lon = opts?.lon ?? loc.lon;
  const timeZone = opts?.timeZone ?? loc.timeZone;
  const label = opts?.label ?? loc.label;
  const method = getPrayerCalcMethod();
  const daysInMonth = new Date(year, month1to12, 0).getDate();
  const rows: AnnualDayRow[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month1to12 - 1, day, 12, 0, 0);
    const payload = await computePrayerTimesForDate(lat, lon, label, timeZone, date, method);
    const dateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
    rows.push({
      dateKey,
      readable: payload.date.readable,
      fajr: slot(payload, "Fajr"),
      sunrise: slot(payload, "Sunrise"),
      dhuhr: slot(payload, "Dhuhr"),
      asr: slot(payload, "Asr"),
      maghrib: slot(payload, "Maghrib"),
      isha: slot(payload, "Isha"),
    });
  }
  return rows;
}

export async function generateYearTimetable(
  year: number,
  opts?: { lat?: number; lon?: number; timeZone?: string; label?: string },
): Promise<AnnualDayRow[]> {
  const all: AnnualDayRow[] = [];
  for (let m = 1; m <= 12; m++) {
    const monthRows = await generateMonthTimetable(year, m, opts);
    all.push(...monthRows);
  }
  return all;
}

export function exportTimetableCsv(rows: AnnualDayRow[], title: string): Blob {
  const header = "التاريخ,الفجر,الشروق,الظهر,العصر,المغرب,العشاء";
  const lines = rows.map(
    (r) => `${r.dateKey},${r.fajr},${r.sunrise},${r.dhuhr},${r.asr},${r.maghrib},${r.isha}`,
  );
  const body = `\uFEFF# ${title}\n${header}\n${lines.join("\n")}`;
  return new Blob([body], { type: "text/csv;charset=utf-8" });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
