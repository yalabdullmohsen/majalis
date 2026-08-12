/**
 * Phase 6 — Lesson Intelligence Engine (main orchestrator).
 * Extends Phase 5 monitor; does not replace it.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { listLessonSources, getSourcesDueForScan, touchLessonSourceScan } from "./sources.mjs";
import { discoverViaAdapter, lessonSourceToConnectorSource } from "./adapters/index.mjs";
import { runExtractionPipeline } from "./extractors/index.mjs";
import { findIntelligenceDuplicate } from "./dedup-engine.mjs";
import { resolveEntities } from "./entity-resolver.mjs";
import {
  computeSourceTrustScore,
  computeExtractionConfidence,
  shouldAutoPublishIntelligence,
} from "./trust-scorer.mjs";
import { sha256ImageHash, computeDHash } from "./image-hash.mjs";
import { fieldCompletenessScore } from "./dedup-engine.mjs";
import { processAutomationItem } from "../lesson-source-monitor.mjs";
import { evaluateAutoPublish } from "../auto-publish-engine.mjs";
import { logAutomationStep } from "../automation-step-logs.mjs";
import { markSeoRefresh } from "../seo-refresh.mjs";
import { publishLessonDraft } from "../publish-lesson.mjs";
import { createLessonImportDraft } from "../lesson-import-draft.mjs";
import { writeAutomationAudit } from "../automation-audit.mjs";
import { writeLessonHistory } from "../lesson-history.mjs";

const AUTO_PUBLISH_KILL_SWITCH = process.env.MAJALIS_AUTO_PUBLISH === "0";

async function fetchImageBuffers(imageUrl) {
  if (!imageUrl) return { buffer: null, hash: null, perceptual: null };
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { buffer: null, hash: null, perceptual: null };
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      buffer: buf,
      hash: sha256ImageHash(buf),
      perceptual: computeDHash(buf),
    };
  } catch {
    return { buffer: null, hash: null, perceptual: null };
  }
}

async function startIntelligenceRun(sourceId, runType = "scan") {
  const admin = getSupabaseAdmin();
  if (!admin) return { runId: null };
  try {
    const { data } = await admin
      .from("lesson_intelligence_runs")
      .insert({ source_id: sourceId, run_type: runType, status: "running" })
      .select("id")
      .single();
    return { runId: data?.id || null, startedAt: Date.now() };
  } catch {
    return { runId: null, startedAt: Date.now() };
  }
}

async function finishIntelligenceRun(runId, stats, startedAt) {
  const admin = getSupabaseAdmin();
  if (!admin || !runId) return;
  try {
    await admin
      .from("lesson_intelligence_runs")
      .update({
        status: stats.errors > 0 && stats.published === 0 ? "partial" : "completed",
        items_discovered: stats.discovered,
        items_extracted: stats.extracted,
        items_published: stats.published,
        items_duplicate: stats.duplicates,
        items_pending: stats.pending,
        items_errors: stats.errors,
        avg_confidence: stats.avgConfidence,
        duration_ms: Date.now() - startedAt,
        finished_at: new Date().toISOString(),
        metadata: stats.metadata || {},
      })
      .eq("id", runId);
  } catch {
    /* table optional */
  }
}

async function logExtraction(record) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  try {
    await admin.from("lesson_intelligence_extractions").insert(record);
  } catch {
    /* optional */
  }
}

