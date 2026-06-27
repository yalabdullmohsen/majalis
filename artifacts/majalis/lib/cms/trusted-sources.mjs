/**
 * Trusted lesson sources CRUD (server-side).
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

export async function listTrustedSources({ activeOnly = false } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  let q = admin.from("trusted_lesson_sources").select("*").order("name");
  if (activeOnly) q = q.eq("active", true);
  const { data } = await q;
  return data || [];
}

export async function getTrustedSource(id) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin.from("trusted_lesson_sources").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function upsertTrustedSource(payload) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing" };

  const row = {
    name: payload.name,
    platform: payload.platform || payload.source_type,
    url: payload.url,
    source_type: payload.source_type || payload.platform || "website",
    trust_level: payload.trust_level || "unknown",
    auto_publish_allowed: Boolean(payload.auto_publish_allowed),
    country: payload.country || "الكويت",
    city: payload.city || null,
    category: payload.category || null,
    active: payload.active !== false,
    feed_url: payload.feed_url || null,
    config: payload.config || {},
    updated_at: new Date().toISOString(),
  };

  if (payload.id) {
    const { data, error } = await admin.from("trusted_lesson_sources").update(row).eq("id", payload.id).select().single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, source: data };
  }

  const { data, error } = await admin.from("trusted_lesson_sources").insert(row).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, source: data };
}

export async function updateSourceCheckStatus(id, { success, error: errMsg } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  const patch = { last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  if (success) {
    patch.last_success_at = new Date().toISOString();
    patch.failure_count = 0;
    patch.last_error = null;
  } else if (errMsg) {
    const { data } = await admin.from("trusted_lesson_sources").select("failure_count").eq("id", id).maybeSingle();
    patch.failure_count = (data?.failure_count || 0) + 1;
    patch.last_error = String(errMsg).slice(0, 500);
  }
  await admin.from("trusted_lesson_sources").update(patch).eq("id", id);
}
