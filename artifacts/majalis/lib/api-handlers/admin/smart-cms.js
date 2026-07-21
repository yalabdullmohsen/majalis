import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { extractLessonFromImage, extractLessonFromText, extractContentFromText } from "../../../lib/cms/lesson-extractor.mjs";
import { importFromUrl } from "../../../lib/cms/url-importer.mjs";
import { matchSheikhByName } from "../../../lib/cms/sheikh-matcher.mjs";
import {
  createContentDraft,
  listPendingDrafts,
  updateDraftStatus,
  getDraftById,
} from "../../../lib/cms/draft-service.mjs";
import { publishLessonDraft } from "../../../lib/cms/publish-lesson.mjs";
import { getRevisionHistory } from "../../../lib/cms/audit-revision.mjs";
import { validateLessonDraft } from "../../../lib/cms/content-validator.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth) return;

  const body = req.body || {};
  const action = String(body.action || req.query?.action || "").trim();

  try {
    if (action === "list-drafts") {
      const status = String(body.status || "pending");
      const drafts = await listPendingDrafts({ status, limit: body.limit || 50 });
      sendJson(res, 200, { ok: true, drafts });
      return;
    }

    if (action === "extract-from-image") {
      const { imageBase64, mimeType } = body;
      if (!imageBase64) {
        sendJson(res, 400, { ok: false, error: "missing_image" });
        return;
      }
      const result = await extractLessonFromImage({ imageBase64, mimeType });
      const sheikhMatch = await matchSheikhByName(result.extracted?.speaker_name);
      const draft = await createContentDraft({
        sourceType: "image",
        extracted: result.extracted,
        aiSuggestions: result.aiSuggestions,
        validation: result.validation,
        matchedSheikhId: sheikhMatch.matched?.id,
        proposedSheikh: sheikhMatch.proposedDraft,
        createdBy: auth.user?.id,
        metadata: { confidence: result.extracted?.confidence, vision_enabled: result.visionEnabled !== false },
      });
      sendJson(res, draft.ok ? 200 : 422, {
        ok: draft.ok,
        vision_enabled: result.visionEnabled !== false,
        message: result.message,
        ...result,
        sheikhMatch,
        draft: draft.draft,
        error: draft.error,
      });
      return;
    }

    if (action === "extract-from-text") {
      const rawText = String(body.rawText || body.text || "").trim();
      if (!rawText) {
        sendJson(res, 400, { ok: false, error: "missing_text", message: "يُرجى إدخال نص قبل التحليل." });
        return;
      }
      const hint = String(body.hint || "").trim();
      console.log(`[smart-cms] extract-from-text hint="${hint}" len=${rawText.length}`);
      const result = await extractContentFromText({ text: rawText, hint });
      if (result.extraction_failed) {
        sendJson(res, 422, {
          ok: false,
          error: result.errorCode || "extraction_failed",
          message: result.errorArabic || "تعذّر تحليل المحتوى — يُرجى المحاولة مرة أخرى.",
        });
        return;
      }
      const sheikhMatch = await matchSheikhByName(result.extracted?.speaker_name);
      const draft = await createContentDraft({
        contentKind: hint || "lesson",
        sourceType: "text",
        rawText,
        extracted: result.extracted,
        aiSuggestions: result.aiSuggestions,
        validation: result.validation,
        matchedSheikhId: sheikhMatch.matched?.id,
        proposedSheikh: sheikhMatch.proposedDraft,
        createdBy: auth.user?.id,
        metadata: { hint, confidence: result.confidence_score },
      });
      sendJson(res, draft.ok ? 200 : 422, {
        ok: draft.ok,
        message: result.message,
        ...result,
        sheikhMatch,
        draft: draft.draft,
        error: draft.error,
      });
      return;
    }

    if (action === "extract-from-url") {
      const url = String(body.url || "").trim();
      if (!url) {
        sendJson(res, 400, { ok: false, error: "missing_url" });
        return;
      }
      const imported = await importFromUrl(url);
      const result = await extractLessonFromText({
        text: imported.rawText || `${imported.title}\n${imported.description}`,
        sourceUrl: imported.url,
      });
      const sheikhMatch = await matchSheikhByName(result.extracted.speaker_name);
      const draft = await createContentDraft({
        sourceType: "url",
        sourceUrl: imported.url,
        imageUrl: imported.imageUrl,
        rawText: imported.rawText,
        extracted: { ...result.extracted, platform: imported.platform },
        aiSuggestions: result.aiSuggestions,
        validation: result.validation,
        matchedSheikhId: sheikhMatch.matched?.id,
        proposedSheikh: sheikhMatch.proposedDraft,
        createdBy: auth.user?.id,
        metadata: { platform: imported.platform },
      });
      sendJson(res, draft.ok ? 200 : 422, { ok: draft.ok, imported, ...result, sheikhMatch, draft: draft.draft, error: draft.error });
      return;
    }

    if (action === "validate-draft") {
      const extracted = body.extracted || (await getDraftById(body.draftId))?.extracted_data;
      const validation = validateLessonDraft(extracted);
      sendJson(res, 200, { ok: true, validation });
      return;
    }

    if (action === "approve-draft") {
      const draft = await getDraftById(body.draftId);
      if (!draft) {
        sendJson(res, 404, { ok: false, error: "draft_not_found" });
        return;
      }

      const admin = getSupabaseAdmin();
      let sheikhId = draft.matched_sheikh_id;

      if (!sheikhId && draft.proposed_sheikh?.name) {
        const { data: newSheikh } = await admin
          .from("sheikhs")
          .insert({
            name: draft.proposed_sheikh.name,
            bio: "",
            is_verified: false,
            status: "pending",
            needs_verification: true,
          })
          .select()
          .single();
        sheikhId = newSheikh?.id;
      }

      const publish = await publishLessonDraft({
        extracted: body.extracted || draft.extracted_data,
        sheikhId,
        imageUrl: draft.image_url,
        userId: auth.user?.id,
        draftId: draft.id,
      });

      if (!publish.ok) {
        sendJson(res, 422, { ok: false, ...publish });
        return;
      }

      await updateDraftStatus(draft.id, "published", auth.user?.id);
      await admin
        .from("content_drafts")
        .update({ target_table: "lessons", target_record_id: publish.record.id })
        .eq("id", draft.id);

      sendJson(res, 200, { ok: true, lesson: publish.record, validation: publish.validation });
      return;
    }

    if (action === "reject-draft") {
      await updateDraftStatus(body.draftId, "rejected", auth.user?.id);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (action === "revision-history") {
      const history = await getRevisionHistory(body.tableName || "lessons", body.recordId, body.limit || 50);
      sendJson(res, 200, { ok: true, history });
      return;
    }

    const supportedActions = [
      "list-drafts",
      "extract-from-text",
      "extract-from-image",
      "extract-from-url",
      "validate-draft",
      "approve-draft",
      "reject-draft",
      "revision-history",
    ];
    console.warn(`[smart-cms] unknown_action received action="${action}"`);
    sendJson(res, 400, {
      ok: false,
      error: "unknown_action",
      message: `الإجراء "${action || "(فارغ)"}" غير معروف. الإجراءات المدعومة: ${supportedActions.join(", ")}`,
      supported_actions: supportedActions,
    });
  } catch (err) {
    console.error("[admin/smart-cms]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