export async function processIntelligenceItem({ source, item, runId }) {
  const sourceUrl = item.link || source.source_url;
  const t0 = Date.now();
  const sourceTrust = computeSourceTrustScore(source);

  await logAutomationStep({ runId, sourceId: source.id, step: "intelligence_discover", status: "ok", detail: sourceUrl });

  const images = item.mediaUrls || (item.imageUrl ? [item.imageUrl] : []);
  let imageBuffer = null;
  let imageHash = null;
  let perceptualHash = null;
  let imageUrl = item.imageUrl || null;

  for (const url of images.slice(0, 3)) {
    const fetched = await fetchImageBuffers(url);
    if (fetched.buffer) {
      imageBuffer = fetched.buffer;
      imageHash = fetched.hash;
      perceptualHash = fetched.perceptual;
      imageUrl = url;
      break;
    }
  }

  const extraction = await runExtractionPipeline({
    source,
    sourceUrl,
    rawText: item.description || "",
    imageBuffer,
    mimeType: "image/jpeg",
  });

  let parsed = { ...extraction.parsed, source_url: sourceUrl };
  if (!parsed.title && item.title) parsed.title = item.title;
  if (source.city && !parsed.city) parsed.city = source.city;
  if (source.country && !parsed.country) parsed.country = source.country;

  const completeness = fieldCompletenessScore(parsed);
  const confidence = computeExtractionConfidence({
    sourceTrust,
    extractionConfidence: extraction.confidence,
    hasImage: Boolean(imageUrl),
    hasSourceUrl: Boolean(sourceUrl),
    fieldCompleteness: completeness,
  });

  await logAutomationStep({
    runId,
    sourceId: source.id,
    step: "intelligence_extract",
    status: "ok",
    durationMs: Date.now() - t0,
    metadata: { extractors: extraction.steps?.map((s) => s.extractor) },
  });

  const duplicate = await findIntelligenceDuplicate({
    parsed,
    sourceUrl,
    imageHash,
    perceptualHash,
    sourceId: source.id,
  });

  const entities = await resolveEntities({ parsed, source, sourceUrl });
  const connectorSource = lessonSourceToConnectorSource(source);

  const evaluation = evaluateAutoPublish({
    source: connectorSource,
    parsed,
    confidenceScore: confidence,
    duplicate: duplicate.isDuplicate ? duplicate : { isDuplicate: false },
    sheikhMatch: entities.sheikhMatch,
    sourceUrl,
    imageUrl,
  });

  const intelligenceAuto = shouldAutoPublishIntelligence({
    confidence,
    sourceTrust,
    autoPublishEnabled: source.auto_publish && !AUTO_PUBLISH_KILL_SWITCH,
  });

  let decision = evaluation.decision;
  let lessonId = null;
  let draftId = null;

  const UPDATE_REASONS = new Set(["duplicate_source_url", "duplicate_image_hash", "similar_lesson", "duplicate_external_key", "intelligence_fuzzy_match", "perceptual_hash_match"]);
  const shouldUpdate = duplicate.isDuplicate && duplicate.lesson && UPDATE_REASONS.has(duplicate.reason);

  if (duplicate.isDuplicate && !shouldUpdate && duplicate.reason === "duplicate_draft_url") {
    decision = "duplicate";
  } else if ((intelligenceAuto && evaluation.autoPublish) || (shouldUpdate && evaluation.autoPublish)) {
    const publish = await publishLessonDraft({
      extracted: parsed,
      sheikhId: entities.sheikhId,
      mosqueId: entities.mosqueId,
      imageUrl,
      sourceUrl,
      sourceId: source.legacy_source_id || source.id,
      confidenceScore: confidence,
      importedBy: "intelligence_engine",
      posterImageHash: imageHash,
      userId: null,
      draftId: null,
    });
    if (publish.ok) {
      lessonId = publish.record.id;
      decision = shouldUpdate ? "updated" : "approved";
      await writeLessonHistory({
        lessonId,
        sourceId: source.id,
        sourceUrl,
        action: shouldUpdate ? "update" : "create",
        reason: "intelligence_auto_publish",
        parsedPayload: parsed,
        imageUrl,
      });
      await markSeoRefresh({ lessonId, sourceId: source.id, runId, action: decision });
      const admin = getSupabaseAdmin();
      if (admin && lessonId) {
        await admin.from("lessons").update({
          intelligence_confidence: confidence,
          intelligence_trust_score: sourceTrust,
          lesson_source_id: source.id,
        }).eq("id", lessonId);
      }
    } else {
      decision = "pending_review";
    }
  } else if (duplicate.isDuplicate && !shouldUpdate) {
    decision = "duplicate";
  } else {
    decision = "pending_review";
    const draft = await createLessonImportDraft({
      sourceType: source.source_type,
      sourceUrl,
      imageUrl,
      extractedText: extraction.extractedText,
      parsedPayload: parsed,
      confidenceScore: confidence,
      warnings: evaluation.reasons?.map((r) => ({ field: "intelligence", message: r })) || [],
      missingFields: evaluation.missing || [],
      matchedSheikhId: entities.sheikhMatch?.matched?.id,
      createdBy: null,
      status: "needs_review",
      sourceId: source.legacy_source_id || source.id,
      automationStatus: "pending_review",
      decisionReason: evaluation.reasons?.join(" — ") || "intelligence_pending",
      imageHash,
    });
    draftId = draft.draft?.id;
  }

  await writeAutomationAudit({
    sourceId: source.legacy_source_id || source.id,
    sourceUrl,
    extractedText: extraction.extractedText,
    parsedPayload: parsed,
    confidenceScore: confidence,
    decision: lessonId ? "approved" : decision === "duplicate" ? "duplicate" : "pending_review",
    reason: `intelligence:${decision}`,
    lessonId,
    draftId,
    imageHash,
    similarityScore: duplicate.similarity_score,
  });

  await logExtraction({
    run_id: runId,
    source_id: source.id,
    source_url: sourceUrl,
    extractor: extraction.steps?.map((s) => s.extractor).join("+") || "pipeline",
    parsed_payload: parsed,
    confidence_score: confidence,
    trust_score: sourceTrust,
    image_hash: imageHash,
    perceptual_hash: perceptualHash,
    duplicate_score: duplicate.similarity_score,
    is_duplicate: duplicate.isDuplicate && !shouldUpdate,
    decision: lessonId ? "published" : decision === "duplicate" ? "duplicate" : "pending_review",
    lesson_id: lessonId,
    draft_id: draftId,
    duration_ms: Date.now() - t0,
  });

  return {
    decision,
    lessonId,
    draftId,
    confidence,
    sourceTrust,
    duplicate: duplicate.isDuplicate,
    autoPublished: Boolean(lessonId),
    sourceUrl,
  };
}

