/**
 * تدوير «فوائد اليوم» — يُستدعى من job-worker بعد enqueue من الكرون.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

const CARDS_PER_ROTATION = 6;
const MATCH_WINDOW_MIN = 15;

function currentHHMMInTimezone(timezone) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return fmt.format(new Date());
}

function currentDateInTimezone(timezone) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function minutesDiff(a, b) {
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  return Math.abs(ah * 60 + am - (bh * 60 + bm));
}

/**
 * @returns {Promise<{ ok: boolean, rotated?: boolean, reason?: string, slot?: string, cards?: number, error?: string }>}
 */
export async function runDailyBenefitRotation() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { ok: false, error: "Supabase not configured" };
  }

  const { data: schedule } = await supabase
    .from("daily_benefit_schedule")
    .select("id, timezone, display_times, no_repeat_days")
    .eq("id", 1)
    .maybeSingle();
  const timezone = schedule?.timezone || "Asia/Kuwait";
  const times = schedule?.display_times?.length
    ? schedule.display_times
    : ["06:00", "12:00", "18:00", "22:00"];
  const noRepeatDays = schedule?.no_repeat_days ?? 30;

  const nowHHMM = currentHHMMInTimezone(timezone);
  const today = currentDateInTimezone(timezone);
  const matchedSlot = times.find((t) => minutesDiff(nowHHMM, t) <= MATCH_WINDOW_MIN);

  if (!matchedSlot) {
    return { ok: true, rotated: false, reason: "no_slot_match", now: nowHHMM };
  }

  const { data: alreadyRotated } = await supabase
    .from("daily_benefit_display_log")
    .select("id")
    .eq("slot_label", matchedSlot)
    .gte("displayed_at", `${today}T00:00:00Z`)
    .limit(1)
    .maybeSingle();

  if (alreadyRotated) {
    return { ok: true, rotated: false, reason: "slot_already_rotated", slot: matchedSlot };
  }

  const cutoff = new Date(Date.now() - noRepeatDays * 24 * 60 * 60 * 1000).toISOString();

  let { data: fresh } = await supabase
    .from("auto_imported_content")
    .select("id, last_displayed_at, display_count")
    .eq("content_type", "benefit")
    .eq("status", "published")
    .or(`last_displayed_at.is.null,last_displayed_at.lt.${cutoff}`)
    .order("last_displayed_at", { ascending: true, nullsFirst: true })
    .limit(CARDS_PER_ROTATION);

  if (!fresh || fresh.length === 0) {
    const { data: fallback } = await supabase
      .from("auto_imported_content")
      .select("id, last_displayed_at, display_count")
      .eq("content_type", "benefit")
      .eq("status", "published")
      .order("last_displayed_at", { ascending: true, nullsFirst: true })
      .limit(CARDS_PER_ROTATION);
    fresh = fallback || [];
  }

  if (fresh.length === 0) {
    return { ok: true, rotated: false, reason: "no_approved_benefit_content", slot: matchedSlot };
  }

  const now = new Date().toISOString();
  for (const row of fresh) {
    await supabase
      .from("auto_imported_content")
      .update({ last_displayed_at: now, display_count: (row.display_count || 0) + 1 })
      .eq("id", row.id);
    await supabase
      .from("daily_benefit_display_log")
      .insert({ content_id: row.id, slot_label: matchedSlot, displayed_at: now });
  }

  return { ok: true, rotated: true, slot: matchedSlot, cards: fresh.length };
}
