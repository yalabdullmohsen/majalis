/**
 * POST /api/admin/lesson-from-url
 * Import lesson from announcement URL → draft for admin review.
 */
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { importLessonFromUrl, normalizeImportUrl } from "../../../lib/cms/url-import-service.mjs";
import { getPlatformLabel } from "../../../lib/cms/url-importer.mjs";
import {
  buildImportApiResponse,
  handleLessonImportApprove,
  handleLessonImportGet,
  handleLessonImportList,
  handleLessonImportReject,
  handleLessonImportSave,
} from "../../../lib/cms/lesson-import-actions.mjs";
import { createLessonImportDraft } from "../../../lib/cms/lesson-import-draft.mjs";
import { writeRevisionLogs } from "../../../lib/cms/audit-revision.mjs";
import { getLessonImportDraft, updateLessonImportDraft } from "../../../lib/cms/lesson-import-draft.mjs";

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
      if (!draft?.source_url) {
        sendJson(res, 400, { ok: false, error: "missing_source_url" });
        return;
      }
      const result = await importLessonFromUrl(draft.source_url, { userId: auth.user?.id });
      if (!result.ok) {
        sendJson(res, 422, { ok: false, ...result });
        return;
      }
      const updated = await updateLessonImportDraft(draft.id, {
        extracted_text: result.extracted_text,
        parsed_payload: result.parsed_fields,
        confidence_score: result.confidence_score,
        warnings: result.validation?.warnings || [],
        missing_fields: result.missing_fields || [],
        matched_sheikh_id: result.sheikhMatch?.matched?.id || null,
        suggested_sheikh: result.sheikhMatch?.proposedDraft,
        image_url: result.imageUrl || draft.image_url,
        status: "needs_review",
      });
      sendJson(
        res,
        200,
        buildImportApiResponse({
          result,
          sheikhMatch: result.sheikhMatch,
          draft: updated.draft,
          imageUrl: result.imageUrl || draft.image_url,
          extras: {
            platform: result.platform,
            platform_label: getPlatformLabel(result.platform),
            duplicate: result.duplicate,
            source_url: draft.source_url,
          },
        }),
      );
      return;
    }

    // Default: extract from URL
    const rawUrl = String(body.url || body.source_url || "").trim();
    const normalized = normalizeImportUrl(rawUrl);
    if (!normalized) {
      sendJson(res, 400, { ok: false, error: "invalid_url", message: "الرابط غير صالح." });
      return;
    }

    const result = await importLessonFromUrl(normalized, { userId: auth.user?.id });
    if (!result.ok) {
      sendJson(res, 422, { ok: false, ...result });
      return;
    }

    const parsed = result.parsed_fields || result.extracted || {};
    const allWarnings = [...(result.validation?.warnings || []), ...(result.warnings || [])];

    const draft = await createLessonImportDraft({
      sourceType: "url",
      sourceUrl: normalized,
      imageUrl: result.imageUrl || null,
      extractedText: result.extracted_text,
      parsedPayload: parsed,
      confidenceScore: result.confidence_score,
      warnings: allWarnings,
      missingFields: result.missing_fields || [],
      matchedSheikhId: result.sheikhMatch?.matched?.id || null,
      suggestedSheikh: result.sheikhMatch?.proposedDraft,
      notes: body.notes || null,
      createdBy: auth.user?.id,
      status: "needs_review",
    });

    if (draft.ok && draft.draft?.id) {
      await writeRevisionLogs({
        tableName: "lesson_import_drafts",
        recordId: draft.draft.id,
        changedBy: auth.user?.id,
        draftId: draft.draft.id,
        changes: [
          { field: "source_type", newValue: "url" },
          { field: "source_url", newValue: normalized },
        ],
        action: "extract_from_url",
      });
    }

    const payload = buildImportApiResponse({
      result,
      sheikhMatch: result.sheikhMatch,
      draft: draft.draft,
      imageUrl: result.imageUrl,
      visionEnabled: result.visionEnabled,
      extras: {
        platform: result.platform,
        platform_label: getPlatformLabel(result.platform),
        duplicate: result.duplicate,
        source_url: normalized,
        partial: result.partial,
        extraction_failed: result.partial,
      },
    });

    sendJson(res, draft.ok ? 200 : 422, {
      ...payload,
      ok: draft.ok,
      error: draft.error,
    });
  } catch (err) {
    console.error("[admin/lesson-from-url]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
