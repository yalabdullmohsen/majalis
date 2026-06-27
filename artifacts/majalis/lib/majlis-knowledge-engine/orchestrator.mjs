/**
 * Majlis Knowledge Engine — central orchestrator (Autonomous Platform 1.0).
 * All content flows through: discover → vision → extract → decide → publish → graph → index.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { runFullKnowledgeSync } from "../auto-knowledge-sync.mjs";
import { runLessonIntelligenceEngine } from "../cms/lesson-intelligence/engine.mjs";
import { runAutonomousOrchestrator } from "../autonomous-ai/orchestrator.mjs";
import { runReasoningCycle } from "../reasoning-engine/orchestrator.mjs";
import { logAutomationStep } from "../cms/automation-step-logs.mjs";
import { computeExtractionConfidence } from "../cms/lesson-intelligence/trust-scorer.mjs";
import { fieldCompletenessScore } from "../cms/lesson-intelligence/dedup-engine.mjs";
import { resolveEntities } from "../cms/lesson-intelligence/entity-resolver.mjs";

import { ENGINE_VERSION, PIPELINE_STAGES, PERFORMANCE } from "./config.mjs";
import { listRegisteredSources, discoverFromSource } from "./source-registry.mjs";
import { analyzeContentItem } from "./vision-intelligence.mjs";
import { makeContentDecision } from "./decision-engine.mjs";
import { executePublishPipeline } from "./publish-pipeline.mjs";
import { applyContentUpdate, findExistingLessonBySourceUrl } from "./update-engine.mjs";
import { archiveExpiredLessons } from "./expiry-engine.mjs";
import { processQueue } from "./queue.mjs";
import { getEngineMetrics, computeAutomationCompletion } from "./metrics.mjs";

const AUTO_PUBLISH_KILL = process.env.MAJALIS_AUTO_PUBLISH === "0";

async function startRun(admin, triggerType, mode) {
  if (!admin) return { runId: null };
  try {
    const { data } = await admin
      .from("mke_runs")
      .insert({ trigger_type: triggerType, mode, status: "running" })
      .select("id")
      .single();
    return { runId: data?.id || null, startedAt: Date.now() };
  } catch {
    return { runId: null, startedAt: Date.now() };
  }
}

async function finishRun(admin, runId, summary, startedAt) {
  if (!admin || !runId) return;
  try {
    await admin.from("mke_runs").update({
      status: summary.errors > 0 && summary.published === 0 ? "partial" : "completed",
      sources_scanned: summary.sourcesScanned,
      items_discovered: summary.itemsDiscovered,
      items_analyzed: summary.itemsAnalyzed,
      items_published: summary.published,
      items_pending: summary.pendingReview,
      items_duplicate: summary.duplicates,
      items_rejected: summary.rejected,
      items_updated: summary.updated,
      items_expired: summary.expired,
      errors: summary.errors,
      duration_ms: Date.now() - startedAt,
      metadata: summary.metadata || {},
      finished_at: new Date().toISOString(),
    }).eq("id", runId);
  } catch {
    /* optional */
  }
}

async function processDiscoveredItem({ source, item, runId }) {
  const sourceUrl = item.link || item.url || source.source_url;

  const existing = await findExistingLessonBySourceUrl(sourceUrl);
  const vision = await analyzeContentItem({ source, item });
  const parsed = vision.parsed || {};
  const images = item.mediaUrls || (item.imageUrl ? [item.imageUrl] : []);
  const imageUrl = item.imageUrl || images[0] || null;
  const confidenceScore = computeExtractionConfidence({
    sourceTrust: source.trust_score,
    extractionConfidence: vision.metrics?.combinedConfidence ?? 0.5,
    hasImage: Boolean(imageUrl),
    hasSourceUrl: Boolean(sourceUrl),
    fieldCompleteness: fieldCompletenessScore(parsed),
  });

  if (existing) {
    const update = await applyContentUpdate({
      lessonId: existing.id,
      existing,
      parsed,
      sourceUrl,
      sourceId: source.id,
      runId,
    });
    return { outcome: update.updated ? "updated" : "skipped", update };
  }

  let imageHash = null;
  let perceptualHash = null;

  const entities = await resolveEntities({ parsed, source, sourceUrl });
  const decision = await makeContentDecision({
    source,
    parsed,
    confidenceScore,
    sourceUrl,
    imageUrl,
    imageHash,
    perceptualHash,
    sheikhMatch: entities.sheikhMatch,
    mosqueMatch: entities.mosqueId ? { id: entities.mosqueId } : null,
    visionMetrics: vision.metrics,
  });

  if (AUTO_PUBLISH_KILL) {
    decision.autoPublish = false;
    if (decision.decision === "approved") decision.decision = "pending_review";
  }

  const result = await executePublishPipeline({
    source,
    parsed,
    decision,
    confidenceScore,
    sourceUrl,
    imageUrl,
    imageHash,
    runId,
  });

  // Log vision analysis
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin.from("mke_vision_analyses").insert({
        source_id: source.id,
        source_url: sourceUrl,
        methods: vision.methods || [],
        ocr_confidence: vision.metrics?.ocrConfidence,
        vision_confidence: vision.metrics?.visionConfidence,
        parsed_fields: Object.keys(parsed).filter((k) => parsed[k]),
        entities: vision.entities || {},
        duration_ms: vision.metrics?.durationMs,
      });
    } catch {
      /* optional */
    }
  }

  return result;
}

