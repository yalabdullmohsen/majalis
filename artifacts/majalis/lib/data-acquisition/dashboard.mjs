import {
  listSources, listItems, listRuns, listLogs, listReviewQueue, useSupabase,
} from "./store.mjs";

export async function buildDashboard() {
  const [sources, items, runs, review, logs] = await Promise.all([
    listSources(),
    listItems({ limit: 10000 }),
    listRuns(10),
    listReviewQueue(100),
    listLogs(30),
  ]);

  const byStatus = {};
  for (const i of items) {
    byStatus[i.status] = (byStatus[i.status] || 0) + 1;
  }

  const coverage = {};
  for (const i of items) {
    coverage[i.content_type] = (coverage[i.content_type] || 0) + 1;
  }

  const activeSources = sources.filter((s) => s.status === "active").length;
  const errorSources = sources.filter((s) => s.status === "error").length;

  const classifyAcc = items.length
    ? Math.round((items.filter((i) => i.content_type).length / items.length) * 100)
    : 0;

  return {
    ok: true,
    storage: useSupabase() ? "supabase" : "local",
    sources: {
      total: sources.length,
      active: activeSources,
      error: errorSources,
      list: sources,
    },
    items: {
      total: items.length,
      published: byStatus.published || 0,
      review: byStatus.review || 0,
      duplicate: byStatus.duplicate || 0,
      merged: byStatus.merged || 0,
      rejected: byStatus.rejected || 0,
      byStatus,
      coverage,
    },
    reviewQueue: review.length,
    lastRun: runs[0] || null,
    recentRuns: runs,
    recentLogs: logs,
    metrics: {
      classificationAccuracyPct: classifyAcc,
      publishRatePct: items.length ? Math.round(((byStatus.published || 0) / items.length) * 100) : 0,
    },
  };
}
