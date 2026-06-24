import { sendJson } from "./_http.js";

/** Kuwait City — محافظة العاصمة */
const KUWAIT_LAT = 29.3759;
const KUWAIT_LON = 47.9774;
/** طريقة حساب الكويت (AlAdhan method 9) — معتمدة رسميًا في دولة الكويت */
const KUWAIT_METHOD = 9;

const PRAYER_KEYS = [
  { key: "Fajr", name: "الفجر", icon: "🌙", obligatory: true },
  { key: "Sunrise", name: "الشروق", icon: "🌅", obligatory: false },
  { key: "Dhuhr", name: "الظهر", icon: "☀️", obligatory: true },
  { key: "Asr", name: "العصر", icon: "🌤️", obligatory: true },
  { key: "Maghrib", name: "المغرب", icon: "🌇", obligatory: true },
  { key: "Isha", name: "العشاء", icon: "🌙", obligatory: true },
];

/** @type {{ dateKey: string | null; payload: object | null; fetchedAt: number }} */
const cache = { dateKey: null, payload: null, fetchedAt: 0 };

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

function parseTimeToMinutes(value) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
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

async function fetchAlAdhanTimings(dateParam) {
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

function buildPayload(timings, meta, date) {
  const prayers = PRAYER_KEYS.map(({ key, name, icon, obligatory }) => ({
    key,
    name,
    icon,
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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة." });
    return;
  }

  const todayKey = kuwaitDateKey();

  if (cache.dateKey === todayKey && cache.payload) {
    sendJson(res, 200, cache.payload);
    return;
  }

  try {
    const data = await fetchAlAdhanTimings(kuwaitDateParam());
    const payload = buildPayload(data.timings, data.meta, data.date);
    cache.dateKey = todayKey;
    cache.payload = payload;
    cache.fetchedAt = Date.now();
    sendJson(res, 200, payload);
  } catch (error) {
    console.error("[prayer-times] fetch failed", error);
    if (cache.payload) {
      sendJson(res, 200, { ...cache.payload, stale: true });
      return;
    }
    sendJson(res, 503, { ok: false, message: "تعذر تحميل مواقيت الصلاة حاليًا." });
  }
}
