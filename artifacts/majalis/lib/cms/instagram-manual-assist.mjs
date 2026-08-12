/**
 * Phase 7 — Manual Assist Mode for Instagram sources (no Graph API required).
 */
import { getTrustedSource } from "./trusted-sources.mjs";
import { processAutomationItem } from "./lesson-source-monitor.mjs";
import { logAutomationStep } from "./automation-step-logs.mjs";
import { extractLessonFromText, extractLessonFromImage, isVisionEnabled } from "./lesson-extractor.mjs";
import { decodeBase64Image, uploadLessonPoster, validateImageUpload } from "./image-storage.mjs";
import { hashImageBuffer } from "./lesson-duplicate-detector.mjs";
import { findIntelligenceDuplicate } from "./lesson-intelligence/dedup-engine.mjs";
import { importFromUrl } from "./url-importer.mjs";
import { classifyInstagramPost } from "./instagram-content-classifier.mjs";
import { upsertUnifiedContentItem } from "./instagram-multitype-sync.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

export async function processInstagramManualAssist({
  sourceId,
  mode,
  imageBase64,
  mimeType = "image/jpeg",
  postUrl,
  imageUrl,
  caption,
  contentType = null,
  runId = null,
  userId = null,
}) {
  const source = await getTrustedSource(sourceId);
  if (!source) return { ok: false, error: "source_not_found" };
  if (source.source_type !== "instagram" && source.platform !== "instagram") {
    return { ok: false, error: "not_instagram_source" };
  }

  await logAutomationStep({
    runId,
    sourceId,
    step: "manual_assist_used",
    status: "ok",
    detail: mode,
    metadata: { userId },
  });

  let item = {
    title: source.name,
    link: postUrl || source.url,
    description: caption || "",
    imageUrl: imageUrl || null,
    mediaUrls: imageUrl ? [imageUrl] : [],
    fromManualAssist: true,
  };

  if (mode === "upload" && imageBase64) {
    const buffer = decodeBase64Image(imageBase64);
    const check = validateImageUpload({ buffer, mimeType });
    if (!check.ok) return { ok: false, error: check.error };

    let uploadedUrl = null;
    try {
      const up = await uploadLessonPoster({ buffer, mimeType, prefix: "instagram-manual" });
      uploadedUrl = up.url;
    } catch {
      uploadedUrl = null;
    }

    item.imageUrl = uploadedUrl || `data:${mimeType};base64,${imageBase64.slice(0, 32)}…`;
    item.mediaUrls = uploadedUrl ? [uploadedUrl] : [];

    if (isVisionEnabled()) {
      const vision = await extractLessonFromImage({
        imageBase64: buffer.toString("base64"),
        mimeType,
      });
      if (vision.parsed_fields?.title) item.title = vision.parsed_fields.title;
      if (vision.extracted_text) item.description = vision.extracted_text;
      item.parsedPreview = vision.parsed_fields;
      item.confidencePreview = vision.confidence_score;
    }

    await logAutomationStep({ runId, sourceId, step: "media_downloaded", status: "ok", detail: "manual_upload" });
  }

  if (mode === "url" && postUrl) {
    item.link = postUrl;
    try {
      const imported = await importFromUrl(postUrl);
      if (imported.imageUrl && !item.imageUrl) {
        item.imageUrl = imported.imageUrl;
        item.mediaUrls = [imported.imageUrl];
      }
      if (imported.description) item.description = imported.description;
      if (imported.title) item.title = imported.title;
    } catch {
      /* optional */
    }
    if (imageUrl) {
      item.imageUrl = imageUrl;
      item.mediaUrls = [imageUrl, ...(item.mediaUrls || [])];
    }
    await logAutomationStep({ runId, sourceId, step: "media_downloaded", status: "ok", detail: postUrl });
  }

  if (mode === "caption" && caption) {
    item.description = caption;
    const textResult = await extractLessonFromText({ text: caption, sourceUrl: item.link });
    item.parsedPreview = textResult.parsed_fields || textResult.extracted;
    item.confidencePreview = textResult.confidence_score;
    await logAutomationStep({ runId, sourceId, step: "ai_extracted", status: "ok", detail: "caption_only" });
  }

  if (!item.imageUrl && !item.description) {
    return { ok: false, error: "missing_media_or_caption" };
  }

  const allowedTypes = source.content_types_allowed || ["lesson"];
  const resolvedType = contentType && allowedTypes.includes(contentType)
    ? contentType
    : classifyInstagramPost({ caption: item.description || item.title || "" });

  if (resolvedType !== "lesson" && allowedTypes.includes(resolvedType)) {
    const supabase = getSupabaseAdmin();
    if (!supabase) return { ok: false, error: "supabase_admin_missing" };
    const result = await upsertUnifiedContentItem(supabase, { source, item, contentType: resolvedType });
    await logAutomationStep({
      runId,
      sourceId,
      step: result.action === "imported" ? "draft_created" : result.action === "skipped" ? "duplicate_detected" : "fetch_failed",
      status: result.action === "failed" ? "error" : "ok",
      detail: `manual_assist_${resolvedType}`,
      metadata: { userId, contentId: result.id || null },
    });
    return { ok: result.action !== "failed", mode, outcome: { decision: result.action, contentType: resolvedType, contentId: result.id || null } };
  }

  const outcome = await processAutomationItem({
    source,
    item,
    connectorHint: null,
    runId,
  });

  await logAutomationStep({
    runId,
    sourceId,
    step: outcome.autoPublished ? "auto_published" : outcome.decision === "duplicate" ? "duplicate_detected" : "draft_created",
    status: "ok",
    detail: outcome.decision,
    metadata: { draftId: outcome.draftId, lessonId: outcome.lessonId },
  });

  return { ok: true, mode, outcome };
}

export async function checkDuplicatePoster(imageBase64, mimeType = "image/jpeg") {
  const buffer = decodeBase64Image(imageBase64);
  const imageHash = hashImageBuffer(buffer);
  const duplicate = await findIntelligenceDuplicate({
    parsed: { title: "test" },
    sourceUrl: "manual://duplicate-check",
    imageHash,
  });
  return { imageHash, duplicate };
}
