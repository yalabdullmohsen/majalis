/**
 * Monitor trusted content sources → extract → auto-publish or pending_review draft.
 * Phase 5: plugin connectors + AI pipeline + step logs + update-on-duplicate.
 * Phase 4: auto-publish when trusted source + all rules pass.
 * Emergency kill switch: MAJALIS_AUTO_PUBLISH=0
 */
import { hashImageBuffer } from "./lesson-duplicate-detector.mjs";
import { matchSheikhByName } from "./sheikh-matcher.mjs";
import { listTrustedSources, updateSourceCheckStatus, updateSourceDiscoverySnapshot } from "./trusted-sources.mjs";
import { evaluateAutoPublish } from "./auto-publish-engine.mjs";
import { findDuplicateLesson } from "./lesson-duplicate-detector.mjs";
import { findIntelligenceDuplicate } from "./lesson-intelligence/dedup-engine.mjs";
import { findDuplicateSourceUrl } from "./lesson-import-draft.mjs";
import { writeAutomationAudit } from "./automation-audit.mjs";
import { createLessonImportDraft } from "./lesson-import-draft.mjs";
import { publishLessonDraft } from "./publish-lesson.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { enrichParsedFromSourceConfig, INSTAGRAM_CONNECTOR_HINTS } from "./instagram-connector.mjs";
import { resolveSheikhIdForDraft } from "./lesson-import-actions.mjs";
import { createAndEnrichSheikh } from "./sheikh-enricher.mjs";
import { resolveMosqueIdForLesson } from "./mosque-matcher.mjs";
import { startAutomationRun, finishAutomationRun } from "./automation-runs.mjs";
import { notifyAdminsNewDrafts } from "./automation-notifications.mjs";
import { createSourceConnector } from "./connectors/index.mjs";
import { runAiSourcePipeline } from "./ai-source-pipeline.mjs";
import { logAutomationStep } from "./automation-step-logs.mjs";
import { writeLessonHistory, archiveLessonBySource, detectRemovedSourcePosts } from "./lesson-history.mjs";
import { markSeoRefresh } from "./seo-refresh.mjs";
import { touchSourceMonitorJob } from "./source-monitor-jobs.mjs";

/** Phase 4/5 enabled by default; set MAJALIS_AUTO_PUBLISH=0 to disable globally. */
const AUTO_PUBLISH_KILL_SWITCH = process.env.MAJALIS_AUTO_PUBLISH === "0";

const UPDATE_DUPLICATE_REASONS = new Set([
  "duplicate_source_url",
  "duplicate_image_hash",
  "similar_lesson",
  "duplicate_external_key",
  "intelligence_fuzzy_match",
  "perceptual_hash_match",
]);

async function discoverItems(source) {
  const connector = createSourceConnector(source);
  const result = await connector.discover();
  return {
    items: result.items || [],
    connectorHint: result.connectorHint || null,
    connectorLabel: connector.label,
  };
}

async function extractFromItem(item, source, runId) {
  const sourceUrl = item.link || source.url;
  const result = await runAiSourcePipeline({ item, source, sourceUrl, runId });
  let parsed = enrichParsedFromSourceConfig(result.parsed || {}, source);

  let imageHash = null;
  if (result.imageUrl) {
    try {
      const res = await fetch(result.imageUrl, { signal: AbortSignal.timeout(8000) });
      if (res.ok) imageHash = hashImageBuffer(Buffer.from(await res.arrayBuffer()));
    } catch {
      /* optional */
    }
  }

  return {
    parsed,
    extractedText: result.extractedText,
    confidenceScore: result.confidenceScore,
    imageUrl: result.imageUrl,
    imageHash,
    extractError: result.extractError,
  };
}

