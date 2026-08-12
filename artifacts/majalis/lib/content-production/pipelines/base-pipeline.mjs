/**
 * Base pipeline — process staging items through validation, dedup, publish or review.
 */
import { checkDuplicate } from "../dedup.mjs";
import { validateContentItem, classifyContent } from "../validator.mjs";
import { publishToTarget, bumpDailyStats } from "../publisher.mjs";
import { logEvent, enqueueRetry } from "../monitoring.mjs";
import { getPipelineQuota } from "../config.mjs";

export async function processStagingItem(admin, stagingId, { runId } = {}) {
  const start = Date.now();
  const { data: row, error } = await admin
    .from("content_production_staging")
    .select("*")
    .eq("id", stagingId)
    .maybeSingle();
  if (error || !row) return { published: false, reason: "not_found" };
  if (row.status === "published") return { published: false, reason: "already_published" };

  const item = {
    ...row.metadata,
    title: row.title,
    body: row.body,
    source_url: row.source_url,
    source_name: row.metadata?.source_name,
    external_key: row.external_key,
  };

  const validation = validateContentItem(item, row.pipeline);
  if (!validation.passed) {
    await admin
      .from("content_production_staging")
      .update({ status: "review", validation_errors: validation.errors, updated_at: new Date().toISOString() })
      .eq("id", stagingId);
    await admin.from("content_production_review_queue").insert({
      staging_id: stagingId,
      pipeline: row.pipeline,
      failure_stage: validation.errors[0]?.stage || "validation",
      failure_reasons: validation.errors,
      payload: item,
    });
    await bumpDailyStats(admin, row.pipeline, { rejected: 1 });
    await logEvent(admin, {
      runId,
      pipeline: row.pipeline,
      stage: "validation",
      level: "warn",
      message: "Validation failed — sent to review queue",
      metadata: { staging_id: stagingId, errors: validation.errors },
      durationMs: Date.now() - start,
    });
    return { published: false, reason: "validation_failed", errors: validation.errors };
  }

  const dup = await checkDuplicate(admin, row.pipeline, item);
  if (dup.isDuplicate) {
    await admin
      .from("content_production_staging")
      .update({ status: "duplicate", updated_at: new Date().toISOString() })
      .eq("id", stagingId);
    await bumpDailyStats(admin, row.pipeline, { duplicate: 1 });
    await logEvent(admin, {
      runId,
      pipeline: row.pipeline,
      stage: "deduplication",
      level: "info",
      message: "Duplicate detected",
      metadata: { reasons: dup.reasons },
    });
    return { published: false, reason: "duplicate", match: dup.match };
  }

  const classification = classifyContent(item, row.pipeline);
  item.metadata = { ...item.metadata, ...classification };

  try {
    const result = await publishToTarget(admin, row.pipeline, item, stagingId);
    await admin
      .from("content_production_staging")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("id", stagingId);
    await bumpDailyStats(admin, row.pipeline, { published: 1, produced: 1 });
    await logEvent(admin, {
      runId,
      pipeline: row.pipeline,
      stage: "publishing",
      level: "info",
      message: `Published to ${result.targetTable}`,
      metadata: { target_id: result.targetId },
      durationMs: Date.now() - start,
    });
    return { published: true, ...result };
  } catch (err) {
    await enqueueRetry(admin, {
      pipeline: row.pipeline,
      jobId: "content-update",
      payload: { staging_id: stagingId },
      error: err.message,
    });
    await logEvent(admin, {
      runId,
      pipeline: row.pipeline,
      stage: "publishing",
      level: "error",
      message: err.message,
      metadata: { staging_id: stagingId },
    });
    return { published: false, reason: "publish_error", error: err.message };
  }
}

export async function runPipeline(admin, pipelineId, { runId, quota } = {}) {
  const dailyQuota = quota ?? getPipelineQuota(pipelineId, "daily");
  const weeklyQuota = getPipelineQuota(pipelineId, "weekly");
  const effectiveQuota = dailyQuota || weeklyQuota || 50;

  const { data: pending, error } = await admin
    .from("content_production_staging")
    .select("id")
    .eq("pipeline", pipelineId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(effectiveQuota);
  if (error) throw error;

  const result = { pipeline: pipelineId, processed: 0, published: 0, rejected: 0, duplicate: 0, errors: [] };

  for (const row of pending || []) {
    const out = await processStagingItem(admin, row.id, { runId });
    result.processed += 1;
    if (out.published) result.published += 1;
    else if (out.reason === "duplicate") result.duplicate += 1;
    else if (out.reason === "validation_failed") result.rejected += 1;
    else if (out.error) result.errors.push(out.error);
  }

  return result;
}

export async function processAllPending(admin, { runId, limit = 200 } = {}) {
  const { data: pending } = await admin
    .from("content_production_staging")
    .select("id, pipeline")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  const summary = { processed: 0, published: 0, rejected: 0, duplicate: 0, byPipeline: {} };

  for (const row of pending || []) {
    const out = await processStagingItem(admin, row.id, { runId });
    summary.processed += 1;
    if (!summary.byPipeline[row.pipeline]) {
      summary.byPipeline[row.pipeline] = { published: 0, rejected: 0, duplicate: 0 };
    }
    if (out.published) {
      summary.published += 1;
      summary.byPipeline[row.pipeline].published += 1;
    } else if (out.reason === "duplicate") {
      summary.duplicate += 1;
      summary.byPipeline[row.pipeline].duplicate += 1;
    } else if (out.reason === "validation_failed") {
      summary.rejected += 1;
      summary.byPipeline[row.pipeline].rejected += 1;
    }
  }

  return summary;
}
