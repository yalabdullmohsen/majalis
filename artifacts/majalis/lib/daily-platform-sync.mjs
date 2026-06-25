import { getSupabaseAdmin, isMissingTableError } from "./supabase-admin.mjs";

function logStep(name, result) {
  const entry = { step: name, at: new Date().toISOString(), ...result };
  console.info("[daily-platform-sync]", JSON.stringify(entry));
  return entry;
}

/** Archive lessons whose end_date has passed. Safe no-op if table missing. */
export async function archiveExpiredLessons(admin = getSupabaseAdmin()) {
  if (!admin) {
    return logStep("archiveExpiredLessons", { ok: false, skipped: true, reason: "no_supabase_admin", count: 0 });
  }

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(new Date());

  const { data, error } = await admin
    .from("lessons")
    .select("id, external_key, title, end_date")
    .eq("status", "approved")
    .not("end_date", "is", null)
    .lt("end_date", today);

  if (error) {
    if (isMissingTableError(error)) {
      return logStep("archiveExpiredLessons", { ok: false, skipped: true, reason: "lessons_missing", count: 0 });
    }
    return logStep("archiveExpiredLessons", { ok: false, error: error.message, count: 0 });
  }

  return logStep("archiveExpiredLessons", { ok: true, count: data?.length || 0, archived: (data || []).map((r) => r.external_key || r.id) });
}

/** Detect duplicate external_key rows (report only — no destructive delete). */
export async function reportDuplicateLessons(admin = getSupabaseAdmin()) {
  if (!admin) {
    return logStep("reportDuplicateLessons", { ok: false, skipped: true, reason: "no_supabase_admin", duplicates: [] });
  }

  const { data, error } = await admin
    .from("lessons")
    .select("external_key")
    .not("external_key", "is", null)
    .neq("external_key", "");

  if (error) {
    if (isMissingTableError(error)) {
      return logStep("reportDuplicateLessons", { ok: false, skipped: true, reason: "lessons_missing", duplicates: [] });
    }
    return logStep("reportDuplicateLessons", { ok: false, error: error.message, duplicates: [] });
  }

  const counts = new Map();
  for (const row of data || []) {
    const key = row.external_key;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const duplicates = [...counts.entries()].filter(([, n]) => n > 1).map(([key, count]) => ({ key, count }));

  return logStep("reportDuplicateLessons", { ok: true, duplicates });
}

/** HEAD-check a small set of lesson URLs; failures are logged only. */
export async function checkBrokenLessonLinks(admin = getSupabaseAdmin()) {
  if (!admin) {
    return logStep("checkBrokenLessonLinks", { ok: false, skipped: true, reason: "no_supabase_admin", broken: [] });
  }

  const { data, error } = await admin
    .from("lessons")
    .select("id, live_url, book_url, maps_url")
    .eq("status", "approved")
    .limit(50);

  if (error) {
    if (isMissingTableError(error)) {
      return logStep("checkBrokenLessonLinks", { ok: false, skipped: true, reason: "lessons_missing", broken: [] });
    }
    return logStep("checkBrokenLessonLinks", { ok: false, error: error.message, broken: [] });
  }

  const broken = [];
  for (const row of data || []) {
    for (const field of ["live_url", "book_url", "maps_url"]) {
      const url = row[field];
      if (!url || !/^https?:\/\//i.test(url)) continue;
      try {
        const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8_000), redirect: "follow" });
        if (!res.ok) broken.push({ id: row.id, field, url, status: res.status });
      } catch (err) {
        broken.push({ id: row.id, field, url, error: String(err?.message || err) });
      }
    }
  }

  return logStep("checkBrokenLessonLinks", { ok: true, checked: (data || []).length, broken });
}

/** Daily content rotation is deterministic client-side; this logs the sync marker. */
export function syncDailyContentMarker() {
  const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(new Date());
  return logStep("syncDailyContentMarker", { ok: true, dayKey, note: "ayah/hadith/faida/dhikr rotate by day index" });
}

export async function runDailyPlatformSync() {
  const steps = await Promise.all([
    archiveExpiredLessons(),
    reportDuplicateLessons(),
    checkBrokenLessonLinks(),
    Promise.resolve(syncDailyContentMarker()),
  ]);

  const ok = steps.every((s) => s.ok !== false || s.skipped);
  return { ok, steps };
}