export async function runMajlisKnowledgeEngine(opts = {}) {
  const admin = getSupabaseAdmin();
  const mode = opts.mode || "full";
  const triggerType = opts.triggerType || "cron";
  const { runId, startedAt } = await startRun(admin, triggerType, mode);

  const summary = {
    engineVersion: ENGINE_VERSION,
    sourcesScanned: 0,
    itemsDiscovered: 0,
    itemsAnalyzed: 0,
    published: 0,
    pendingReview: 0,
    duplicates: 0,
    rejected: 0,
    updated: 0,
    expired: 0,
    errors: 0,
    stagesCompleted: [],
    metadata: {},
  };

  await logAutomationStep({ runId, step: "discover", status: "ok", detail: "mke_start" });

  try {
    // Stage: Queue drain (async, non-blocking)
    if (mode === "queue" || mode === "full") {
      const queue = await processQueue({ runId });
      summary.metadata.queue = queue;
      summary.stagesCompleted.push("queue");
    }

    // Stage: Source intelligence (unified registry)
    if (mode === "sources" || mode === "full") {
      const sources = await listRegisteredSources({ activeOnly: true });
      const maxSources = opts.maxSources ?? PERFORMANCE.cronMaxSources;

      for (const source of sources.slice(0, maxSources)) {
        summary.sourcesScanned += 1;
        const discovery = await discoverFromSource(source);

        if (!discovery.ok) {
          summary.errors += 1;
          continue;
        }

        if (discovery.manualAssistMode && !(discovery.items?.length)) {
          continue; // skip empty manual-assist without items
        }

        const items = (discovery.items || []).slice(0, PERFORMANCE.cronMaxItemsPerSource);
        summary.itemsDiscovered += items.length;

        for (const item of items) {
          try {
            summary.itemsAnalyzed += 1;
            const result = await processDiscoveredItem({ source, item, runId });

            if (result.outcome === "published") summary.published += 1;
            else if (result.outcome === "pending_review") summary.pendingReview += 1;
            else if (result.outcome === "duplicate") summary.duplicates += 1;
            else if (result.outcome === "rejected") summary.rejected += 1;
            else if (result.outcome === "updated") summary.updated += 1;
          } catch (err) {
            summary.errors += 1;
            await logAutomationStep({
              runId,
              sourceId: source.id,
              step: "fetch_failed",
              status: "error",
              detail: String(err.message || err),
            });
          }
        }
      }
      summary.stagesCompleted.push("discover", "vision", "extract", "decide", "publish");
    }

    // Delegate to existing engines (non-blocking)
    if (mode === "full" || mode === "knowledge") {
      const delegated = await Promise.allSettled([
        runLessonIntelligenceEngine({ runType: triggerType }),
        runFullKnowledgeSync({ triggerType, includeAutoContent: false }),
      ]);
      summary.metadata.lessonIntelligence = delegated[0].status === "fulfilled" ? delegated[0].value : { error: delegated[0].reason?.message };
      summary.metadata.knowledgeSync = delegated[1].status === "fulfilled" ? delegated[1].value : { error: delegated[1].reason?.message };
      summary.stagesCompleted.push("knowledge_sync");
    }

    if (mode === "full" || mode === "reasoning") {
      try {
        summary.metadata.reasoning = await runReasoningCycle({ triggerType });
        summary.stagesCompleted.push("graph");
      } catch (err) {
        summary.metadata.reasoning = { error: err.message };
      }
    }

    if (mode === "full" || mode === "autonomous") {
      try {
        summary.metadata.autonomous = await runAutonomousOrchestrator({
          mode: "ingest",
          triggerType,
          skipAutoContent: true,
        });
        summary.stagesCompleted.push("autonomous");
      } catch (err) {
        summary.metadata.autonomous = { error: err.message };
      }
    }

    // Stage: Expiry
    if (mode === "full" || mode === "expire") {
      const expiry = await archiveExpiredLessons({ runId });
      summary.expired = expiry.archived || 0;
      summary.stagesCompleted.push("expire");
    }

    await logAutomationStep({ runId, step: "audit", status: "ok", detail: "mke_complete" });
    await finishRun(admin, runId, summary, startedAt);

    const metrics = await getEngineMetrics();
    const completion = computeAutomationCompletion(metrics);

    return {
      ok: summary.errors === 0 || summary.published > 0 || summary.pendingReview > 0,
      runId,
      ...summary,
      stagesTotal: PIPELINE_STAGES.length,
      automationCompletionPct: completion.pct,
      metrics,
    };
  } catch (err) {
    summary.errors += 1;
    await finishRun(admin, runId, summary, startedAt);
    return { ok: false, runId, error: err.message, ...summary };
  }
}

export async function runMkeHealthCheck() {
  const metrics = await getEngineMetrics();
  const completion = computeAutomationCompletion(metrics);
  return {
    ok: metrics.database?.status === "connected",
    engineVersion: ENGINE_VERSION,
    automationCompletionPct: completion.pct,
    ...metrics,
  };
}

export { getEngineMetrics, computeAutomationCompletion } from "./metrics.mjs";
export { listRegisteredSources, listSupportedPlatforms, upsertSourcePlugin } from "./source-registry.mjs";
export { analyzeImage, analyzeContentItem, getVisionStatus } from "./vision-intelligence.mjs";
export { makeContentDecision } from "./decision-engine.mjs";
export { runQualityChecks } from "./quality-control.mjs";
