/**
 * Content pipeline runner — independent pipeline per content type.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { enqueueJob } from "../../majlis-knowledge-engine/queue.mjs";
import { CONTENT_PIPELINES } from "../config.mjs";
import { fetchFromSource, fetchAllDueSources } from "../fetch.mjs";
import { listContentSources } from "../sources.mjs";
import { checkDuplicate } from "../dedup.mjs";
import { verifyContent, enqueueReview } from "../verification.mjs";
import { publishContentRecord } from "../publisher.mjs";
import { logStructured, moveToDeadLetter } from "../monitoring.mjs";
import { periodStart } from "../normalize.mjs";
import { recoverStuckRuns, enqueueRetry } from "../recovery.mjs";
import { batchSizeForPipeline, shouldRunPipelineNow } from "../production-scheduler.mjs";
import { QUEUE_DEFAULTS } from "../config.mjs";

async function startPipelineRun(pipeline, triggerType, mode) {
  const admin = getSupabaseAdmin();
  if (!admin) return { runId: null, startedAt: Date.now() };
  try {
    const { data } = await admin.from("akp_pipeline_runs").insert({
      pipeline,
      trigger_type: triggerType,
      mode,
      status: "running",
      quota_daily: CONTENT_PIPELINES[pipeline]?.quota || 0,
    }).select("id").single();
    return { runId: data?.id || null, startedAt: Date.now() };
  } catch {
    return { runId: null, startedAt: Date.now() };
  }
}

async function finishPipelineRun(runId, summary, startedAt) {
  const admin = getSupabaseAdmin();
  if (!admin || !runId) return;
  try {
    await admin.from("akp_pipeline_runs").update({
      status: summary.errors > 0 && summary.published === 0 ? "partial" : "completed",
      produced: summary.produced,
      published: summary.published,
      duplicates: summary.duplicates,
      rejected: summary.rejected,
      review_queued: summary.reviewQueued,
      errors: summary.errors,
      duration_ms: Date.now() - startedAt,
      metadata: summary.metadata || {},
      finished_at: new Date().toISOString(),
    }).eq("id", runId);
  } catch {
    /* optional */
  }
}

async function countPublishedInPeriod(contentType) {
  const pipeline = CONTENT_PIPELINES[contentType];
  if (!pipeline) return 0;
  const admin = getSupabaseAdmin();
  if (!admin) return 0;
  const since = periodStart(pipeline.quotaPeriod === "weekly" ? "weekly" : "daily");
  try {
    const { count } = await admin
      .from(pipeline.targetTable)
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);
    return count || 0;
  } catch {
    return 0;
  }
}

async function logMkeDecision({ source, record, decision, confidence, runId }) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  try {
    await admin.from("mke_decisions").insert({
      source_id: source?.id || null,
      source_url: record.source_url || record.link || source?.source_url,
      decision,
      confidence_score: confidence ?? 0.8,
      reasons: [],
      metadata: { pipeline_run_id: runId, content_type: record._contentType },
    });
  } catch {
    /* optional */
  }
}

async function logQualityReport({ source, record, verification, runId }) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  try {
    await admin.from("mke_quality_reports").insert({
      source_id: source?.id || null,
      source_url: record.source_url || source?.source_url,
      verdict: verification.verdict,
      blockers: verification.blockers,
      warnings: verification.warnings,
      checks: verification.checks,
    });
  } catch {
    /* optional */
  }
}

