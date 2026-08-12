/**
 * Global Reference dashboard metrics.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getAllSources } from "./sources.mjs";
import { getRelationStats } from "./relations.mjs";
import { getQualityStats } from "./quality.mjs";
import { getReviewHistory } from "./review.mjs";
import { getAutonomousObservability } from "../autonomous-ai/observability.mjs";

export async function getReferenceDashboard(admin) {
  admin = admin || getSupabaseAdmin();

  let stats = {};
  if (admin) {
    try {
      const { data } = await admin.rpc("global_reference_stats");
      stats = data || {};
    } catch {
      /* RPC may not exist */
    }
  }

  const [sources, relations, quality, reviews, autonomous] = await Promise.all([
    getAllSources(admin),
    getRelationStats(admin),
    getQualityStats(admin),
    getReviewHistory(admin, 5),
    getAutonomousObservability(admin).catch(() => null),
  ]);

  const verificationPct = stats.refs_count
    ? Math.round(((stats.verified_count || 0) / stats.refs_count) * 100)
    : 0;

  return {
    ok: true,
    at: new Date().toISOString(),
    counts: {
      refs: stats.refs_count || 0,
      relations: stats.relations_count || relations.total || 0,
      sources: stats.sources_count || sources.length,
      verified: stats.verified_count || 0,
      needs_review: stats.needs_review_count || 0,
      incomplete: stats.incomplete_count || quality.incomplete || 0,
    },
    verification_pct: verificationPct,
    avg_quality_score: stats.avg_quality_score || quality.avg || 0,
    sources: sources.slice(0, 10),
    recent_reviews: reviews,
    ai: {
      status: autonomous?.ai?.status || (process.env.OPENAI_API_KEY ? "configured" : "limited"),
      metadata_only: true,
    },
    database: {
      status: admin ? "connected" : "disconnected",
    },
    backups: {
      status: "manual",
      note: "Supabase automatic backups enabled on paid plans",
    },
    updates: {
      last_review: reviews[0]?.finished_at || null,
      autonomous_last_run: autonomous?.metrics?.runsTotal ? "active" : "pending",
    },
  };
}
