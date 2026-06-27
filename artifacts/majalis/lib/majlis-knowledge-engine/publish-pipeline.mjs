/**
 * Auto Publish Pipeline — publish + SEO + graph + cache + notifications.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { publishLessonDraft } from "../cms/publish-lesson.mjs";
import { createLessonImportDraft } from "../cms/lesson-import-draft.mjs";
import { markSeoRefresh } from "../cms/seo-refresh.mjs";
import { resolveEntities } from "../cms/lesson-intelligence/entity-resolver.mjs";
import { writeAutomationAudit } from "../cms/automation-audit.mjs";
import { writeLessonHistory } from "../cms/lesson-history.mjs";
import { logAutomationStep } from "../cms/automation-step-logs.mjs";
import { linkPublishedLesson } from "./graph-linker.mjs";
import { logDecision } from "./decision-engine.mjs";
import { enqueueJob } from "./queue.mjs";

export async function executePublishPipeline({
  source,
  parsed,
  decision,
  confidenceScore,
  sourceUrl,
  imageUrl,
  imageHash,
  runId,
  userId,
}) {
  const admin = getSupabaseAdmin();
  const t0 = Date.now();

  await logAutomationStep({
    runId,
    sourceId: source?.id,
    step: "decide",
    status: "ok",
    detail: decision.decision,
    metadata: { reasons: decision.reasons },
  });

  if (decision.decision === "duplicate") {
    await writeAutomationAudit({
      sourceId: source?.id,
      sourceUrl,
      parsed,
      confidenceScore,
      decision: "duplicate",
      reason: decision.reasons?.[0],
      imageHash,
    });
    return { ok: true, outcome: "duplicate", decision: decision.decision };
  }

  if (decision.decision === "rejected") {
    await writeAutomationAudit({
      sourceId: source?.id,
      sourceUrl,
      parsed,
      confidenceScore,
      decision: "rejected",
      reason: decision.reasons?.join("; "),
      imageHash,
    });
    return { ok: true, outcome: "rejected", decision: decision.decision };
  }

  const entities = await resolveEntities({ parsed, source, sourceUrl });

  if (decision.autoPublish && decision.decision === "approved") {
    const pub = await publishLessonDraft({
      extracted: parsed,
      sheikhId: entities.sheikhId,
      mosqueId: entities.mosqueId,
      imageUrl,
      sourceUrl,
      sourceId: source?.id,
      confidenceScore,
      importedBy: "mke_auto",
      posterImageHash: imageHash,
      userId,
    });

    if (!pub.ok) {
      const draft = await createLessonImportDraft({
        sourceType: "url",
        sourceUrl,
        imageUrl,
        parsedPayload: parsed,
        confidenceScore,
        sourceId: source?.id,
        automationStatus: "pending_review",
        decisionReason: pub.error || "publish_failed",
        imageHash,
        createdBy: userId,
      });
      return { ok: true, outcome: "pending_review", draftId: draft.draft?.id, error: pub.error };
    }

    await markSeoRefresh({ lessonId: pub.lesson?.id, sourceId: source?.id, runId, action: "publish" });
    await linkPublishedLesson(admin, { lesson: pub.lesson, parsed, source });
    await writeLessonHistory({
      lessonId: pub.lesson.id,
      sourceId: source?.id,
      sourceUrl,
      action: "create",
      parsed,
      imageUrl,
    });
    await writeAutomationAudit({
      sourceId: source?.id,
      sourceUrl,
      parsed,
      confidenceScore,
      decision: "approved",
      lessonId: pub.lesson.id,
      imageHash,
    });
    await logDecision(admin, {
      sourceId: source?.id,
      sourceUrl,
      lessonId: pub.lesson.id,
      decision: "approved",
      confidenceScore,
      reasons: decision.reasons,
      checks: decision.checks,
    });

    await enqueueJob({
      jobType: "notify_subscribers",
      payload: { lessonId: pub.lesson.id, title: pub.lesson.title },
      priority: 3,
    });

    return {
      ok: true,
      outcome: "published",
      lessonId: pub.lesson.id,
      lesson: pub.lesson,
      durationMs: Date.now() - t0,
    };
  }

  // Pending review — create draft
  const draft = await createLessonImportDraft({
    sourceType: imageUrl ? "image" : "url",
    sourceUrl,
    imageUrl,
    parsedPayload: parsed,
    confidenceScore,
    sourceId: source?.id,
    automationStatus: "pending_review",
    decisionReason: decision.reasons?.join("; ") || "needs_review",
    imageHash,
    createdBy: userId,
  });

  await logDecision(admin, {
    sourceId: source?.id,
    sourceUrl,
    draftId: draft.draft?.id,
    decision: "pending_review",
    confidenceScore,
    reasons: decision.reasons,
    checks: decision.checks,
  });

  return {
    ok: true,
    outcome: "pending_review",
    draftId: draft.draft?.id,
    durationMs: Date.now() - t0,
  };
}
