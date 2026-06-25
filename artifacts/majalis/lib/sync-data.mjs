import {
  addKuwaitDays,
  buildDbRow,
  fetchAlAdhanTimings,
  kuwaitDateKey,
  kuwaitDateParam,
  KUWAIT_CITY,
  KUWAIT_GOVERNORATE,
} from "./prayer-times-core.mjs";
import { getSupabaseAdmin, isMissingTableError } from "./supabase-admin.mjs";
import { OCCASION_SYNC_META } from "./islamic-occasions-sync-meta.mjs";
import { runDailyPlatformSync } from "./daily-platform-sync.mjs";
import { runFiqhCouncilSync } from "./fiqh-council-sync.mjs";
import { runKnowledgeSync } from "./knowledge-sync.mjs";

const PRAYER_DAYS_AHEAD = 7;

function daysBetween(fromKey, toKey) {
  const [fy, fm, fd] = fromKey.split("-").map(Number);
  const [ty, tm, td] = toKey.split("-").map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / 86_400_000);
}

function kuwaitWeekday(date = new Date()) {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuwait",
    weekday: "short",
  }).format(date);
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[label] ?? new Date(date).getDay();
}

async function hijriToGregorianKey(hDay, hMonth, hYear) {
  const param = `${String(hDay).padStart(2, "0")}-${String(hMonth).padStart(2, "0")}-${hYear}`;
  const url = `https://api.aladhan.com/v1/hToG/${param}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`hToG failed: ${response.status}`);
  const json = await response.json();
  const g = json?.data?.gregorian?.date;
  if (!g) throw new Error("Invalid hToG payload");
  const [dd, mm, yyyy] = g.split("-");
  return `${yyyy}-${mm}-${dd}`;
}

function parseHijriParts(hijri) {
  if (!hijri) return { year: 0, month: 0, day: 0 };
  const year = Number(hijri.year?.number ?? hijri.year ?? 0);
  const month = Number(hijri.month?.number ?? hijri.month ?? 0);
  const day = Number(hijri.day ?? 0);
  return { year, month, day };
}

function nextHijriOccurrence(hMonth, hDay, current) {
  let year = current.year;
  if (current.month > hMonth || (current.month === hMonth && current.day > hDay)) {
    year += 1;
  }
  return { year, month: hMonth, day: hDay };
}

function daysUntilWeekday(targetDow, fromDate = new Date()) {
  const current = kuwaitWeekday(fromDate);
  let delta = (targetDow - current + 7) % 7;
  if (delta === 0) delta = 7;
  return delta;
}

function daysUntilMonThu(fromDate = new Date()) {
  const mon = daysUntilWeekday(1, fromDate);
  const thu = daysUntilWeekday(4, fromDate);
  return Math.min(mon, thu);
}

function daysUntilWhiteDays(hijriDay) {
  if (hijriDay >= 13 && hijriDay <= 15) return 0;
  if (hijriDay < 13) return 13 - hijriDay;
  return 30 - hijriDay + 13;
}

export async function syncPrayerTimes(admin = getSupabaseAdmin()) {
  if (!admin) {
    return { ok: false, skipped: true, reason: "no_supabase_admin", count: 0 };
  }

  const rows = [];
  const today = new Date();

  for (let offset = 0; offset < PRAYER_DAYS_AHEAD; offset += 1) {
    const date = addKuwaitDays(today, offset);
    const dateKey = kuwaitDateKey(date);
    const data = await fetchAlAdhanTimings(kuwaitDateParam(date));
    rows.push(buildDbRow(dateKey, data.timings));
  }

  const { error } = await admin
    .from("prayer_times")
    .upsert(rows, { onConflict: "city,governorate,date" });

  if (error) {
    if (isMissingTableError(error)) {
      return { ok: false, skipped: true, reason: "prayer_times_missing", count: 0 };
    }
    throw error;
  }

  return { ok: true, skipped: false, count: rows.length };
}

export async function syncIslamicOccasions(admin = getSupabaseAdmin()) {
  if (!admin) {
    return { ok: false, skipped: true, reason: "no_supabase_admin", count: 0 };
  }

  const todayKey = kuwaitDateKey();
  const aladhanToday = await fetchAlAdhanTimings(kuwaitDateParam());
  const hijri = parseHijriParts(aladhanToday.date?.hijri);
  const rows = [];

  for (const item of OCCASION_SYNC_META) {
    if (item.kind === "mon-thu") {
      const remaining = daysUntilMonThu();
      const nextDate = kuwaitDateKey(addKuwaitDays(new Date(), remaining));
      rows.push({
        occasion_id: item.id,
        next_gregorian_date: nextDate,
        days_remaining: remaining,
        hijri_label: null,
        synced_at: new Date().toISOString(),
      });
      continue;
    }

    if (item.kind === "white-days") {
      const remaining = daysUntilWhiteDays(hijri.day);
      const nextDate = kuwaitDateKey(addKuwaitDays(new Date(), remaining));
      rows.push({
        occasion_id: item.id,
        next_gregorian_date: nextDate,
        days_remaining: remaining,
        hijri_label: `${hijri.day}-${hijri.month}-${hijri.year}`,
        synced_at: new Date().toISOString(),
      });
      continue;
    }

    const target = nextHijriOccasion(item.hijriMonth, item.hijriDay, hijri);
    const gregorianKey = await hijriToGregorianKey(target.day, target.month, target.year);
    const remaining = Math.max(0, daysBetween(todayKey, gregorianKey));
    rows.push({
      occasion_id: item.id,
      next_gregorian_date: gregorianKey,
      days_remaining: remaining,
      hijri_label: `${target.day}-${target.month}-${target.year}`,
      synced_at: new Date().toISOString(),
    });
  }

  const { error } = await admin
    .from("islamic_occasions_cache")
    .upsert(rows, { onConflict: "occasion_id" });

  if (error) {
    if (isMissingTableError(error)) {
      return { ok: false, skipped: true, reason: "islamic_occasions_cache_missing", count: 0 };
    }
    throw error;
  }

  return { ok: true, skipped: false, count: rows.length };
}

/** Daily sync — prayer times, occasions, lessons maintenance, daily content marker. */
export async function runDailyDataSync() {
  const admin = getSupabaseAdmin();
  const [prayer, occasions, platform, fiqh, knowledge] = await Promise.all([
    syncPrayerTimes(admin),
    syncIslamicOccasions(admin),
    runDailyPlatformSync(),
    runFiqhCouncilSync({ triggerType: "cron" }),
    runKnowledgeSync({ triggerType: "cron", maxItems: 25 }),
  ]);

  return {
    ok: prayer.ok || occasions.ok || platform.ok || fiqh.ok || knowledge.ok || (prayer.skipped && occasions.skipped),
    at: new Date().toISOString(),
    city: KUWAIT_CITY,
    governorate: KUWAIT_GOVERNORATE,
    prayer,
    occasions,
    platform,
    fiqh,
    knowledge,
  };
}
