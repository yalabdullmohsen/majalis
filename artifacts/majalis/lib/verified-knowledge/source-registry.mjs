/**
 * Unified Verified Source Registry — merges trusted-sources + scholarly + knowledge registries.
 */

import { TRUSTED_SOURCES } from "../trusted-sources/registry.mjs";
import { OFFICIAL_SOURCE_DEFAULTS } from "./constants.mjs";

function normalizeSource(entry) {
  return {
    slug: entry.slug,
    name: entry.name,
    name_ar: entry.name_ar ?? entry.name,
    entity_name: entry.entity_name ?? entry.name,
    source_type: entry.source_type ?? "website",
    url: entry.url ?? entry.official_site ?? null,
    official_site: entry.official_site ?? entry.url ?? null,
    category: entry.category ?? "general",
    trust_level: entry.trust_level ?? 80,
    licensing: entry.licensing ?? "unknown",
    import_method: entry.import_method ?? entry.source_type ?? "connector",
    source_language: entry.source_language ?? "ar",
    is_active: entry.is_active !== false,
    is_official: entry.is_official !== false,
    connection_status: entry.connection_status ?? "unknown",
    note: entry.note ?? null,
    metadata: entry.metadata ?? {},
  };
}

export function getVerifiedSourceRegistry() {
  const bySlug = new Map();

  for (const src of Object.values(OFFICIAL_SOURCE_DEFAULTS)) {
    bySlug.set(src.slug, normalizeSource(src));
  }

  for (const src of TRUSTED_SOURCES) {
    bySlug.set(src.slug, normalizeSource({
      ...src,
      entity_name: src.name,
      licensing: "official_feed",
      import_method: src.source_type === "rss" ? "rss" : "connector",
      source_language: "ar",
    }));
  }

  return Array.from(bySlug.values());
}

export function getSourceBySlug(slug) {
  return getVerifiedSourceRegistry().find((s) => s.slug === slug) ?? null;
}

export async function syncVerifiedSourceRegistry(admin) {
  const sources = getVerifiedSourceRegistry();
  const results = { upserted: 0, errors: [] };

  if (!admin) {
    return { ok: false, sources, ...results, error: "Supabase admin not configured" };
  }

  for (const src of sources) {
    try {
      const row = {
        slug: src.slug,
        name: src.name,
        name_ar: src.name_ar,
        source_type: src.source_type === "database" ? "database" : src.source_type,
        url: src.url,
        entity_name: src.entity_name,
        trust_level: src.trust_level,
        is_active: src.is_active,
        licensing: src.licensing,
        import_method: src.import_method,
        source_language: src.source_language,
        metadata: {
          category: src.category,
          is_official: src.is_official,
          note: src.note,
          official_site: src.official_site,
        },
        updated_at: new Date().toISOString(),
      };

      await admin.from("scholarly_sources").upsert(row, { onConflict: "slug" });

      await admin.from("trusted_sources").upsert(
        {
          slug: src.slug,
          name: src.name,
          source_type: src.source_type,
          url: src.url,
          official_site: src.official_site,
          category: src.category,
          trust_level: src.trust_level,
          is_active: src.is_active,
          note: src.note,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      ).catch(() => {});

      results.upserted += 1;
    } catch (err) {
      results.errors.push({ slug: src.slug, error: String(err?.message || err) });
    }
  }

  return { ok: results.errors.length === 0, sources, ...results };
}

export async function getVerifiedSourcesDashboard(admin) {
  const registry = getVerifiedSourceRegistry();
  if (!admin) {
    return {
      total: registry.length,
      official: registry.filter((s) => s.is_official).length,
      active: registry.filter((s) => s.is_active).length,
      sources: registry,
    };
  }

  const { data: dbSources } = await admin.from("scholarly_sources").select("*").order("trust_level", { ascending: false });
  const dbMap = new Map((dbSources ?? []).map((s) => [s.slug, s]));

  const merged = registry.map((src) => ({
    ...src,
    db: dbMap.get(src.slug) ?? null,
    items_imported: dbMap.get(src.slug)?.items_imported ?? 0,
    connection_status: dbMap.get(src.slug)?.connection_status ?? src.connection_status,
  }));

  return {
    total: merged.length,
    official: merged.filter((s) => s.is_official).length,
    active: merged.filter((s) => s.is_active).length,
    sources: merged,
  };
}
