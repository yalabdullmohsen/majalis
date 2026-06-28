/**
 * AKE v2 — Entity linking (sheikh, mosque, course, lesson).
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";

export async function linkEntitiesForItem(admin, { knowledgeItemId, lessonId, extractedFields = {}, analysis = {} }) {
  if (!admin) return { links: [] };

  const fields = extractedFields || {};
  const links = [];

  const sheikhName = fields.speaker_name || fields.scholar || analysis.ai_scholar;
  if (sheikhName?.trim()) {
    const sheikhId = await resolveSheikhId(admin, sheikhName.trim());
    if (sheikhId) {
      links.push(await insertLink(admin, {
        knowledgeItemId,
        lessonId,
        entityType: "sheikh",
        entityId: sheikhId,
        entityName: sheikhName.trim(),
        confidence: 0.85,
      }));
    }
  }

  const mosqueName = fields.mosque || fields.mosque_name;
  if (mosqueName?.trim()) {
    const mosqueId = await resolveMosqueId(admin, mosqueName.trim());
    links.push(await insertLink(admin, {
      knowledgeItemId,
      lessonId,
      entityType: "mosque",
      entityId: mosqueId,
      entityName: mosqueName.trim(),
      confidence: mosqueId ? 0.8 : 0.5,
      metadata: { unresolved: !mosqueId },
    }));
  }

  if (fields.is_course || fields.activity_type === "دورة") {
    links.push(await insertLink(admin, {
      knowledgeItemId,
      lessonId,
      entityType: "course",
      entityName: fields.course_name || fields.title,
      confidence: 0.7,
      metadata: { organizer: fields.organizer },
    }));
  }

  return { links: links.filter(Boolean) };
}

async function resolveSheikhId(admin, name) {
  const { data } = await admin.from("sheikhs").select("id").ilike("name", `%${name}%`).limit(1).maybeSingle();
  return data?.id || null;
}

async function resolveMosqueId(admin, name) {
  const { data } = await admin.from("mosques").select("id").ilike("name", `%${name}%`).limit(1).maybeSingle();
  return data?.id || null;
}

async function insertLink(admin, { knowledgeItemId, lessonId, entityType, entityId, entityName, confidence, metadata }) {
  try {
    const { data } = await admin
      .from("ake_entity_links")
      .insert({
        knowledge_item_id: knowledgeItemId || null,
        lesson_id: lessonId || null,
        entity_type: entityType,
        entity_id: entityId || null,
        entity_name: entityName,
        confidence,
        metadata: metadata || {},
      })
      .select("id")
      .maybeSingle();
    return data?.id;
  } catch {
    return null;
  }
}
