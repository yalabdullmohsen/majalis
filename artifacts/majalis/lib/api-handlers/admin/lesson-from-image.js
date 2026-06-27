/**
 * POST /api/admin/lesson-from-image
 * Upload lesson poster → Vision AI extraction → draft for admin review.
 */
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { extractLessonFromImage, isVisionEnabled, buildMissingFields } from "../../../lib/cms/lesson-extractor.mjs";
import { decodeBase64Image, uploadLessonPoster, validateImageUpload } from "../../../lib/cms/image-storage.mjs";
import { matchSheikhByName } from "../../../lib/cms/sheikh-matcher.mjs";
import {
  createLessonImportDraft,
  getLessonImportDraft,
  updateLessonImportDraft,
  setLessonImportDraftStatus,
  listLessonImportDrafts,
} from "../../../lib/cms/lesson-import-draft.mjs";
import { publishLessonDraft } from "../../../lib/cms/publish-lesson.mjs";
import { validateLessonDraft } from "../../../lib/cms/content-validator.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import { writeRevisionLogs } from "../../../lib/cms/audit-revision.mjs";

const MANUAL_MESSAGE = "الاستخراج التلقائي غير مفعّل. يمكنك إدخال البيانات يدويًا.";

function buildApiResponse({ result, sheikhMatch, draft, imageUrl, visionEnabled }) {
  const parsed = result.parsed_fields || result.extracted || {};
  const validation = result.validation || validateLessonDraft(parsed);
  const missing = result.missing_fields || buildMissingFields(parsed);

  return {
    ok: true,
    vision_enabled: visionEnabled ?? isVisionEnabled(),
    message: result.message || (visionEnabled === false ? MANUAL_MESSAGE : undefined),
    extracted_text: result.extracted_text || parsed.raw_ocr_text || "",
    parsed_fields: parsed,
    confidence_score: result.confidence_score != null ? result.confidence_score : Number(parsed.confidence) || 0,
    warnings: validation.warnings || [],
    missing_fields: missing,
    suggested_sheikh_match: sheikhMatch
      ? {
          matched: sheikhMatch.matched,
          score: sheikhMatch.score,
          proposed: sheikhMatch.proposedDraft,
        }
      : null,
    draft_lesson_payload: parsed,
    draft_id: draft?.id,
    draft,
    image_url: imageUrl || draft?.image_url,
    ai_suggestions: result.aiSuggestions || [],
  };
}