export async function runContentPipeline(contentType, opts = {}) {
  const pipeline = CONTENT_PIPELINES[contentType];
  if (!pipeline) return { ok: false, error: "unknown_pipeline" };

  await recoverStuckRuns();

  if (!opts.force && !shouldRunPipelineNow(contentType)) {
    return { ok: true, skipped: true, reason: "off_peak_schedule" };
  }

  const triggerType = opts.triggerType || "cron";
  const mode = opts.mode || "produce";
  const { runId, startedAt } = await startPipelineRun(contentType, triggerType, mode);

  const summary = {
    pipeline: contentType,
    produced: 0,
    published: 0,
    duplicates: 0,
    rejected: 0,
    reviewQueued: 0,
    errors: 0,
    metadata: {},
  };

  const alreadyPublished = await countPublishedInPeriod(contentType);
  const remainingQuota = Math.max(0, pipeline.quota - alreadyPublished);
  if (remainingQuota <= 0 && !opts.force) {
    summary.metadata.quotaMet = true;
    await finishPipelineRun(runId, summary, startedAt);
    return { ok: true, runId, ...summary, skipped: true, reason: "quota_met" };
  }

  const sources = await listContentSources({ activeOnly: true, contentType });
  const spreadBatch = batchSizeForPipeline(contentType, alreadyPublished);
  const maxItems = opts.maxItems ?? Math.min(remainingQuota, spreadBatch || 25);

  await logStructured({
    level: "info",
    component: "pipeline",
    event: "pipeline_start",
    pipeline: contentType,
    runId,
    metadata: { sources: sources.length, maxItems, remainingQuota },
  });

  let processed = 0;
  for (const source of sources) {
    if (processed >= maxItems) break;

    const fetchResult = opts.prefetched
      ? opts.prefetched.find((r) => r.source === source.slug && r.contentType === contentType)
      : await fetchFromSource(source, contentType);

    const items = fetchResult?.items || [];
    summary.produced += items.length;

    for (const item of items) {
      if (processed >= maxItems) break;
      item._contentType = contentType;

      try {
        const dup = await checkDuplicate({ contentType, record: item, source });
        if (dup.duplicate) {
          summary.duplicates += 1;
          await logMkeDecision({ source, record: item, decision: "duplicate", confidence: 1, runId });
          continue;
        }

        const verification = await verifyContent({ contentType, record: item, source });
        await logQualityReport({ source, record: item, verification, runId });

        const autoPublish = source.publication_policy?.auto_publish
          && source.trust_score >= (source.publication_policy?.min_trust ?? 80)
          && verification.ok;

        if (!verification.ok) {
          if (source.publication_policy?.review_on_fail !== false) {
            await enqueueReview({ contentType, record: item, source, verification, pipelineRunId: runId });
            summary.reviewQueued += 1;
            await logMkeDecision({ source, record: item, decision: "pending_review", confidence: 0.5, runId });
          } else {
            summary.rejected += 1;
            await logMkeDecision({ source, record: item, decision: "rejected", confidence: 0.3, runId });
          }
          continue;
        }

        if (!autoPublish && !opts.forcePublish) {
          await enqueueReview({ contentType, record: item, source, verification, pipelineRunId: runId });
          summary.reviewQueued += 1;
          await logMkeDecision({ source, record: item, decision: "pending_review", confidence: 0.85, runId });
          continue;
        }

        const pub = await publishContentRecord({
          contentType,
          record: item,
          source,
          fingerprint: dup.fingerprint,
          pipelineRunId: runId,
        });

        if (pub.ok) {
          summary.published += 1;
          processed += 1;
          await logMkeDecision({ source, record: item, decision: "approved", confidence: 0.95, runId });
        } else {
          summary.errors += 1;
          const retry = await enqueueRetry({
            jobType: `publish_${contentType}`,
            payload: item,
            error: pub.error,
            retryCount: 0,
            pipelineRunId: runId,
            maxRetries: QUEUE_DEFAULTS.maxRetries,
          });
          if (!retry.ok) {
            await moveToDeadLetter({
              queueName: "akp-pipeline",
              jobType: `publish_${contentType}`,
              payload: item,
              error: pub.error,
              failureReason: "publish_failed",
            });
          }
        }
      } catch (err) {
        summary.errors += 1;
        const retry = await enqueueRetry({
          jobType: `process_${contentType}`,
          payload: item,
          error: String(err.message || err),
          retryCount: 0,
          pipelineRunId: runId,
        });
        if (!retry.ok) {
          await moveToDeadLetter({
            queueName: "akp-pipeline",
            jobType: `process_${contentType}`,
            payload: item,
            error: String(err.message || err),
          });
        }
      }
    }
  }

  await finishPipelineRun(runId, summary, startedAt);
  await logStructured({
    level: "info",
    component: "pipeline",
    event: "pipeline_complete",
    pipeline: contentType,
    runId,
    durationMs: Date.now() - startedAt,
    metadata: summary,
  });

  return { ok: summary.errors === 0 || summary.published > 0, runId, ...summary };
}

