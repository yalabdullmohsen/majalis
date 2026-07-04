/**
 * Publish approved lesson draft to Supabase + CMS index.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { validateLessonDraft, buildExternalKey } from "./content-validator.mjs";
import { annotateLessonQuality } from "./lesson-completeness.mjs";
import { writeRevisionLogs } from "./audit-revision.mjs";

function mapDraftToLesson(extracted, opts = {}) {
  const d = extracted || {};
  const sourceUrl = opts.sourceUrl;
  const hasLive = Boolean(d.has_live_stream || d.live_url);
  const hasWomen = Boolean(
    d.has_women_section || (d.women_section && String(d.women_section).trim()),
  );
  const startDate = d.start_date || d.gregorian_date || null;
  const keywords = Array.isArray(d.keywords) ? d.keywords.filter(Boolean) : [];

  const row = {
    title: d.title,
    speaker_name: d.speaker_name || d.sheikh_name || null,
    sheikh_id: opts.sheikhId || null,
    mosque_id: opts.mosqueId || null,
    mosque: d.mosque || d.location || null,
    city: d.city || d.governorate || "العاصمة",
    region: d.region || null,
    country: d.country || "الكويت",
    category: d.category || "أخرى",
    day_of_week: d.day_of_week || d.day || null,
    lesson_time: d.lesson_time || d.time || null,
    schedule: d.schedule || d.day_of_week || null,
    description: d.description || d.raw_ocr_text?.slice(0, 2000) || null,
    delivery: hasLive ? (d.mosque ? "كلاهما" : "بث مباشر") : "حضور فقط",
    audience: hasWomen ? "الكل" : "رجال",
    has_women_place: hasWomen,
    status: "approved",
    activity_type: d.is_course ? "دورة" : d.activity_type || "درس",
    is_course: Boolean(d.is_course),
    live_url: d.live_url || null,
    maps_url: d.maps_url || null,
    website_url: d.registration_url || d.website_url || sourceUrl || null,
    poster_image_url: d.poster_image_url || opts.imageUrl || null,
    organizer: d.organizer || null,
    cooperative_org: d.cooperative_org || null,
    contact_phone: d.phone || d.contact_phone || null,
    start_date: startDate || null,
    end_date: d.end_date || null,
    keywords: keywords.length ? keywords : null,
    external_key: d.external_key || buildExternalKey(d),
    slug: d.slug || null,
    published_at: new Date().toISOString(),
    source_url: sourceUrl || d.source_url || d.registration_url || null,
    source_id: opts.sourceId || null,
    confidence_score: opts.confidenceScore ?? null,
    imported_by: opts.importedBy || null,
    poster_image_hash: opts.posterImageHash || null,
  };
  // Compute and attach data-quality metrics before persist.
  annotateLessonQuality(row);
  return row;
}

export async function publishLessonDraft({
  extracted,
  sheikhId,
  mosqueId,
  imageUrl,
  sourceUrl,
  sourceId,
  confidenceScore,
  importedBy,
  posterImageHash,
  userId,
  draftId,
}) {
  const validation = validateLessonDraft(extracted);
  if (!validation.canPublish) {
    return { ok: false, validation };
  }

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing" };

  const payload = mapDraftToLesson(extracted, {
    sheikhId,
    mosqueId,
    imageUrl,
    sourceUrl,
    sourceId,
    confidenceScore,
    importedBy,
    posterImageHash,
  });

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
