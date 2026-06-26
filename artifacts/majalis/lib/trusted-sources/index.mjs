/**
 * Trusted Sources — unified sync layer with stats per source.
 */

import { TRUSTED_SOURCES } from "./registry.mjs";

const PROBE_TIMEOUT_MS = 15000;

async function probeFeedUrl(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "MajlisIlmBot/2.0 (+https://majlisilm.com)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (!res.ok) return { ok: false, status: res.status };
    const text = await res.text();
    const isRss = text.includes("<rss") || text.includes("<feed") || text.includes("<channel");
    return { ok: isRss, status: res.status, content_type: res.headers.get("content-type") };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

export async function syncTrustedSources(admin, opts = {}) {
  const result = { synced: 0, sources: [], errors: [] };

  if (!admin) {
    result.errors.push("no_admin");
    return result;
  }

  for (const source of TRUSTED_SOURCES) {
    if (!source.is_official) continue;

    let isActive = source.is_active;
    if (opts.probe && source.source_type === "rss" && source.url) {
      const probe = await probeFeedUrl(source.url);
      if (probe.ok) isActive = true;
    }

    try {
      const { data, error } = await admin
        .from("trusted_sources")
        .upsert(
          {
            name: source.name,
            source_type: source.source_type,
            url: source.url,
            category: source.category,
            trust_level: source.trust_level,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "url" },
        )
        .select()
        .single();

      if (error) {
        result.errors.push(`${source.slug}: ${error.message}`);
      } else {
        result.synced += 1;
        result.sources.push(data);
      }
    } catch (err) {
      result.errors.push(`${source.slug}: ${err.message}`);
    }
  }

  return result;
}

export async function getTrustedSourcesDashboard(admin) {
  if (!admin) {
    return TRUSTED_SOURCES.map((s) => ({
      ...s,
      status: "unknown",
      last_synced_at: null,
      imported_count: 0,
      error_count: 0,
    }));
  }

  const { data: sources } = await admin.from("trusted_sources").select("*").order("name");
  let healthRows = [];
  try {
    const { data } = await admin.from("source_health").select("*");
    healthRows = data || [];
  } catch {
    healthRows = [];
  }
  const healthMap = new Map(healthRows.map((h) => [h.source_id, h]));

  const enriched = await Promise.all(
    (sources || []).map(async (source) => {
      const health = healthMap.get(source.id);
      let imported_count = 0;
      let error_count = 0;

      try {
        const { count } = await admin
          .from("auto_imported_content")
          .select("*", { count: "exact", head: true })
          .eq("source_name", source.name);
        imported_count = count || 0;
      } catch {
        /* ignore */
      }

      try {
        const { count: failCount } = await admin
          .from("auto_import_logs")
          .select("*", { count: "exact", head: true })
          .eq("source_id", source.id)
          .eq("status", "failed");
        error_count = failCount || 0;
      } catch {
        error_count = health?.error_message ? 1 : 0;
      }

      return {
        id: source.id,
        name: source.name,
        url: source.url,
        source_type: source.source_type,
        trust_level: source.trust_level,
        is_active: source.is_active,
        category: source.category,
        last_synced_at: source.last_synced_at,
        status: health?.health_status || (source.is_active ? "active" : "inactive"),
        imported_count,
        error_count,
        items_found: health?.items_found || 0,
        last_checked: health?.last_checked,
      };
    }),
  );

  return enriched;
}

export async function getTrustedSourcesSummary(admin) {
  const dashboard = await getTrustedSourcesDashboard(admin);
  return {
    total: dashboard.length,
    active: dashboard.filter((s) => s.is_active).length,
    official: TRUSTED_SOURCES.filter((s) => s.is_official).length,
    total_imported: dashboard.reduce((sum, s) => sum + s.imported_count, 0),
    total_errors: dashboard.reduce((sum, s) => sum + s.error_count, 0),
    sources: dashboard,
  };
}
