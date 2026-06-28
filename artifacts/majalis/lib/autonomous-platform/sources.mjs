/**
 * Config-driven source registry — DB + JSON seed, no code change for new sources.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { DEDUP_DEFAULTS } from "./config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveSourcesJsonPath() {
  const candidates = [
    join(__dirname, "../../data/autonomous-platform/sources.json"),
    join(process.cwd(), "data/autonomous-platform/sources.json"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return candidates[0];
}

export function loadSourcesFromJson() {
  try {
    const raw = readFileSync(resolveSourcesJsonPath(), "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function normalizeSource(row) {
  return {
    id: row.id,
    slug: row.slug || slugFromUrl(row.source_url),
    name: row.name,
    source_type: row.source_type || "rss",
    source_url: row.source_url,
    priority: Number(row.priority ?? 5),
    trust_score: Number(row.trust_score ?? 70),
    language: row.language || "ar",
    category: row.category || "general",
    content_types: row.content_types || [],
    fetch_interval_hours: Number(row.fetch_interval_hours ?? 1),
    dedup_rules: { ...DEDUP_DEFAULTS, ...(row.dedup_rules || {}) },
    parser: row.parser || "rss",
    validator: row.validator || "scholarly_v1",
    publication_policy: row.publication_policy || { auto_publish: false, min_trust: 80, review_on_fail: true },
    active: row.active !== false,
    last_fetch_at: row.last_fetch_at,
    last_success_at: row.last_success_at,
    last_error: row.last_error,
    metadata: row.metadata || {},
    fallback_urls: row.fallback_urls || row.metadata?.fallback_urls || [],
  };
}

function slugFromUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/\./g, "-").slice(0, 40);
  } catch {
    return "source";
  }
}

export async function listContentSources({ activeOnly = true, contentType = null } = {}) {
  const admin = getSupabaseAdmin();
  const out = [];

  if (admin) {
    try {
      let q = admin.from("akp_content_sources").select("*").order("priority", { ascending: false });
      if (activeOnly) q = q.eq("active", true);
      const { data } = await q;
      for (const row of data || []) {
        out.push(normalizeSource(row));
      }
    } catch {
      /* table optional until migration */
    }
  }

  if (!out.length) {
    for (const row of loadSourcesFromJson()) {
      out.push(normalizeSource(row));
    }
  }

  if (contentType) {
    return out.filter((s) => s.content_types.includes(contentType));
  }
  return out;
}

export async function upsertContentSource(source) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const row = {
    slug: source.slug || slugFromUrl(source.source_url),
    name: source.name,
    source_type: source.source_type || "rss",
    source_url: source.source_url,
    priority: source.priority ?? 5,
    trust_score: source.trust_score ?? 70,
    language: source.language || "ar",
    category: source.category || "general",
    content_types: source.content_types || [],
    fetch_interval_hours: source.fetch_interval_hours ?? 1,
    dedup_rules: source.dedup_rules || DEDUP_DEFAULTS,
    parser: source.parser || "rss",
    validator: source.validator || "scholarly_v1",
    publication_policy: source.publication_policy || { auto_publish: false, min_trust: 80 },
    active: source.active !== false,
    metadata: {
      ...(source.metadata || {}),
      fallback_urls: source.fallback_urls || source.metadata?.fallback_urls || [],
    },
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await admin
      .from("akp_content_sources")
      .upsert(row, { onConflict: "slug" })
      .select("*")
      .single();
    if (error) throw error;
    return { ok: true, source: normalizeSource(data) };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

export async function seedContentSourcesFromJson() {
  const sources = loadSourcesFromJson();
  let seeded = 0;
  const errors = [];
  for (const src of sources) {
    const r = await upsertContentSource(src);
    if (r.ok) seeded += 1;
    else errors.push({ slug: src.slug, error: r.error });
  }
  return { ok: errors.length === 0, seeded, errors };
}

export async function markSourceFetch(sourceId, { ok, error }) {
  const admin = getSupabaseAdmin();
  if (!admin || !sourceId) return;
  try {
    await admin.from("akp_content_sources").update({
      last_fetch_at: new Date().toISOString(),
      last_success_at: ok ? new Date().toISOString() : undefined,
      last_error: ok ? null : String(error || "fetch_failed"),
      updated_at: new Date().toISOString(),
    }).eq("id", sourceId);
  } catch {
    /* optional */
  }
}

export async function syncSourcesToMkePlugins() {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, synced: 0 };

  const sources = await listContentSources({ activeOnly: true });
  let synced = 0;
  for (const s of sources) {
    try {
      const { error } = await admin.from("mke_source_plugins").upsert({
        name: s.name,
        source_type: s.source_type,
        platform: s.source_type,
        source_url: s.source_url,
        trust_score: s.trust_score,
        auto_publish: s.publication_policy?.auto_publish ?? false,
        active: s.active,
        priority: s.priority,
        content_types: s.content_types,
        language: s.language,
        fetch_interval_hours: s.fetch_interval_hours,
        dedup_rules: s.dedup_rules,
        parser: s.parser,
        validator: s.validator,
        publication_policy: s.publication_policy,
        config: { akp_slug: s.slug, category: s.category },
        updated_at: new Date().toISOString(),
      }, { onConflict: "source_url" });
      if (!error) synced += 1;
    } catch {
      /* mke table optional */
    }
  }
  return { ok: true, synced };
}
