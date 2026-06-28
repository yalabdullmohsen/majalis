/**
 * AKP v3 — Dynamic Source Manager (DB-only at runtime).
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { normalizeSource } from "../sources.mjs";
import { DEDUP_DEFAULTS } from "../config.mjs";
import { testSourceFetch } from "./health-monitor.mjs";
import { logAuditEvent } from "./security.mjs";

export async function listManagedSources({ activeOnly = false, contentType = null } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      error: "missing_secret",
      code: "Missing SUPABASE_SERVICE_ROLE_KEY",
      message: "Missing SUPABASE_SERVICE_ROLE_KEY — cannot access akp_content_sources",
      missing: ["SUPABASE_SERVICE_ROLE_KEY"],
      sources: [],
    };
  }

  let q = admin.from("akp_content_sources").select("*").order("priority", { ascending: false });
  if (activeOnly) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message, sources: [] };

  let sources = (data || []).map(normalizeSourceWithHealth);
  if (contentType) {
    sources = sources.filter((s) => s.content_types?.includes(contentType));
  }
  return { ok: true, sources };
}

export function normalizeSourceWithHealth(row) {
  const base = normalizeSource(row);
  return {
    ...base,
    health_score: row.health_score ?? 100,
    items_extracted_total: Number(row.items_extracted_total ?? 0),
    items_extracted_last: Number(row.items_extracted_last ?? 0),
    avg_fetch_ms: row.avg_fetch_ms ?? null,
    error_rate_pct: Number(row.error_rate_pct ?? 0),
    last_http_status: row.last_http_status ?? null,
    last_response_ms: row.last_response_ms ?? null,
    auto_disabled_at: row.auto_disabled_at ?? null,
    auto_disable_reason: row.auto_disable_reason ?? null,
    health_checked_at: row.health_checked_at ?? null,
    supported_languages: row.supported_languages || ["ar"],
    fallback_source_id: row.fallback_source_id ?? null,
  };
}

export async function getManagedSource(idOrSlug) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const isUuid = /^[0-9a-f-]{36}$/i.test(String(idOrSlug));
  const { data, error } = await admin
    .from("akp_content_sources")
    .select("*")
    .eq(isUuid ? "id" : "slug", idOrSlug)
    .maybeSingle();

  if (error || !data) return { ok: false, error: error?.message || "not_found" };
  return { ok: true, source: normalizeSourceWithHealth(data) };
}

export async function createManagedSource(input, actor = null) {
  return upsertManagedSource({ ...input, id: undefined }, actor);
}

export async function upsertManagedSource(input, actor = null) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const row = {
    slug: input.slug || slugFromUrl(input.source_url),
    name: input.name,
    source_type: input.source_type || "rss",
    source_url: input.source_url,
    priority: input.priority ?? 5,
    trust_score: input.trust_score ?? 70,
    language: input.language || "ar",
    category: input.category || "general",
    content_types: input.content_types || [],
    fetch_interval_hours: input.fetch_interval_hours ?? 1,
    dedup_rules: input.dedup_rules || DEDUP_DEFAULTS,
    parser: input.parser || "rss",
    validator: input.validator || "scholarly_v1",
    publication_policy: input.publication_policy || { auto_publish: false, min_trust: 80 },
    active: input.active !== false,
    supported_languages: input.supported_languages || [input.language || "ar"],
    fallback_source_id: input.fallback_source_id || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from("akp_content_sources")
    .upsert(row, { onConflict: input.id ? "id" : "slug" })
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    actor,
    action: input.id ? "source.update" : "source.create",
    resourceType: "akp_content_sources",
    resourceId: data.id,
    metadata: { slug: data.slug, name: data.name },
  });

  return { ok: true, source: normalizeSourceWithHealth(data) };
}

export async function deleteManagedSource(id, actor = null) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const { error } = await admin.from("akp_content_sources").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    actor,
    action: "source.delete",
    resourceType: "akp_content_sources",
    resourceId: id,
  });

  return { ok: true, deleted: id };
}

export async function toggleManagedSource(id, active, actor = null) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const patch = {
    active: Boolean(active),
    updated_at: new Date().toISOString(),
  };
  if (active) {
    patch.auto_disabled_at = null;
    patch.auto_disable_reason = null;
  }

  const { data, error } = await admin.from("akp_content_sources").update(patch).eq("id", id).select("*").single();
  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    actor,
    action: active ? "source.enable" : "source.disable",
    resourceType: "akp_content_sources",
    resourceId: id,
  });

  return { ok: true, source: normalizeSourceWithHealth(data) };
}

export async function testManagedSource(idOrUrl) {
  const admin = getSupabaseAdmin();
  let sourceUrl = String(idOrUrl);
  let source = null;

  if (admin && /^[0-9a-f-]{36}$/i.test(sourceUrl)) {
    const got = await getManagedSource(sourceUrl);
    if (!got.ok) return got;
    source = got.source;
    sourceUrl = source.source_url;
  }

  const result = await testSourceFetch(sourceUrl, source?.source_type || "rss");
  if (source?.id && admin) {
    await admin.from("akp_content_sources").update({
      last_http_status: result.httpStatus,
      last_response_ms: result.responseMs,
      items_extracted_last: result.itemsFound,
      health_score: result.healthScore,
      health_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", source.id);
  }

  return { ok: result.ok, source, test: result };
}

function slugFromUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/\./g, "-").slice(0, 40);
  } catch {
    return "source";
  }
}

export { slugFromUrl };
