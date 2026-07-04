/**
 * POST /api/admin/lesson-from-image
 * Upload lesson poster → Vision AI extraction → draft for admin review.
 */
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { extractLessonFromImage, buildMissingFields } from "../../../lib/cms/lesson-extractor.mjs";
import { decodeBase64Image, uploadLessonPoster, validateImageUpload } from "../../../lib/cms/image-storage.mjs";
import { matchSheikhByName } from "../../../lib/cms/sheikh-matcher.mjs";
import { hashImageBuffer } from "../../../lib/cms/lesson-duplicate-detector.mjs";
import { findDuplicateLesson } from "../../../lib/cms/lesson-duplicate-detector.mjs";
import {
  buildImportApiResponse,
  handleLessonImportApprove,
  handleLessonImportGet,
  handleLessonImportList,
  handleLessonImportReject,
  handleLessonImportSave,
} from "../../../lib/cms/lesson-import-actions.mjs";
import {
  createLessonImportDraft,
  getLessonImportDraft,
  updateLessonImportDraft,
} from "../../../lib/cms/lesson-import-draft.mjs";
import { writeRevisionLogs } from "../../../lib/cms/audit-revision.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth) return;

  const body = req.body || {};
  const action = String(body.action || "extract").trim();

  try {
    if (action === "list") {
      await handleLessonImportList(body, sendJson, res);
      return;
    }

    if (action === "get") {
      await handleLessonImportGet(body, sendJson, res);
      return;
    }

    if (action === "save-draft" || action === "update-draft") {
      await handleLessonImportSave(body, auth, sendJson, res);
      return;
    }

    if (action === "approve") {
      await handleLessonImportApprove(body, auth, sendJson, res);
      return;
    }

    if (action === "reject") {
      await handleLessonImportReject(body, auth, sendJson, res);
      return;
    }

    if (action === "re-extract") {
      const draft = await getLessonImportDraft(body.draftId);
      if (!draft?.image_url && !body.imageBase64) {
        sendJson(res, 400, { ok: false, error: "missing_image" });
        return;
      }

      let imageBase64 = body.imageBase64;
      const mimeType = body.mimeType || "image/jpeg";

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

      const result = await extractLessonFromImage({ imageBase64, mimeType: check.mime });
      const sheikhMatch = await matchSheikhByName(result.extracted?.speaker_name);
      const parsed = result.parsed_fields || result.extracted;
      const imageHash = hashImageBuffer(buffer);

      const updated = await updateLessonImportDraft(draft.id, {
        extracted_text: result.extracted_text,
        parsed_payload: parsed,
        confidence_score: result.confidence_score,
        warnings: result.validation?.warnings || [],
        missing_fields: result.missing_fields || [],
        matched_sheikh_id: sheikhMatch.matched?.id || null,
        suggested_sheikh: sheikhMatch.proposedDraft,
        image_hash: imageHash,
        status: "needs_review",
      });

      sendJson(res, 200, buildImportApiResponse({ result, sheikhMatch, draft: updated.draft, imageUrl: draft.image_url }));
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

    const imageHash = hashImageBuffer(buffer);

    const upload = await uploadLessonPoster({
      buffer,
      mimeType: check.mime,
      userId: auth.user?.id,
    });

    const imageUrl = upload.ok ? upload.url : null;

    const result = await extractLessonFromImage({ imageBase64, mimeType: check.mime });
    const sheikhMatch = await matchSheikhByName(result.extracted?.speaker_name);
    const parsed = result.parsed_fields || result.extracted;

    const duplicate = await findDuplicateLesson({
      parsed,
      sourceUrl: sourceUrl || null,
      imageHash,
    });

    const draft = await createLessonImportDraft({
      sourceType: "image",
      sourceUrl: sourceUrl || null,
      imageUrl,
      extractedText: result.extracted_text,
      parsedPayload: parsed,
      confidenceScore: result.confidence_score,
      warnings: [
        ...(result.validation?.warnings || []),
        ...(duplicate.isDuplicate ? [{ field: "duplicate", message: duplicate.message }] : []),
      ],
      missingFields: result.missing_fields || buildMissingFields(parsed),
      matchedSheikhId: sheikhMatch.matched?.id || null,
      suggestedSheikh: sheikhMatch.proposedDraft,
      notes: notes || null,
      createdBy: auth.user?.id,
      status: duplicate.isDuplicate ? "needs_review" : "needs_review",
      imageHash,
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

    const payload = buildImportApiResponse({
      result,
      sheikhMatch,
      draft: draft.draft,
      imageUrl,
      visionEnabled: result.visionEnabled,
      extras: {
        duplicate: duplicate.isDuplicate
          ? {
              isDuplicate: true,
              reason: duplicate.reason,
              message: duplicate.message,
              lesson: duplicate.lesson || null,
              draft: duplicate.draft || null,
            }
          : { isDuplicate: false },
      },
    });

    sendJson(res, draft.ok ? 200 : 422, {
      ...payload,
      ok: draft.ok,
      error: draft.error,
      storage_uploaded: upload.ok,
      storage_error: upload.ok ? undefined : upload.error,
    });
  } catch (err) {
    // تُسجَّل التفاصيل الكاملة خادمياً فقط — لا تُكشف للعميل
    console.error("[admin/lesson-from-image] unhandled error:", {
      name: err?.name,
      status: err?.status,
      code: err?.code,
      message: err?.message?.slice(0, 200),
    });
    sendJson(res, 500, {
      ok: false,
      error: "تعذر معالجة الطلب. يُرجى المحاولة مرة أخرى أو إدخال البيانات يدويًا.",
    });
  }
}
