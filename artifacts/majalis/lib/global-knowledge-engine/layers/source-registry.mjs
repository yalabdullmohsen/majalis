/**
 * Source Registry Layer — Phase 2: unified trusted source registry.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { layerStatus } from "./_helpers.mjs";
import { GKE_DELEGATES } from "../config.mjs";
import {
  getTrustedSourcesSeed,
  findTrustedSourceBySlug,
  SOURCE_CATEGORY_TYPES,
} from "../trusted-sources/registry.mjs";
import { computeReputation } from "../reputation-engine.mjs";
import { TRUSTED_SOURCES } from "../../trusted-sources/registry.mjs";
import { OFFICIAL_SOURCES } from "../../knowledge-engine/sources-registry.mjs";

const LAYER_ID = "source_registry";
const LAYER_PHASE = 2;

export function getStatus() {
  return layerStatus(LAYER_ID, "Source Registry", LAYER_PHASE, 2, GKE_DELEGATES.source_registry);
}

function normalizeSeedRow(row) {
  return {
    slug: row.slug,
    name: row.name,
    category_type: row.category_type || "rss",
    source_type: row.source_type || "rss",
    source_url: row.source_url || row.official_url || row.url,
    feed_url: row.feed_url || row.rss_url || row.feed_url,
    official_site: row.official_site || row.official_url || row.source_url,
    country: row.country || "KW",
    language: row.language || "ar",
    trust_score: row.trust_score ?? row.trust_level ?? 70,
    reputation_score: computeReputation(row),
    content_types: row.content_types || row.allowed_kinds || ["lesson"],
    refresh_interval_hours: row.refresh_interval_hours ?? row.crawl_interval_h ?? 24,
    publish_policy: row.publish_policy || "shadow",
    is_active: row.is_active !== false,
    is_official: row.is_official !== false,
    items_imported: row.items_imported || 0,
    items_accepted: row.items_accepted || 0,
    items_rejected: row.items_rejected || 0,
    items_duplicate: row.items_duplicate || 0,
    last_sync_at: row.last_sync_at || null,
    last_error: row.last_error || null,
    metadata: row.metadata || {},
    registry_origin: row.registry_origin || "gke_seed",
  };
}

function mergeLegacySources() {
  const bySlug = new Map();
  for (const s of getTrustedSourcesSeed()) {
    bySlug.set(s.slug, normalizeSeedRow({ ...s, registry_origin: "gke_trusted" }));
  }
  for (const s of TRUSTED_SOURCES) {
    if (s.url?.includes("example.com")) continue;
    const slug = s.slug || s.name?.slice(0, 20);
    if (!bySlug.has(slug)) {
      bySlug.set(
        slug,
        normalizeSeedRow({
          slug,
          name: s.name,
          source_url: s.url,
          feed_url: s.url,
          official_site: s.official_site,
          category_type: "rss",
          source_type: s.source_type,
          trust_score: s.trust_level,
          is_active: s.is_active,
          is_official: s.is_official,
          registry_origin: "trusted_sources",
        }),
      );
    }
  }
  for (const s of OFFICIAL_SOURCES) {
    if (s.official_url?.includes("example.com")) continue;
    if (!bySlug.has(s.slug)) {
      bySlug.set(
        s.slug,
        normalizeSeedRow({
          slug: s.slug,
          name: s.name,
          source_url: s.official_url,
          feed_url: s.rss_url,
          country: s.country,
          category_type: s.entity_type === "government" ? "government" : "rss",
          source_type: s.rss_url ? "rss" : "website",
          trust_score: (s.trust_level || 3) * 20,
          content_types: s.allowed_kinds,
          refresh_interval_hours: s.crawl_interval_h,
          is_active: !s.seed_only,
          registry_origin: "official_sources",
        }),
      );
    }
  }
  return [...bySlug.values()].filter((s) => !s.source_url?.includes("example.com"));
}

export async function listSources({ activeOnly = false, categoryType = null } = {}) {
  const admin = getSupabaseAdmin();
  let rows = mergeLegacySources();

  if (admin) {
    try {
      let q = admin.from("gke_trusted_sources").select("*").order("reputation_score", { ascending: false });
      if (activeOnly) q = q.eq("is_active", true);
      if (categoryType) q = q.eq("category_type", categoryType);
      const { data } = await q;
      if (data?.length) {
        rows = data.map((r) => ({ ...r, registry_origin: "database" }));
      }
    } catch {
      /* use seed fallback */
    }
  }

  if (activeOnly) rows = rows.filter((s) => s.is_active);
  if (categoryType) rows = rows.filter((s) => s.category_type === categoryType);

  return {
    ok: true,
    layer: LAYER_ID,
    phase: LAYER_PHASE,
    data: rows,
    count: rows.length,
    categories: SOURCE_CATEGORY_TYPES,
  };
}

/** @param {object[]} sources */
export async function registerSources(sources) {
  const admin = getSupabaseAdmin();
  const cleaned = sources
    .map(normalizeSeedRow)
    .filter((s) => s.source_url && !s.source_url.includes("example.com"));
  if (!admin) return { ok: true, data: cleaned, persisted: false };
  try {
    const { data, error } = await admin
      .from("gke_trusted_sources")
      .upsert(cleaned, { onConflict: "slug" })
      .select("*");
    if (error) throw error;
    return { ok: true, data: data || cleaned, persisted: true };
  } catch (err) {
    return { ok: false, error: String(err.message || err), data: cleaned };
  }
}

export async function syncSourcesToDatabase() {
  const seed = mergeLegacySources();
  return registerSources(seed);
}

export async function getSourceBySlug(slug) {
  const found = findTrustedSourceBySlug(slug);
  if (found) return normalizeSeedRow(found);
  const { data } = await listSources();
  return data.find((s) => s.slug === slug) || null;
}

export { SOURCE_CATEGORY_TYPES };