export async function runLessonIntelligenceEngine({ sourceId = null, dryRun = false, runType = "cron" } = {}) {
  const startedAt = Date.now();
  let sources = sourceId
    ? (await listLessonSources()).filter((s) => s.id === sourceId)
    : await getSourcesDueForScan();

  if (!sources.length) sources = await listLessonSources({ activeOnly: true });

  const totals = {
    sources: sources.length,
    discovered: 0,
    extracted: 0,
    published: 0,
    duplicates: 0,
    pending: 0,
    errors: 0,
    avgConfidence: 0,
    confidences: [],
    metadata: {},
    results: [],
  };

  for (const source of sources) {
    const { runId } = await startIntelligenceRun(source.id, runType);
    let sourceStats = { discovered: 0, published: 0, errors: 0 };

    try {
      const discovery = await discoverViaAdapter(source);
      const items = discovery.items || [];

      if (discovery.connectorHint || items.some((i) => i.connectorPending)) {
        await logAutomationStep({
          runId,
          sourceId: source.id,
          step: "intelligence_adapter",
          status: "warn",
          detail: discovery.connectorHint || "connector_pending",
        });
      }

      for (const item of items.slice(0, 10)) {
        totals.discovered += 1;
        sourceStats.discovered += 1;

        if (item.connectorPending || discovery.connectorHint) {
          if (!dryRun) {
            const legacySource = lessonSourceToConnectorSource(source);
            await processAutomationItem({
              source: legacySource,
              item,
              connectorHint: discovery.connectorHint,
              runId,
            });
          }
          totals.pending += 1;
          continue;
        }

        if (dryRun) {
          totals.results.push({ source: source.source_name, item: item.link, dryRun: true });
          continue;
        }

        const outcome = await processIntelligenceItem({ source, item, runId });
        totals.extracted += 1;
        if (outcome.confidence) {
          totals.confidences.push(outcome.confidence);
        }
        if (outcome.autoPublished) {
          totals.published += 1;
          sourceStats.published += 1;
        } else if (outcome.duplicate) totals.duplicates += 1;
        else totals.pending += 1;
        totals.results.push({ source: source.source_name, ...outcome });
      }

      await touchLessonSourceScan(source.id, {
        success: true,
        imported: sourceStats.published,
        lessons: sourceStats.discovered,
      });
      await finishIntelligenceRun(runId, {
        discovered: sourceStats.discovered,
        extracted: sourceStats.discovered,
        published: sourceStats.published,
        duplicates: 0,
        pending: 0,
        errors: sourceStats.errors,
        avgConfidence: totals.confidences.length
          ? totals.confidences.reduce((a, b) => a + b, 0) / totals.confidences.length
          : null,
      }, startedAt);
    } catch (err) {
      totals.errors += 1;
      sourceStats.errors += 1;
      await touchLessonSourceScan(source.id, { success: false, error: err.message });
      totals.results.push({ source: source.source_name, error: String(err.message || err) });
      await finishIntelligenceRun(runId, {
        discovered: 0, extracted: 0, published: 0, duplicates: 0, pending: 0, errors: 1,
      }, startedAt);
    }
  }

  totals.avgConfidence = totals.confidences.length
    ? totals.confidences.reduce((a, b) => a + b, 0) / totals.confidences.length
    : 0;

  return { ok: true, ...totals, durationMs: Date.now() - startedAt };
}

