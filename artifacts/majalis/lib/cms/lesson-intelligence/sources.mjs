/**
 * Phase 6 — lesson_sources CRUD (unified registry).
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";

const TABLE = "lesson_sources";

export function mapLessonSourceRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    source_name: row.source_name,
    source_type: row.source_type,
    source_url: row.source_url,
    platform: row.platform,
    country: row.country,
    city: row.city,
    language: row.language,
    trust_score: row.trust_score,
    active: row.active,
    auto_publish: row.auto_publish,
    scan_interval: row.scan_interval,
    last_scan: row.last_scan,
    next_scan: row.next_scan,
    total_lessons: row.total_lessons,
    total_imported: row.total_imported,
    last_success: row.last_success,
    last_error: row.last_error,
    config: row.config || {},
    legacy_source_id: row.legacy_source_id,
  };
}

export async function listLessonSources({ activeOnly = false } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  try {
    let q = admin.from(TABLE).select("*").order("trust_score", { ascending: false }).order("source_name");
    if (activeOnly) q = q.eq("active", true);
    const { data } = await q;
    return (data || []).map(mapLessonSourceRow);
  } catch {
    return [];
  }
}

export async function getLessonSource(id) {
  const admin = getSupabaseAdmin();
  if (!admin || !id) return null;
  const { data } = await admin.from(TABLE).select("*").eq("id", id).maybeSingle();
  return mapLessonSourceRow(data);
}

export async function upsertLessonSource(payload) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing" };

  const row = {
    source_name: payload.source_name || payload.name,
    source_type: payload.source_type || "website",
    source_url: payload.source_url || payload.url,
    platform: payload.platform || payload.source_type || "website",
    country: payload.country || "الكويت",
    city: payload.city || null,
    language: payload.language || "ar",
    trust_score: payload.trust_score ?? 80,
    active: payload.active !== false,
    auto_publish: Boolean(payload.auto_publish ?? payload.auto_publish_allowed),
    scan_interval: payload.scan_interval || 15,
    config: payload.config || {},
    updated_at: new Date().toISOString(),
  };

  if (!row.source_name || !row.source_url) {
    return { ok: false, error: "name_and_url_required" };
  }

  if (payload.id) {
    const { data, error } = await admin.from(TABLE).update(row).eq("id", payload.id).select().single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, source: mapLessonSourceRow(data) };
  }

  const nextScan = new Date(Date.now() + row.scan_interval * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from(TABLE)
    .upsert({ ...row, next_scan: nextScan }, { onConflict: "source_url" })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, source: mapLessonSourceRow(data) };
}

export async function touchLessonSourceScan(id, { success, error: errMsg, imported = 0, lessons = 0 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin || !id) return;

  const now = new Date().toISOString();
  const { data } = await admin.from(TABLE).select("scan_interval, total_imported, total_lessons, failure_count").eq("id", id).maybeSingle();
  const interval = data?.scan_interval || 15;
  const patch = {
    last_scan: now,
    next_scan: new Date(Date.now() + interval * 60 * 1000).toISOString(),
    updated_at: now,
  };
  if (success) {
    patch.last_success = now;
    patch.last_error = null;
    patch.total_imported = (data?.total_imported || 0) + imported;
    patch.total_lessons = (data?.total_lessons || 0) + lessons;
  } else if (errMsg) {
    patch.last_error = String(errMsg).slice(0, 500);
  }

  await admin.from(TABLE).update(patch).eq("id", id);
}

export async function getSourcesDueForScan() {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const now = new Date().toISOString();
  try {
    const { data } = await admin
      .from(TABLE)
      .select("*")
      .eq("active", true)
      .or(`next_scan.is.null,next_scan.lte.${now}`)
      .order("next_scan", { ascending: true, nullsFirst: true })
      .limit(50);
    return (data || []).map(mapLessonSourceRow);
  } catch {
    return [];
  }
}