export async function processAutomationItem({ source, item, connectorHint, runId }) {
  const sourceUrl = item.link || source.url;

  if (item.connectorPending || connectorHint) {
    const draft = await createLessonImportDraft({
      sourceType: source.source_type,
      sourceUrl,
      imageUrl: null,
      extractedText: item.description || "",
      parsedPayload: enrichParsedFromSourceConfig(
        { title: item.title || source.name, description: item.description || "", source_url: sourceUrl },
        source,
      ),
      confidenceScore: 0,
      warnings: INSTAGRAM_CONNECTOR_HINTS.map((h) => ({ field: "connector", message: h })),
      missingFields: ["poster_image", "date", "lesson_time", "speaker_name"],
      createdBy: null,
      status: "needs_review",
      sourceId: source.id,
      automationStatus: "pending_review",
      decisionReason: connectorHint || "instagram_connector_required",
    });
    await writeAutomationAudit({
      sourceId: source.id,
      sourceUrl,
      extractedText: item.description || "",
      parsedPayload: { title: item.title },
      confidenceScore: 0,
      decision: "pending_review",
      reason: connectorHint || "instagram_connector_required",
      draftId: draft.draft?.id,
    });
    return {
      decision: "pending_review",
      autoPublished: false,
      draftId: draft.draft?.id,
      sourceUrl,
      title: item.title,
      reason: connectorHint || "instagram_connector_required",
      connectorRequired: true,
      isNew: true,
    };
  }

  const { parsed, extractedText, confidenceScore, imageUrl, imageHash, extractError } = await extractFromItem(item, source, runId);
  const sheikhMatch = await matchSheikhByName(parsed.speaker_name);
  const duplicate = process.env.MAJALIS_INTELLIGENCE === "0"
    ? await findDuplicateLesson({ parsed, sourceUrl, imageHash })
    : await findIntelligenceDuplicate({ parsed, sourceUrl, imageHash, sourceId: source.id });

  const shouldUpdate = duplicate.isDuplicate && duplicate.lesson && UPDATE_DUPLICATE_REASONS.has(duplicate.reason);
  if (duplicate.isDuplicate && !shouldUpdate) {
    if (duplicate.reason === "duplicate_draft_url") {
      await writeAutomationAudit({
        sourceId: source.id,
        sourceUrl,
        extractedText,
        parsedPayload: parsed,
        confidenceScore,
        decision: "duplicate",
        reason: duplicate.message,
        draftId: duplicate.draft?.id,
        imageHash,
      });
      return { decision: "duplicate", sourceUrl, reason: duplicate.message, isNew: false };
    }
    if (!duplicate.lesson) {
      await writeAutomationAudit({
        sourceId: source.id,
        sourceUrl,
        extractedText,
        parsedPayload: parsed,
        confidenceScore,
        decision: "duplicate",
        reason: duplicate.message || duplicate.reason,
        imageHash,
        similarityScore: duplicate.similarity_score,
      });
      return { decision: "duplicate", sourceUrl, reason: duplicate.message, isNew: false };
    }
  }

  if (shouldUpdate && duplicate.lesson?.external_key) {
    parsed.external_key = duplicate.lesson.external_key;
  }

  const evaluation = evaluateAutoPublish({
    source,
    parsed,
    confidenceScore,
    duplicate: shouldUpdate ? { isDuplicate: false } : duplicate,
    sheikhMatch,
    sourceUrl,
    imageUrl,
  });

  let lessonId = null;
  let draftId = null;
  let decision = evaluation.decision;
  let reason = evaluation.reasons?.join(" — ") || extractError || "";

  if (evaluation.decision === "duplicate" && !shouldUpdate) {
    await writeAutomationAudit({
      sourceId: source.id,
      sourceUrl,
      extractedText,
      parsedPayload: parsed,
      confidenceScore,
      decision: "duplicate",
      reason: evaluation.duplicate?.message || reason,
      imageHash,
      similarityScore: duplicate.similarity_score,
    });
    return { decision: "duplicate", sourceUrl, reason: evaluation.duplicate?.message, isNew: false };
  }

  // Phase 4: auto-publish when evaluation passes (trusted sources only)
  const mayAutoPublish = !AUTO_PUBLISH_KILL_SWITCH && evaluation.autoPublish;

  if (mayAutoPublish || shouldUpdate) {
    const draftStub = { id: null, matched_sheikh_id: sheikhMatch.matched?.id, source_url: sourceUrl };
    let sheikhId = await resolveSheikhIdForDraft(draftStub, parsed, null);
    if (!sheikhId && parsed.speaker_name) {
      sheikhId = await createAndEnrichSheikh({
        name: parsed.speaker_name,
        sourceConfig: source.config || {},
      });
    }
    const mosqueId = await resolveMosqueIdForLesson(parsed, source);

    const publish = await publishLessonDraft({
      extracted: parsed,
      sheikhId,
      mosqueId,
      imageUrl,
      sourceUrl,
      sourceId: source.id,
      confidenceScore,
      importedBy: "automation",
      posterImageHash: imageHash,
      userId: null,
      draftId: null,
    });

    if (publish.ok) {
      lessonId = publish.record.id;
      decision = shouldUpdate ? "updated" : "approved";
      reason = shouldUpdate ? "auto_update" : "auto_publish";
      await writeLessonHistory({
        lessonId,
        sourceId: source.id,
        sourceUrl,
        action: shouldUpdate ? "update" : "create",
        reason,
        parsedPayload: parsed,
        imageUrl,
      });
      await markSeoRefresh({ lessonId, sourceId: source.id, runId, action: decision });
      await logAutomationStep({ runId, sourceId: source.id, lessonId, step: "publish", status: "ok", detail: reason });
    } else {
      decision = "pending_review";
      reason = publish.validation?.errors?.map((e) => e.message).join(" — ") || publish.error || "publish_failed";
    }
  } else if (evaluation.autoPublish && AUTO_PUBLISH_KILL_SWITCH) {
    decision = "pending_review";
    reason = reason ? `${reason} — Auto-Publish معطّل (kill switch)` : "Auto-Publish معطّل (kill switch)";
  } else {
    decision = "pending_review";
  }

  if (!lessonId) {
    const draft = await createLessonImportDraft({
      sourceType: source.source_type,
      sourceUrl,
      imageUrl,
      extractedText,
      parsedPayload: parsed,
      confidenceScore,
      warnings: evaluation.reasons.map((r) => ({ field: "automation", message: r })),
      missingFields: evaluation.missing || [],
      matchedSheikhId: sheikhMatch.matched?.id || null,
      suggestedSheikh: sheikhMatch.proposedDraft,
      createdBy: null,
      status: "needs_review",
      sourceId: source.id,
      automationStatus: "pending_review",
      decisionReason: reason,
      imageHash,
    });
    draftId = draft.draft?.id;
  }

  await writeAutomationAudit({
    sourceId: source.id,
    sourceUrl,
    extractedText,
    parsedPayload: parsed,
    confidenceScore,
    decision: lessonId ? "approved" : decision,
    reason,
    lessonId,
    draftId,
    imageHash,
    similarityScore: duplicate.similarity_score,
  });

  return {
    decision: lessonId ? (shouldUpdate ? "updated" : "approved") : decision,
    autoPublished: Boolean(lessonId),
    updated: Boolean(shouldUpdate && lessonId),
    lessonId,
    draftId,
    sourceUrl,
    title: parsed.title,
    reason,
    isNew: Boolean(draftId),
  };
}

