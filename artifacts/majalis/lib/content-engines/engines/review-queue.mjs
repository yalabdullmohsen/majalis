/**
 * Review Queue Engine — surface and count pending reviews.
 */
import { listPendingReviews, countPendingReviews } from "../review-queue.mjs";
import { startEngineRun, finishEngineRun, createRunLogger } from "../run-manager.mjs";
import { getSupabaseAdmin } from "../../supabase-admin.mjs";

const ENGINE_ID = "review-queue";

export async function run({ runType = "incremental" } = {}) {
  const { runId, startedAt } = await startEngineRun(ENGINE_ID, runType);
  const log = createRunLogger(runId, ENGINE_ID);
  const stats = {
    items_fetched: 0,
    items_parsed: 0,
    items_review: 0,
    items_published: 0,
    errors: 0,
  };

  try {
    const pending = await listPendingReviews({ limit: 100 });
    stats.items_fetched = pending.length;
    stats.items_review = pending.length;

    const admin = getSupabaseAdmin();
    if (admin) {
      const { count: cpReview } = await admin
        .from("content_production_review_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      stats.items_fetched += cpReview || 0;
      stats.items_review += cpReview || 0;
    }

    await log("publish_or_review", "info", `Review queue: ${stats.items_review} pending`);
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { report: { pending: pending.slice(0, 20) } });
    return { ok: true, engineId: ENGINE_ID, runId, stats, pending: pending.slice(0, 20) };
  } catch (err) {
    stats.errors = 1;
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { errorMessage: err.message });
    return { ok: false, error: err.message, stats };
  }
}
