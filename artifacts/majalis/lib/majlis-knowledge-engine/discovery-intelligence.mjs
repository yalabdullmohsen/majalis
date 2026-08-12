/**
 * Discovery Intelligence — priority queue, adaptive crawling, source scoring.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { PERFORMANCE } from "./config.mjs";

const SCORE_WEIGHTS = {
  trust: 0.25,
  popularity: 0.15,
  activity: 0.25,
  freshness: 0.2,
  health: 0.15,
};

export function computeCompositeScore(scores) {
  const s = {
    trust: Number(scores.trust_score ?? scores.trust ?? 70),
    popularity: Number(scores.popularity_score ?? scores.popularity ?? 50),
    activity: Number(scores.activity_score ?? scores.activity ?? 50),
    freshness: Number(scores.freshness_score ?? scores.freshness ?? 50),
    health: Number(scores.health_score ?? scores.health ?? 100),
  };
  const composite =
    s.trust * SCORE_WEIGHTS.trust +
    s.popularity * SCORE_WEIGHTS.popularity +
    s.activity * SCORE_WEIGHTS.activity +
    s.freshness * SCORE_WEIGHTS.freshness +
    s.health * SCORE_WEIGHTS.health;
  return { composite: Math.round(composite * 10) / 10, breakdown: s };
}

export function computeAdaptiveCrawlInterval(scores) {
  const { composite } = computeCompositeScore(scores);
  if (composite >= 85) return 15;
  if (composite >= 70) return 30;
  if (composite >= 50) return 60;
  if (composite >= 30) return 120;
  return 240;
}

export async function upsertSourceScore(source, crawlResult = {}) {
  const admin = getSupabaseAdmin();
  if (!admin || !source?.id) return { ok: false, local: true };

  const prev = source._scores || {};
  const activity = crawlResult.ok
    ? Math.min(100, (prev.activity_score ?? 50) + 5)
    : Math.max(0, (prev.activity_score ?? 50) - 15);
  const health = crawlResult.ok ? 100 : Math.max(0, (prev.health_score ?? 100) - 20);
  const freshness = crawlResult.itemsFound > 0 ? 100 : Math.max(0, (prev.freshness_score ?? 50) - 10);

  const row = {
    source_id: source.id,
    source_url: source.source_url,
    trust_score: source.trust_score ?? 70,
    popularity_score: prev.popularity_score ?? (source.priority ?? 5) * 10,
    activity_score: activity,
    freshness_score: freshness,
    health_score: health,
    latency_ms: crawlResult.durationMs ?? null,
    crawl_interval_min: 0,
    last_crawl_at: new Date().toISOString(),
    last_success_at: crawlResult.ok ? new Date().toISOString() : prev.last_success_at,
    last_error: crawlResult.error || null,
    items_found_7d: (prev.items_found_7d ?? 0) + (crawlResult.itemsFound ?? 0),
    updated_at: new Date().toISOString(),
  };

  row.crawl_interval_min = computeAdaptiveCrawlInterval(row);
  const { composite } = computeCompositeScore(row);
  row.metadata = { composite_score: composite };

  try {
    await admin.from("mke_source_scores").upsert(row, { onConflict: "source_id" });
    return { ok: true, scores: row, composite };
  } catch {
    return { ok: true, scores: row, composite, local: true };
  }
}

export async function buildPriorityQueue(sources, { maxItems = PERFORMANCE.cronMaxSources } = {}) {
  const admin = getSupabaseAdmin();
  const scored = [];

  for (const source of sources) {
    let dbScores = null;
    if (admin) {
      try {
        const { data } = await admin.from("mke_source_scores").select("*").eq("source_id", source.id).maybeSingle();
        dbScores = data;
      } catch {
        /* optional table */
      }
    }

    const merged = {
      trust_score: dbScores?.trust_score ?? source.trust_score ?? 70,
      popularity_score: dbScores?.popularity_score ?? (source.priority ?? 5) * 10,
      activity_score: dbScores?.activity_score ?? 50,
      freshness_score: dbScores?.freshness_score ?? 50,
      health_score: dbScores?.health_score ?? 100,
    };

    if (dbScores?.last_crawl_at) {
      const elapsed = Date.now() - new Date(dbScores.last_crawl_at).getTime();
      const intervalMs = (dbScores.crawl_interval_min ?? 60) * 60_000;
      if (elapsed < intervalMs) {
        merged._skipUntil = new Date(new Date(dbScores.last_crawl_at).getTime() + intervalMs).toISOString();
      }
    }

    const { composite } = computeCompositeScore(merged);
    scored.push({
      source: { ...source, _scores: dbScores },
      composite,
      priority: source.priority ?? 5,
      skipUntil: merged._skipUntil,
    });
  }

  const ready = scored
    .filter((s) => !s.skipUntil || new Date(s.skipUntil) <= new Date())
    .sort((a, b) => b.composite - a.composite || b.priority - a.priority)
    .slice(0, maxItems);

  if (admin) {
    for (const item of ready.slice(0, 10)) {
      try {
        await admin.from("mke_discovery_queue").insert({
          source_id: item.source.id,
          source_url: item.source.source_url,
          priority: item.priority,
          composite_score: item.composite,
          status: "scheduled",
          scheduled_at: new Date().toISOString(),
        });
      } catch {
        /* optional */
      }
    }
  }

  return ready.map((r) => r.source);
}

export async function markDiscoveryComplete(sourceId, result) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  try {
    await admin
      .from("mke_discovery_queue")
      .update({
        status: result.ok ? "completed" : "failed",
        finished_at: new Date().toISOString(),
        result: { itemsFound: result.itemsFound ?? 0, error: result.error || null },
      })
      .eq("source_id", sourceId)
      .eq("status", "scheduled")
      .order("created_at", { ascending: false })
      .limit(1);
  } catch {
    /* optional */
  }
}
