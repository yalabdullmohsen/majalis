/**
 * AKE v2 — Content lifecycle: update, cancel, archive detection.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { createHash } from "node:crypto";

const CANCEL_PATTERNS = [
  /إلغاء/i, /أُلغي/i, /تأجيل/i, /postponed/i, /cancelled/i, /canceled/i, /لن يُعقد/i,
];

export function detectLifecycleChange(existingRow, newItem, extraction = {}) {
  const changes = {};
  const fields = extraction.extracted_fields || newItem.extracted_fields || {};

  const newTitle = newItem.raw_title || fields.title;
  const newBody = newItem.raw_body || fields.description;
  const newHash = createHash("sha256").update(`${newTitle}|${newBody}`).digest("hex");

  if (existingRow?.content_hash && existingRow.content_hash !== newHash) {
    changes.content = { old_hash: existingRow.content_hash, new_hash: newHash };
  }

  const fieldPairs = [
    ["title", newTitle, existingRow?.raw_title || existingRow?.ai_title],
    ["speaker", fields.speaker_name || fields.scholar, existingRow?.extracted_fields?.speaker_name],
    ["mosque", fields.mosque || fields.mosque_name, existingRow?.extracted_fields?.mosque],
    ["location", fields.location, existingRow?.extracted_fields?.location],
    ["date", fields.gregorian_date || fields.date || newItem.published_at, existingRow?.source_published_at],
    ["time", fields.time, existingRow?.extracted_fields?.time],
  ];

  for (const [key, next, prev] of fieldPairs) {
    if (next && prev && String(next).trim() !== String(prev).trim()) {
      changes[key] = { from: prev, to: next };
    }
  }

  const cancelText = `${newTitle} ${newBody}`;
  if (CANCEL_PATTERNS.some((p) => p.test(cancelText))) {
    return { changeType: "cancelled", fieldChanges: changes, lifecycleStatus: "cancelled" };
  }

  if (Object.keys(changes).length > 0) {
    return { changeType: "updated", fieldChanges: changes, lifecycleStatus: "active" };
  }

  return null;
}

export async function applyLifecycleChange(admin, {
  knowledgeItemId,
  lessonId,
  change,
  sourceSlug,
  sourceUrl,
}) {
  if (!admin || !change) return { ok: false };

  await admin.from("ake_content_changes").insert({
    knowledge_item_id: knowledgeItemId || null,
    lesson_id: lessonId || null,
    change_type: change.changeType,
    field_changes: change.fieldChanges,
    source_slug: sourceSlug,
    source_url: sourceUrl,
    applied_at: new Date().toISOString(),
  });

  if (knowledgeItemId && change.lifecycleStatus) {
    await admin
      .from("knowledge_items")
      .update({
        lifecycle_status: change.lifecycleStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", knowledgeItemId);

    if (change.changeType === "cancelled") {
      await admin
        .from("knowledge_items")
        .update({ publish_status: "archived", pipeline_stage: "cancelled" })
        .eq("id", knowledgeItemId);
    }
  }

  if (lessonId && change.changeType === "cancelled") {
    try {
      await admin.from("lessons").update({ status: "cancelled" }).eq("id", lessonId);
    } catch {
      /* optional */
    }
  }

  return { ok: true, changeType: change.changeType };
}

export async function recordContentCreated(admin, { knowledgeItemId, sourceSlug, sourceUrl }) {
  if (!admin) return;
  try {
    await admin.from("ake_content_changes").insert({
      knowledge_item_id: knowledgeItemId,
      change_type: "created",
      source_slug: sourceSlug,
      source_url: sourceUrl,
      applied_at: new Date().toISOString(),
    });
  } catch {
    /* optional */
  }
}
