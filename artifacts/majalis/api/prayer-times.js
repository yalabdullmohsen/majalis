import { sendJson } from "./_http.js";
import { getSupabaseAdmin, isMissingTableError } from "../lib/supabase-admin.mjs";
import {
  buildPayload,
  fetchAlAdhanTimings,
  kuwaitDateKey,
  kuwaitDateParam,
  payloadFromDbRow,
  KUWAIT_CITY,
  KUWAIT_GOVERNORATE,
} from "../lib/prayer-times-core.mjs";

/** @type {{ dateKey: string | null; payload: object | null; fetchedAt: number }} */
const cache = { dateKey: null, payload: null, fetchedAt: 0 };

async function readPrayerTimesFromDb(dateKey) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin
    .from("prayer_times")
    .select("*")
    .eq("city", KUWAIT_CITY)
    .eq("governorate", KUWAIT_GOVERNORATE)
    .eq("date", dateKey)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }

  return data || null;
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
    const row = await readPrayerTimesFromDb(todayKey);
    if (row) {
      const payload = payloadFromDbRow(row);
      cache.dateKey = todayKey;
      cache.payload = payload;
      cache.fetchedAt = Date.now();
      sendJson(res, 200, payload);
      return;
    }

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