export async function runAllPipelines(opts = {}) {
  const results = {};
  for (const type of Object.keys(CONTENT_PIPELINES)) {
    results[type] = await runContentPipeline(type, opts);
  }
  return { ok: true, results };
}

export async function runFetchMode(opts = {}) {
  const fetchResult = await fetchAllDueSources(opts.contentType);
  return { ok: true, ...fetchResult };
}

export async function runValidateMode(opts = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  let processed = 0;
  let approved = 0;
  let rejected = 0;

  try {
    const { data: pending } = await admin
      .from("akp_review_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(opts.batchSize || 25);

    for (const row of pending || []) {
      processed += 1;
      const verification = await verifyContent({
        contentType: row.content_type,
        record: row.payload,
        source: { slug: row.source_slug },
      });

      if (verification.ok) {
        const pub = await publishContentRecord({
          contentType: row.content_type,
          record: row.payload,
          source: { slug: row.source_slug },
        });
        if (pub.ok) {
          approved += 1;
          await admin.from("akp_review_queue").update({
            status: "approved",
            resolved_at: new Date().toISOString(),
          }).eq("id", row.id);
        }
      } else {
        rejected += 1;
        await admin.from("akp_review_queue").update({
          status: "rejected",
          blockers: verification.blockers,
          resolved_at: new Date().toISOString(),
        }).eq("id", row.id);
      }
    }
  } catch (err) {
    return { ok: false, error: String(err.message || err), processed, approved, rejected };
  }

  return { ok: true, processed, approved, rejected };
}

export async function runReindexMode() {
  const { runFullKnowledgeSync } = await import("../../auto-knowledge-sync.mjs");
  const result = await runFullKnowledgeSync({ triggerType: "cron", includeAutoContent: true });
  await enqueueJob({ jobType: "seo_refresh", payload: {}, priority: 3 });
  return { ok: true, reindex: result };
}

export async function runAuditMode() {
  const dashboard = await (await import("../monitoring.mjs")).getPlatformDashboard();
  const issues = [];

  for (const [type, stats] of Object.entries(dashboard.pipelines || {})) {
    if (stats.publishedToday < stats.quota * 0.1) {
      issues.push({ pipeline: type, issue: "low_production", published: stats.publishedToday, quota: stats.quota });
    }
  }

  if ((dashboard.counts?.dlq || 0) > 5) {
    issues.push({ issue: "dlq_backlog", count: dashboard.counts.dlq });
  }

  await (await import("../monitoring.mjs")).createAlert({
    severity: issues.length ? "warning" : "info",
    component: "quality_audit",
    title: "Weekly Quality Audit",
    message: `${issues.length} issue(s) found`,
    metadata: { issues, dashboard: dashboard.counts },
  });

  return { ok: true, issues, dashboard: dashboard.counts };
}

export async function runCleanupMode() {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  let cleaned = { logs: 0, metrics: 0, resolvedAlerts: 0 };

  try {
    const { count: logs } = await admin.from("akp_structured_logs").delete().lt("created_at", cutoff.toISOString()).select("id", { count: "exact" });
    cleaned.logs = logs || 0;
  } catch { /* optional */ }

  try {
    const metricsCutoff = new Date();
    metricsCutoff.setDate(metricsCutoff.getDate() - 30);
    const { count: metrics } = await admin.from("akp_metrics_snapshots").delete().lt("created_at", metricsCutoff.toISOString()).select("id", { count: "exact" });
    cleaned.metrics = metrics || 0;
  } catch { /* optional */ }

  try {
    const { count: alerts } = await admin.from("akp_alerts").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("resolved", false).lt("created_at", cutoff.toISOString()).select("id", { count: "exact" });
    cleaned.resolvedAlerts = alerts || 0;
  } catch { /* optional */ }

  return { ok: true, cleaned };
}

export { CONTENT_PIPELINES };
