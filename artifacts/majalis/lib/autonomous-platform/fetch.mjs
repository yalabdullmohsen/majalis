/**
 * Source fetch — delegates to TKN connector registry (Phase 5).
 */
import { fetchFromConnector } from "../trusted-knowledge-network/connectors/index.mjs";
import { logStructured } from "./monitoring.mjs";
import { updateSourceStatsFromFetch } from "../trusted-knowledge-network/sources-stats.mjs";

export async function fetchFromSource(source, contentType) {
  const started = Date.now();
  try {
    const items = await fetchFromConnector(source, contentType);

    await logStructured({
      level: "info",
      component: "fetch",
      event: "source_fetched",
      pipeline: contentType,
      durationMs: Date.now() - started,
      metadata: { source: source.slug, items: items.length, parser: source.parser || source.source_type },
    });

    await updateSourceStatsFromFetch(source.id, { ok: true, items: items.length });

    return { ok: true, items, durationMs: Date.now() - started };
  } catch (err) {
    await logStructured({
      level: "error",
      component: "fetch",
      event: "fetch_failed",
      pipeline: contentType,
      message: String(err.message || err),
      metadata: { source: source.slug },
    });
    await updateSourceStatsFromFetch(source.id, { ok: false, error: err.message });
    return { ok: false, error: String(err.message || err), items: [] };
  }
}

export async function fetchAllDueSources(contentType = null) {
  const { listContentSources, markSourceFetch } = await import("./sources.mjs");
  const sources = await listContentSources({ activeOnly: true, contentType });
  const now = Date.now();
  const results = [];

  for (const source of sources) {
    const intervalMs = (source.fetch_interval_hours || 1) * 3600_000;
    const lastFetch = source.last_fetch_at ? new Date(source.last_fetch_at).getTime() : 0;
    if (lastFetch && now - lastFetch < intervalMs) continue;

    const types = contentType ? [contentType] : source.content_types;
    for (const type of types) {
      const fetchResult = await fetchFromSource(source, type);
      await markSourceFetch(source.id, { ok: fetchResult.ok, error: fetchResult.error });
      results.push({ source: source.slug, contentType: type, ...fetchResult });
    }
  }

  return { ok: true, results, sourcesFetched: results.length };
}