export async function runLessonSourceMonitor({ dryRun = false, sourceId = null, runType = "source_monitor" } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing", processed: 0 };

  const runStart = await startAutomationRun({ runType, sourceId, metadata: { dryRun } });
  const startedAt = runStart.startedAt || Date.now();

  let sources = await listTrustedSources({ activeOnly: true });
  if (sourceId) sources = sources.filter((s) => s.id === sourceId);

  const results = [];
  let published = 0;
  let review = 0;
  let duplicates = 0;
  let skipped = 0;
  let errors = 0;
  let connectorNeeded = 0;
  let updated = 0;
  let itemsScanned = 0;
  let newDrafts = 0;
  const newDraftSources = new Set();

  for (const source of sources) {
    const seenThisRun = [];
    const seenInRun = new Set();
    try {
      const { items, connectorHint } = await discoverItems(source);
      const discoveredUrls = items.map((item) => item.link || source.url).filter(Boolean);

      for (const item of items) {
        itemsScanned += 1;
        const itemUrl = item.link || source.url;

        if (seenInRun.has(itemUrl)) {
          skipped += 1;
          results.push({ source: source.name, item: itemUrl, skipped: true, reason: "duplicate_in_run" });
          continue;
        }
        seenInRun.add(itemUrl);

        const prior = await findDuplicateSourceUrl(itemUrl);
        if (prior?.isDuplicate && prior?.draft && !prior?.lesson) {
          duplicates += 1;
          seenThisRun.push(itemUrl);
          results.push({ source: source.name, item: itemUrl, decision: "duplicate", reason: "duplicate_draft" });
          continue;
        }

        if (dryRun) {
          results.push({ source: source.name, item: itemUrl, dryRun: true, connectorHint });
          continue;
        }

        const outcome = await processAutomationItem({ source, item, connectorHint, runId: runStart.runId });
        seenThisRun.push(itemUrl);
        results.push({ source: source.name, ...outcome, connectorHint });

        if (outcome.connectorRequired) connectorNeeded += 1;
        else if (outcome.updated) updated += 1;
        else if (outcome.autoPublished) published += 1;
        else if (outcome.decision === "duplicate") duplicates += 1;
        else if (outcome.isNew) {
          review += 1;
          newDrafts += 1;
          newDraftSources.add(source.name);
        } else review += 1;
      }

      const mergedSeen = [...new Set([...(source.last_seen_urls || []), ...seenThisRun])].slice(-50);
      await updateSourceCheckStatus(source.id, { success: true, seenUrls: mergedSeen });
      await updateSourceDiscoverySnapshot(source.id, discoveredUrls);
      await touchSourceMonitorJob(source.id, { itemsProcessed: seenThisRun.length });

      const removed = detectRemovedSourcePosts(source, discoveredUrls);
      for (const removedUrl of removed.slice(0, 5)) {
        const admin = getSupabaseAdmin();
        const { data: lesson } = await admin
          ?.from("lessons")
          .select("id")
          .eq("source_url", removedUrl)
          .maybeSingle();
        if (lesson?.id) {
          await archiveLessonBySource({
            lessonId: lesson.id,
            sourceId: source.id,
            reason: "source_post_removed",
            runId: runStart.runId,
          });
        }
      }

      if (connectorHint) {
        const adminClient = getSupabaseAdmin();
        await adminClient
          ?.from("trusted_content_sources")
          .update({ last_error: String(connectorHint).slice(0, 500) })
          .eq("id", source.id);
      }
    } catch (err) {
      errors += 1;
      await updateSourceCheckStatus(source.id, { success: false, error: err.message });
      results.push({ source: source.name, error: String(err.message || err) });
    }
  }

  if (newDrafts > 0 && !dryRun) {
    await notifyAdminsNewDrafts({
      newCount: newDrafts,
      sourceName: newDraftSources.size === 1 ? [...newDraftSources][0] : null,
      link: "/admin/review-center",
    });
  }

  await finishAutomationRun(runStart.runId, {
    startedAt,
    itemsScanned,
    itemsNew: newDrafts,
    itemsDuplicate: duplicates,
    itemsSkipped: skipped,
    itemsErrors: errors,
    durationMs: Date.now() - startedAt,
    metadata: { sourcesChecked: sources.length, connectorNeeded, updated, autoPublishKillSwitch: AUTO_PUBLISH_KILL_SWITCH },
  });

  return {
    ok: true,
    sourcesChecked: sources.length,
    itemsScanned,
    published,
    pendingReview: review,
    newDrafts,
    duplicates,
    skipped,
    errors,
    connectorNeeded,
    updated,
    autoPublishKillSwitch: AUTO_PUBLISH_KILL_SWITCH,
    runId: runStart.runId,
    results,
  };
}

/** In-memory simulation for tests (no network/DB). */
export function simulateAutoPublishScenario({ source, parsed, confidenceScore, sheikhMatch, duplicate, sourceUrl, imageUrl }) {
  return evaluateAutoPublish({ source, parsed, confidenceScore, duplicate, sheikhMatch, sourceUrl, imageUrl });
}

export { AUTO_PUBLISH_KILL_SWITCH };