export async function getIntelligenceCenterStats() {
  const admin = getSupabaseAdmin();
  const sources = await listLessonSources();
  const active = sources.filter((s) => s.active);

  let todayDiscovered = 0;
  let todayPublished = 0;
  let todayDuplicates = 0;
  let todayErrors = 0;
  let pendingImages = 0;
  let recentRuns = [];
  let recentExtractions = [];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  if (admin) {
    try {
      const { count: disc } = await admin
        .from("lesson_intelligence_extractions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString());
      todayDiscovered = disc || 0;

      const { count: pub } = await admin
        .from("lesson_intelligence_extractions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString())
        .eq("decision", "published");
      todayPublished = pub || 0;

      const { count: dup } = await admin
        .from("lesson_intelligence_extractions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString())
        .eq("is_duplicate", true);
      todayDuplicates = dup || 0;

      const { data: runs } = await admin
        .from("lesson_intelligence_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10);
      recentRuns = runs || [];
      todayErrors = (runs || []).filter((r) => r.started_at >= todayStart.toISOString()).reduce((n, r) => n + (r.items_errors || 0), 0);

      const { data: ext } = await admin
        .from("lesson_intelligence_extractions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(15);
      recentExtractions = ext || [];
      pendingImages = (ext || []).filter((e) => e.decision === "pending_review" && !e.image_hash).length;
    } catch {
      /* tables may not exist */
    }
  }

  const sourceSuccessRates = active.map((s) => ({
    id: s.id,
    name: s.source_name,
    trust: s.trust_score,
    successRate: s.total_lessons > 0 ? Math.round((s.total_imported / s.total_lessons) * 100) : null,
    lastScan: s.last_scan,
    lastError: s.last_error,
  }));

  return {
    sourcesCount: sources.length,
    activeSources: active.length,
    todayDiscovered,
    todayPublished,
    todayDuplicates,
    todayErrors,
    pendingImages,
    recentRuns,
    recentExtractions,
    sourceSuccessRates,
    avgDurationMs: recentRuns.length
      ? Math.round(recentRuns.reduce((n, r) => n + (r.duration_ms || 0), 0) / recentRuns.length)
      : null,
  };
}
