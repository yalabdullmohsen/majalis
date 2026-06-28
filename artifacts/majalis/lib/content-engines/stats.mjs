/**
 * Dashboard stats for content engines.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { listEngines } from "./registry.mjs";
import { countPendingReviews } from "./review-queue.mjs";

export async function getContentEngineStats(days = 7) {
  const admin = getSupabaseAdmin();
  const engines = listEngines();

  if (!admin) {
    return {
      ok: false,
      engines: engines.map((e) => ({ ...e, enabled: true, health_score: 0 })),
      totals: {},
      reviewPending: 0,
    };
  }

  try {
    const { data: rpcData, error } = await admin.rpc("content_engine_stats", { p_days: days });
    if (!error && rpcData) {
      return {
        ok: true,
        ...rpcData,
        reviewPending: rpcData.review_pending ?? 0,
      };
    }
  } catch {
    /* fallback below */
  }

  const { data: configs } = await admin.from("content_engine_config").select("*");
  const configMap = Object.fromEntries((configs || []).map((c) => [c.id, c]));

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: runs } = await admin
    .from("content_engine_runs")
    .select("*")
    .gte("started_at", since.toISOString())
    .order("started_at", { ascending: false })
    .limit(100);

  const reviewPending = await countPendingReviews();

  const [{ count: benefits }, { count: questions }, { count: notes }, { count: recs }] = await Promise.all([
    admin.from("content_engine_generated_benefits").select("*", { count: "exact", head: true }).eq("status", "published"),
    admin.from("content_engine_generated_questions").select("*", { count: "exact", head: true }).eq("status", "published"),
    admin.from("content_engine_lesson_notes").select("*", { count: "exact", head: true }).eq("status", "published"),
    admin.from("content_engine_recommendations").select("*", { count: "exact", head: true }),
  ]);

  return {
    ok: true,
    engines: engines.map((e) => {
      const c = configMap[e.id] || {};
      const lastRun = (runs || []).find((r) => r.engine_id === e.id);
      return {
        id: e.id,
        label_ar: e.labelAr,
        enabled: c.enabled !== false,
        last_run_at: c.last_run_at,
        last_success_at: c.last_success_at,
        last_error: c.last_error,
        health_score: c.health_score ?? 100,
        lastRun,
      };
    }),
    recent_runs: runs || [],
    review_pending: reviewPending,
    totals: {
      published_benefits: benefits || 0,
      published_questions: questions || 0,
      lesson_notes: notes || 0,
      recommendations: recs || 0,
    },
  };
}

export async function getVerificationReport() {
  const admin = getSupabaseAdmin();
  const stats = await getContentEngineStats(30);

  let activeSources = 0;
  let fingerprints = 0;
  let auditEntries = 0;

  if (admin) {
    const [{ count: ls }, { count: ake }, { count: fp }, { count: audit }] = await Promise.all([
      admin.from("lesson_sources").select("*", { count: "exact", head: true }).eq("active", true),
      admin.from("ake_connectors").select("*", { count: "exact", head: true }).eq("is_active", true),
      admin.from("content_engine_source_fingerprints").select("*", { count: "exact", head: true }),
      admin.from("content_engine_publish_audit").select("*", { count: "exact", head: true }),
    ]);
    activeSources = (ls || 0) + (ake || 0);
    fingerprints = fp || 0;
    auditEntries = audit || 0;
  }

  const runs = stats.recent_runs || [];
  const aggregate = runs.reduce(
    (acc, r) => {
      acc.fetched += r.items_fetched || 0;
      acc.parsed += r.items_parsed || 0;
      acc.enriched += r.items_enriched || 0;
      acc.duplicates += r.items_duplicate || 0;
      acc.rejected += r.items_rejected || 0;
      acc.review += r.items_review || 0;
      acc.published += r.items_published || 0;
      acc.indexed += r.items_indexed || 0;
      return acc;
    },
    { fetched: 0, parsed: 0, enriched: 0, duplicates: 0, rejected: 0, review: 0, published: 0, indexed: 0 },
  );

  return {
    ok: stats.ok,
    activeSources,
    ...aggregate,
    publishedBenefits: stats.totals?.published_benefits || 0,
    publishedQuestions: stats.totals?.published_questions || 0,
    publishedArticles: 0,
    lessonNotes: stats.totals?.lesson_notes || 0,
    recommendationLinks: stats.totals?.recommendations || 0,
    reviewPending: stats.review_pending || 0,
    fingerprints,
    auditEntries,
    engines: stats.engines,
  };
}
