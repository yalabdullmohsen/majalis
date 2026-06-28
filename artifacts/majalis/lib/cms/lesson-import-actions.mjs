/**
 * Shared admin actions for lesson import drafts (image + URL).
 */
import { buildMissingFields, isVisionEnabled } from "./lesson-extractor.mjs";
import { validateLessonDraft } from "./content-validator.mjs";
import { matchSheikhByName } from "./sheikh-matcher.mjs";
import { publishLessonDraft } from "./publish-lesson.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { writeRevisionLogs } from "./audit-revision.mjs";
import {
  createLessonImportDraft,
  getLessonImportDraft,
  updateLessonImportDraft,
  setLessonImportDraftStatus,
  listLessonImportDrafts,
} from "./lesson-import-draft.mjs";

const MANUAL_MESSAGE = "الاستخراج التلقائي غير مفعّل. يمكنك إدخال البيانات يدويًا.";

export function buildImportApiResponse({ result, sheikhMatch, draft, imageUrl, visionEnabled, extras = {} }) {
  const parsed = result?.parsed_fields || result?.extracted || {};
  const validation = result?.validation || validateLessonDraft(parsed);
  const missing = result?.missing_fields || buildMissingFields(parsed);
  const providerUsed = result?.providerUsed || extras.provider_used;
  const manualReview = result?.manualReview || providerUsed === "manual_review" || providerUsed === "ocr";

  const providerLabels = {
    anthropic: "Claude",
    openai: "OpenAI",
    ocr: "OCR",
    manual_review: "مراجعة يدوية",
  };

  return {
    ok: result?.ok !== false,
    vision_enabled: visionEnabled ?? (result?.visionEnabled !== false && !manualReview),
    provider_used: providerUsed,
    provider_label: providerLabels[providerUsed] || providerUsed || "—",
    manual_review: manualReview,
    error_code: result?.errorCode || null,
    message: result?.userMessage || result?.message || (manualReview ? MANUAL_MESSAGE : undefined),
    user_message: result?.userMessage || result?.message || undefined,
    extracted_text: result?.extracted_text || parsed.raw_ocr_text || "",
    parsed_fields: parsed,
    confidence_score: result?.confidence_score != null ? result.confidence_score : Number(parsed.confidence) || 0,
    warnings: [...(result?.warnings || []), ...(validation.warnings || [])],
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
    ai_suggestions: result?.aiSuggestions || [],
    fields: result?.fields || null,
    ...extras,
  };
}

export async function resolveSheikhIdForDraft(draft, parsedFields, userId) {
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

export async function handleLessonImportList(body, sendJson, res) {
  const drafts = await listLessonImportDrafts({ status: body.status, limit: body.limit || 50 });
  sendJson(res, 200, { ok: true, drafts });
}

export async function handleLessonImportGet(body, sendJson, res) {
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
    source_url: draft.source_url,
    missing_fields: draft.missing_fields || [],
    warnings: draft.warnings || [],
  });
}

export async function handleLessonImportSave(body, auth, sendJson, res) {
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
      source_url: body.source_url ?? undefined,
      image_url: body.image_url ?? undefined,
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
}

export async function handleLessonImportApprove(body, auth, sendJson, res) {
  const draft = await getLessonImportDraft(body.draftId);
  if (!draft) {
    sendJson(res, 404, { ok: false, error: "draft_not_found" });
    return;
  }

  const parsed = body.parsed_fields || draft.parsed_payload || {};
  const sheikhId = await resolveSheikhIdForDraft(draft, parsed, auth.user?.id);

  const publish = await publishLessonDraft({
    extracted: parsed,
    sheikhId,
    imageUrl: draft.image_url,
    sourceUrl: draft.source_url,
    sourceId: draft.source_id,
    confidenceScore: draft.confidence_score,
    importedBy: draft.source_id ? "admin_review" : null,
    posterImageHash: draft.image_hash,
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
}

export async function handleLessonImportReject(body, auth, sendJson, res) {
  const draft = await getLessonImportDraft(body.draftId);
  if (!draft) {
    sendJson(res, 404, { ok: false, error: "draft_not_found" });
    return;
  }
  await setLessonImportDraftStatus(draft.id, "rejected", { reviewedBy: auth.user?.id });
  sendJson(res, 200, { ok: true });
}

export { MANUAL_MESSAGE };
