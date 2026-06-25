/** Shared Kuwait prayer-times logic for API routes and cron sync. */

export const KUWAIT_LAT = 29.3759;
export const KUWAIT_LON = 47.9774;
export const KUWAIT_METHOD = 9;
export const KUWAIT_CITY = "الكويت";
export const KUWAIT_GOVERNORATE = "العاصمة";
export const KUWAIT_CITY_LABEL = "الكويت – محافظة العاصمة";

export const PRAYER_KEYS = [
  { key: "Fajr", name: "الفجر", obligatory: true, column: "fajr" },
  { key: "Sunrise", name: "الشروق", obligatory: false, column: "sunrise" },
  { key: "Dhuhr", name: "الظهر", obligatory: true, column: "dhuhr" },
  { key: "Asr", name: "العصر", obligatory: true, column: "asr" },
  { key: "Maghrib", name: "المغرب", obligatory: true, column: "maghrib" },
  { key: "Isha", name: "العشاء", obligatory: true, column: "isha" },
];

export function kuwaitDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuwait",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function kuwaitDateParam(date = new Date()) {
  const parts = kuwaitDateKey(date).split("-");
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

export function addKuwaitDays(baseDate, days) {
  const key = kuwaitDateKey(baseDate);
  const [y, m, d] = key.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return utc;
}

function parseTimeToMinutes(value) {
  const match = String(value || "").match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatTime12(value) {
  const minutes = parseTimeToMinutes(value);
  if (minutes == null) return value;
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? "م" : "ص";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${period}`;
}

export function normalizeTime24(value) {
  const match = String(value || "").match(/(\d{1,2}):(\d{2})/);
  if (!match) return String(value || "");
  return `${String(match[1]).padStart(2, "0")}:${match[2]}`;
}

export async function fetchAlAdhanTimings(dateParam) {
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

  return json.data;
}

export function buildPayload(timings, meta, date) {
  const prayers = PRAYER_KEYS.map(({ key, name, obligatory }) => ({
    key,
    name,
    obligatory,
    time24: normalizeTime24(timings[key]),
    time: formatTime12(timings[key]),
    minutes: parseTimeToMinutes(timings[key]),
  }));

  return {
    ok: true,
    city: KUWAIT_CITY_LABEL,
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

export function buildDbRow(dateKey, timings) {
  return {
    city: KUWAIT_CITY,
    governorate: KUWAIT_GOVERNORATE,
    date: dateKey,
    fajr: normalizeTime24(timings.Fajr),
    sunrise: normalizeTime24(timings.Sunrise),
    dhuhr: normalizeTime24(timings.Dhuhr),
    asr: normalizeTime24(timings.Asr),
    maghrib: normalizeTime24(timings.Maghrib),
    isha: normalizeTime24(timings.Isha),
  };
}

export function payloadFromDbRow(row) {
  const timings = {
    Fajr: row.fajr,
    Sunrise: row.sunrise,
    Dhuhr: row.dhuhr,
    Asr: row.asr,
    Maghrib: row.maghrib,
    Isha: row.isha,
  };

  const gregorianParam = String(row.date).includes("-")
    ? String(row.date).split("-").reverse().join("-")
    : kuwaitDateParam();

  return {
    ...buildPayload(timings, { timezone: "Asia/Kuwait" }, {
      gregorian: { date: gregorianParam },
    }),
    source: "Supabase (مواقيت محدّثة)",
    stale: false,
  };
}