async function resolveSheikhId(draft, parsedFields, userId) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  if (draft.matched_sheikh_id) return draft.matched_sheikh_id;

  const name = parsedFields.speaker_name || parsedFields.sheikh_name;
  const match = await matchSheikhByName(name);
  if (match.matched?.id) return match.matched.id;

  if (match.proposedDraft?.name) {
    const { data: newSheikh } = await admin
      .from("sheikhs")
      .insert({
        name: match.proposedDraft.name,
        bio: "",
        is_verified: false,
        status: "pending",
        needs_verification: true,
      })
      .select()
      .single();
    if (newSheikh?.id) {
      await writeRevisionLogs({
        tableName: "sheikhs",
        recordId: newSheikh.id,
        changedBy: userId,
        draftId: draft.id,
        changes: [{ field: "name", newValue: newSheikh.name }],
        action: "create_draft_sheikh",
      });
      return newSheikh.id;
    }
  }
  return null;
}

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth) return;

  const body = req.body || {};
  const action = String(body.action || "extract").trim();

  try {
    if (action === "list") {
      const drafts = await listLessonImportDrafts({ status: body.status, limit: body.limit || 50 });
      sendJson(res, 200, { ok: true, drafts });
      return;
    }

    if (action === "get") {
      const draft = await getLessonImportDraft(body.draftId);
      if (!draft) {
        sendJson(res, 404, { ok: false, error: "draft_not_found" });
        return;
      }
      sendJson(res, 200, {
        ok: true,
        draft,
        parsed_fields: draft.parsed_payload,
        extracted_text: draft.extracted_text,
        image_url: draft.image_url,
        missing_fields: draft.missing_fields || [],
        warnings: draft.warnings || [],
      });
      return;
    }

    if (action === "save-draft" || action === "update-draft") {
      const draftId = body.draftId;
      const parsed = body.parsed_fields || body.parsed_payload || {};
      const validation = validateLessonDraft(parsed);

      if (draftId) {
        const updated = await updateLessonImportDraft(draftId, {
          parsed_payload: parsed,
          extracted_text: body.extracted_text || parsed.raw_ocr_text || null,
          confidence_score: body.confidence_score ?? parsed.confidence ?? null,
          warnings: validation.warnings,
          missing_fields: buildMissingFields(parsed),
          notes: body.notes ?? undefined,
          status: body.status || "draft",
        });
        sendJson(res, updated.ok ? 200 : 422, { ok: updated.ok, draft: updated.draft, validation, error: updated.error });
        return;
      }

      const created = await createLessonImportDraft({
        sourceType: body.source_type || "manual",
        sourceUrl: body.source_url,
        imageUrl: body.image_url,
        extractedText: body.extracted_text || parsed.raw_ocr_text,
        parsedPayload: parsed,
        confidenceScore: body.confidence_score ?? parsed.confidence,
        warnings: validation.warnings,
        missingFields: buildMissingFields(parsed),
        notes: body.notes,
        createdBy: auth.user?.id,
        status: "draft",
      });
      sendJson(res, created.ok ? 200 : 422, { ok: created.ok, draft: created.draft, validation, error: created.error });
      return;
    }

    if (action === "approve") {
      const draft = await getLessonImportDraft(body.draftId);
      if (!draft) {
        sendJson(res, 404, { ok: false, error: "draft_not_found" });
        return;
      }

      const parsed = body.parsed_fields || draft.parsed_payload || {};
      const sheikhId = await resolveSheikhId(draft, parsed, auth.user?.id);

      const publish = await publishLessonDraft({
        extracted: parsed,
        sheikhId,
        imageUrl: draft.image_url,
        userId: auth.user?.id,
        draftId: draft.id,
      });

      if (!publish.ok) {
        sendJson(res, 422, { ok: false, ...publish });
        return;
      }

      await setLessonImportDraftStatus(draft.id, "approved", {
        reviewedBy: auth.user?.id,
        approvedLessonId: publish.record.id,
      });

      await updateLessonImportDraft(draft.id, { parsed_payload: parsed });

      sendJson(res, 200, {
        ok: true,
        lesson: publish.record,
        validation: publish.validation,
        draft_id: draft.id,
      });
      return;
    }

    if (action === "reject") {
      const draft = await getLessonImportDraft(body.draftId);
      if (!draft) {
        sendJson(res, 404, { ok: false, error: "draft_not_found" });
        return;
      }
      await setLessonImportDraftStatus(draft.id, "rejected", { reviewedBy: auth.user?.id });
      sendJson(res, 200, { ok: true });
      return;
    }

    if (action === "re-extract") {
      const draft = await getLessonImportDraft(body.draftId);
      if (!draft?.image_url && !body.imageBase64) {
        sendJson(res, 400, { ok: false, error: "missing_image" });
        return;
      }

      let imageBase64 = body.imageBase64;
      let mimeType = body.mimeType || "image/jpeg";

      if (!imageBase64 && draft.image_url) {
        sendJson(res, 422, {
          ok: false,
          error: "reextract_requires_base64",
          message: "أعد رفع الصورة لإعادة الاستخراج.",
        });
        return;
      }

      const buffer = decodeBase64Image(imageBase64);
      const check = validateImageUpload({ buffer, mimeType });
      if (!check.ok) {
        sendJson(res, 400, { ok: false, ...check });
        return;
      }

      const result = await extractLessonFromImage({ imageBase64, mimeType });
      const sheikhMatch = await matchSheikhByName(result.extracted?.speaker_name);
      const parsed = result.parsed_fields || result.extracted;

      const updated = await updateLessonImportDraft(draft.id, {
        extracted_text: result.extracted_text,
        parsed_payload: parsed,
        confidence_score: result.confidence_score,
        warnings: result.validation?.warnings || [],
        missing_fields: result.missing_fields || [],
        matched_sheikh_id: sheikhMatch.matched?.id || null,
        suggested_sheikh: sheikhMatch.proposedDraft,
        status: "needs_review",
      });

      sendJson(res, 200, buildApiResponse({ result, sheikhMatch, draft: updated.draft, imageUrl: draft.image_url }));
      return;
    }

    // Default: extract from image (create draft)
    const { imageBase64, mimeType = "image/jpeg", source_url: sourceUrl, notes } = body;
    if (!imageBase64) {
      sendJson(res, 400, { ok: false, error: "missing_image" });
      return;
    }

    const buffer = decodeBase64Image(imageBase64);
    const check = validateImageUpload({ buffer, mimeType });
    if (!check.ok) {
      sendJson(res, 400, { ok: false, ...check });
      return;
    }

    const upload = await uploadLessonPoster({
      buffer,
      mimeType: check.mime,
      userId: auth.user?.id,
    });

    const imageUrl = upload.ok ? upload.url : null;

    const result = await extractLessonFromImage({ imageBase64, mimeType: check.mime });
    const sheikhMatch = await matchSheikhByName(result.extracted?.speaker_name);
    const parsed = result.parsed_fields || result.extracted;

    const draft = await createLessonImportDraft({
      sourceType: "image",
      sourceUrl: sourceUrl || null,
      imageUrl,
      extractedText: result.extracted_text,
      parsedPayload: parsed,
      confidenceScore: result.confidence_score,
      warnings: result.validation?.warnings || [],
      missingFields: result.missing_fields || [],
      matchedSheikhId: sheikhMatch.matched?.id || null,
      suggestedSheikh: sheikhMatch.proposedDraft,
      notes: notes || null,
      createdBy: auth.user?.id,
      status: "needs_review",
    });

    if (draft.ok && draft.draft?.id) {
      await writeRevisionLogs({
        tableName: "lesson_import_drafts",
        recordId: draft.draft.id,
        changedBy: auth.user?.id,
        draftId: draft.draft.id,
        changes: [{ field: "source_type", newValue: "image" }],
        action: "extract_from_image",
      });
    }

    const payload = buildApiResponse({
      result,
      sheikhMatch,
      draft: draft.draft,
      imageUrl,
      visionEnabled: result.visionEnabled,
    });

    sendJson(res, draft.ok ? 200 : 422, {
      ...payload,
      ok: draft.ok,
      error: draft.error,
      storage_uploaded: upload.ok,
      storage_error: upload.ok ? undefined : upload.error,
    });
  } catch (err) {
    console.error("[admin/lesson-from-image]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
