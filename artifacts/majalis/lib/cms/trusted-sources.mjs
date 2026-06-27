/**
 * Trusted content sources CRUD (Phase 3 — smart source monitoring).
 * Reads/writes trusted_content_sources with fallback to trusted_lesson_sources.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

const PRIMARY_TABLE = "trusted_content_sources";
const LEGACY_TABLE = "trusted_lesson_sources";

function trustScoreToLevel(score) {
  const s = Number(score) || 0;
  if (s >= 90) return "official";
  if (s >= 70) return "trusted";
  if (s >= 40) return "community";
  return "unknown";
}

function trustLevelToScore(level) {
  if (level === "official") return 100;
  if (level === "trusted") return 80;
  if (level === "community") return 50;
  return 30;
}

export function mapContentSourceToLegacy(row) {
  if (!row) return null;
  const config = row.config || {};
  const rawType = row.source_type || row.platform || "website";
  const sourceType = ["website", "rss", "youtube", "telegram", "instagram", "x", "manual"].includes(rawType)
    ? rawType
    : row.platform === "instagram"
      ? "instagram"
      : "website";
  return {
    id: row.id,
    name: row.name,
    platform: row.platform,
    url: row.url,
    source_type: sourceType,
    trust_level: trustScoreToLevel(row.trust_score),
    auto_publish_allowed: Boolean(row.auto_publish_allowed),
    country: row.country,
    city: config.city || null,
    category: row.category,
    active: row.active,
    feed_url: row.rss_url,
    last_checked_at: row.last_checked_at,
    last_success_at: row.last_success_at,
    failure_count: row.failure_count || 0,
    last_error: row.last_error,
    config: {
      ...config,
      handle: row.instagram_username || config.handle,
      website_url: row.website || config.website_url,
      youtube_channel_id: row.youtube_channel_id || config.youtube_channel_id,
      telegram_channel: row.telegram_channel || config.telegram_channel,
      priority: row.priority,
      language: row.language,
    },
    last_seen_urls: row.last_seen_urls || [],
  };
}

function mapLegacyToContentSource(payload) {
  const config = payload.config || {};
  const sourceType = payload.source_type || payload.platform || "website";
  return {
    name: payload.name,
    source_type: sourceType,
    platform: payload.platform || sourceType,
    url: payload.url,
    rss_url: payload.feed_url || payload.rss_url || null,
    instagram_username: config.handle || payload.instagram_username || null,
    youtube_channel_id: config.youtube_channel_id || payload.youtube_channel_id || null,
    telegram_channel: config.telegram_channel || payload.telegram_channel || (sourceType === "telegram" ? payload.url : null),
    website: config.website_url || payload.website || null,
    priority: config.priority ?? payload.priority ?? 5,
    trust_score: payload.trust_score ?? trustLevelToScore(payload.trust_level || "unknown"),
    category: payload.category || null,
    country: payload.country || "الكويت",
    language: config.language || payload.language || "ar",
    active: payload.active !== false,
    auto_publish_allowed: Boolean(payload.auto_publish_allowed),
    config,
    updated_at: new Date().toISOString(),
  };
}

async function querySourcesTable(admin, { activeOnly }) {
  let q = admin.from(PRIMARY_TABLE).select("*").order("priority", { ascending: false }).order("name");
  if (activeOnly) q = q.eq("active", true);
  const { data, error } = await q;
  if (!error && data?.length) return data.map(mapContentSourceToLegacy);

  let lq = admin.from(LEGACY_TABLE).select("*").order("name");
  if (activeOnly) lq = lq.eq("active", true);
  const { data: legacy } = await lq;
  return (legacy || []).map((r) =>
    mapContentSourceToLegacy({
      ...r,
      trust_score: trustLevelToScore(r.trust_level),
      rss_url: r.feed_url,
      instagram_username: r.config?.handle,
      website: r.config?.website_url,
      priority: r.config?.priority ?? 5,
      language: r.config?.language ?? "ar",
    }),
  );
}

export async function listTrustedSources({ activeOnly = false } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  return querySourcesTable(admin, { activeOnly });
}

export async function getTrustedSource(id) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data } = await admin.from(PRIMARY_TABLE).select("*").eq("id", id).maybeSingle();
  if (data) return mapContentSourceToLegacy(data);

  const { data: legacy } = await admin.from(LEGACY_TABLE).select("*").eq("id", id).maybeSingle();
  if (!legacy) return null;
  return mapContentSourceToLegacy({
    ...legacy,
    trust_score: trustLevelToScore(legacy.trust_level),
    rss_url: legacy.feed_url,
    instagram_username: legacy.config?.handle,
    website: legacy.config?.website_url,
  });
}

export async function upsertTrustedSource(payload) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing" };

  const row = mapLegacyToContentSource(payload);

  if (payload.id) {
    const { data, error } = await admin.from(PRIMARY_TABLE).update(row).eq("id", payload.id).select().single();
    if (!error && data) return { ok: true, source: mapContentSourceToLegacy(data) };

    const legacyRow = {
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
    const { data: leg, error: legErr } = await admin.from(LEGACY_TABLE).update(legacyRow).eq("id", payload.id).select().single();
    if (legErr) return { ok: false, error: legErr.message };
    return { ok: true, source: mapContentSourceToLegacy({ ...leg, trust_score: trustLevelToScore(leg.trust_level), rss_url: leg.feed_url }) };
  }

  const { data, error } = await admin.from(PRIMARY_TABLE).insert(row).select().single();
  if (!error && data) return { ok: true, source: mapContentSourceToLegacy(data) };

  const legacyInsert = {
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
  };
  const { data: inserted, error: insErr } = await admin.from(LEGACY_TABLE).insert(legacyInsert).select().single();
  if (insErr) return { ok: false, error: insErr.message };
  return { ok: true, source: mapContentSourceToLegacy({ ...inserted, trust_score: trustLevelToScore(inserted.trust_level), rss_url: inserted.feed_url }) };
}

export async function updateSourceCheckStatus(id, { success, error: errMsg, seenUrls } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  const patch = { last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  if (success) {
    patch.last_success_at = new Date().toISOString();
    patch.failure_count = 0;
    patch.last_error = null;
  } else if (errMsg) {
    const { data } = await admin.from(PRIMARY_TABLE).select("failure_count").eq("id", id).maybeSingle();
    patch.failure_count = (data?.failure_count || 0) + 1;
    patch.last_error = String(errMsg).slice(0, 500);
  }
  if (seenUrls?.length) {
    patch.last_seen_urls = seenUrls.slice(0, 50);
  }

  const { error } = await admin.from(PRIMARY_TABLE).update(patch).eq("id", id);
  if (!error) return;

  const legacyPatch = { last_checked_at: patch.last_checked_at, updated_at: patch.updated_at };
  if (success) {
    legacyPatch.last_success_at = patch.last_success_at;
    legacyPatch.failure_count = 0;
    legacyPatch.last_error = null;
  } else if (errMsg) {
    const { data } = await admin.from(LEGACY_TABLE).select("failure_count").eq("id", id).maybeSingle();
    legacyPatch.failure_count = (data?.failure_count || 0) + 1;
    legacyPatch.last_error = patch.last_error;
  }
  await admin.from(LEGACY_TABLE).update(legacyPatch).eq("id", id);
}

export { trustLevelToScore, trustScoreToLevel };
