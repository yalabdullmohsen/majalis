/**
 * Publish approved lesson draft to Supabase + CMS index.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { validateLessonDraft, buildExternalKey } from "./content-validator.mjs";
import { writeRevisionLogs } from "./audit-revision.mjs";

function mapDraftToLesson(extracted, opts = {}) {
  const d = extracted || {};
  return {
    title: d.title,
    speaker_name: d.speaker_name || d.sheikh_name || null,
    sheikh_id: opts.sheikhId || null,
    mosque: d.mosque || d.location || null,
    city: d.city || d.governorate || "العاصمة",
    region: d.region || null,
    category: d.category || "أخرى",
    day_of_week: d.day_of_week || d.day || null,
    lesson_time: d.lesson_time || d.time || null,
    schedule: d.schedule || d.day_of_week || null,
    description: d.description || d.raw_ocr_text?.slice(0, 2000) || null,
    delivery: d.live_url ? "بث مباشر" : "حضور فقط",
    audience: d.women_section ? "الكل" : "رجال",
    status: "approved",
    activity_type: d.is_course ? "دورة" : d.activity_type || "درس",
    is_course: Boolean(d.is_course),
    live_url: d.live_url || null,
    maps_url: d.maps_url || null,
    website_url: d.registration_url || d.website_url || null,
    poster_image_url: d.poster_image_url || opts.imageUrl || null,
    external_key: d.external_key || buildExternalKey(d),
    end_date: d.end_date || null,
    slug: d.slug || null,
  };
}

export async function publishLessonDraft({ extracted, sheikhId, imageUrl, userId, draftId }) {
  const validation = validateLessonDraft(extracted);
  if (!validation.canPublish) {
    return { ok: false, validation };
  }

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing" };

  const payload = mapDraftToLesson(extracted, { sheikhId, imageUrl });

  const { data: existing } = await admin
    .from("lessons")
    .select("id")
    .eq("external_key", payload.external_key)
    .maybeSingle();

  let record;
  if (existing?.id) {
    const { data, error } = await admin.from("lessons").update(payload).eq("id", existing.id).select().single();
    if (error) return { ok: false, error: error.message };
    record = data;
    await writeRevisionLogs({
      tableName: "lessons",
      recordId: record.id,
      changedBy: userId,
      draftId,
      changes: Object.entries(payload).map(([field, newValue]) => ({
        field,
        oldValue: null,
        newValue: String(newValue ?? ""),
      })),
      action: "update",
    });
  } else {
    const { data, error } = await admin.from("lessons").insert(payload).select().single();
    if (error) return { ok: false, error: error.message };
    record = data;
    await writeRevisionLogs({
      tableName: "lessons",
      recordId: record.id,
      changedBy: userId,
      draftId,
      changes: Object.entries(payload).map(([field, newValue]) => ({
        field,
        newValue: String(newValue ?? ""),
      })),
      action: "create",
    });
  }

  await admin.from("cms_content_index").upsert(
    {
      content_kind: payload.is_course ? "course" : "lesson",
      record_table: "lessons",
      record_id: record.id,
      external_key: payload.external_key,
      slug: payload.slug,
      title: payload.title,
      summary: payload.description,
      speaker_name: payload.speaker_name,
      category: payload.category,
      workflow_status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "record_table,record_id" },
  );

  return { ok: true, record, validation };
}
