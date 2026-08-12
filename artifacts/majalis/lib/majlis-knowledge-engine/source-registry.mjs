/**
 * Unified Source Intelligence — plugin registry (DB-driven, no code change for new sources).
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { createSourceConnector } from "../cms/connectors/index.mjs";
import { resolveAdapterType, discoverViaAdapter, lessonSourceToConnectorSource } from "../cms/lesson-intelligence/adapters/index.mjs";
import { listTrustedSources } from "../cms/trusted-sources.mjs";
import { listLessonSources } from "../cms/lesson-intelligence/sources.mjs";
import { SUPPORTED_SOURCE_TYPES } from "./config.mjs";

export function isSupportedSourceType(type) {
  return SUPPORTED_SOURCE_TYPES.includes(String(type || "").toLowerCase());
}

export async function listRegisteredSources({ activeOnly = true } = {}) {
  const admin = getSupabaseAdmin();
  const out = [];

  // Phase 6 lesson_sources (preferred)
  try {
    const lessonSources = await listLessonSources({ activeOnly });
    for (const s of lessonSources) {
      out.push(normalizeSource(s, "lesson_sources"));
    }
  } catch {
    /* optional table */
  }

  // Phase 3–5 trusted_content_sources / trusted_lesson_sources
  try {
    const trusted = await listTrustedSources({ activeOnly });
    for (const s of trusted) {
      if (out.some((x) => x.source_url === s.url)) continue;
      out.push(normalizeSource({
        id: s.id,
        source_name: s.name,
        source_type: s.source_type || s.platform,
        source_url: s.url,
        platform: s.platform,
        trust_score: s.trust_level === "official" ? 100 : s.trust_level === "trusted" ? 80 : 50,
        auto_publish: s.auto_publish_allowed,
        active: s.active,
        country: s.country,
        city: s.city,
        config: s.config,
      }, "trusted_sources"));
    }
  } catch {
    /* optional */
  }

  // DB plugin registry (mke_source_plugins)
  if (admin) {
    try {
      let q = admin.from("mke_source_plugins").select("*").order("priority", { ascending: false });
      if (activeOnly) q = q.eq("active", true);
      const { data } = await q;
      for (const row of data || []) {
        if (out.some((x) => x.source_url === row.source_url)) continue;
        out.push(normalizeSource({
          id: row.id,
          source_name: row.name,
          source_type: row.source_type,
          source_url: row.source_url,
          platform: row.platform || row.source_type,
          trust_score: row.trust_score ?? 70,
          auto_publish: row.auto_publish ?? false,
          active: row.active !== false,
          country: row.country,
          city: row.city,
          config: row.config || {},
        }, "mke_source_plugins"));
      }
    } catch {
      /* table optional until migration applied */
    }
  }

  return out;
}

function normalizeSource(raw, origin) {
  const type = String(raw.source_type || raw.platform || "website").toLowerCase();
  return {
    id: raw.id,
    source_name: raw.source_name || raw.name,
    source_type: type,
    source_url: raw.source_url || raw.url,
    platform: raw.platform || resolveAdapterType(type),
    adapter_type: resolveAdapterType(type),
    trust_score: Number(raw.trust_score ?? 50),
    auto_publish: Boolean(raw.auto_publish ?? raw.auto_publish_allowed),
    active: raw.active !== false,
    country: raw.country || "الكويت",
    city: raw.city || null,
    config: raw.config || {},
    origin,
  };
}

export async function discoverFromSource(source) {
  const t0 = Date.now();
  try {
    const result = await discoverViaAdapter(source);
    return {
      ok: true,
      source: source.source_name,
      items: result.items || [],
      manualAssistMode: result.manualAssistMode,
      connectorHint: result.connectorHint,
      durationMs: Date.now() - t0,
    };
  } catch (err) {
    return {
      ok: false,
      source: source.source_name,
      items: [],
      error: String(err.message || err),
      durationMs: Date.now() - t0,
    };
  }
}

export async function upsertSourcePlugin(payload) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing" };

  const row = {
    name: payload.name,
    source_type: payload.source_type || payload.platform || "website",
    platform: payload.platform || payload.source_type || "website",
    source_url: payload.source_url || payload.url,
    trust_score: payload.trust_score ?? 70,
    auto_publish: Boolean(payload.auto_publish),
    active: payload.active !== false,
    country: payload.country || "الكويت",
    city: payload.city || null,
    priority: payload.priority ?? 5,
    config: payload.config || {},
    updated_at: new Date().toISOString(),
  };

  if (payload.id) {
    const { data, error } = await admin.from("mke_source_plugins").update(row).eq("id", payload.id).select().single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, source: data };
  }

  const { data, error } = await admin.from("mke_source_plugins").insert(row).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, source: data };
}

export function listSupportedPlatforms() {
  return SUPPORTED_SOURCE_TYPES.map((t) => ({
    type: t,
    adapter: resolveAdapterType(t),
    label: t.replace(/_/g, " "),
  }));
}
