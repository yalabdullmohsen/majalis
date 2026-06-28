/**
 * Publisher — writes verified knowledge items to platform tables (review-first).
 */

import { normalizeContentKind } from "../auto-knowledge-engine/content-kind.mjs";
import { isMissingTableError } from "../supabase-admin.mjs";
import { assertPublishable } from "../production/content-sanitizer.mjs";
import { buildFusionKey } from "../production/source-fusion.mjs";

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80) || `item-${Date.now()}`;
}

const TABLE_MAP = {
  lesson: "lessons",
  lecture: "lessons",
  course: "lessons",
  book: "library_items",
  article: "library_items",
  fawaid: "fawaid",
  miracle: "scientific_miracles",
  qa: "qa_questions",
  news: "platform_updates",
  announcement: "platform_updates",
  fiqh_decision: "fiqh_council_items",
  fatwa: "fatwas",
  sharia_ruling: "sharia_rulings",
  annual_course: "annual_courses",
  sheikh: "sheikhs",
};

function log(scope, data) {
  console.info(`[knowledge-publisher:${scope}]`, JSON.stringify({ at: new Date().toISOString(), ...data }));
}

function dayFromIsoDate(iso) {
  const value = String(iso || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  try {
    return new Intl.DateTimeFormat("ar-KW", { weekday: "long", timeZone: "Asia/Kuwait" }).format(
      new Date(`${value}T12:00:00+03:00`),
    );
  } catch {
    return null;
  }
}

function collectLessonSourceFields(item, analysis) {
  const payload = item.raw_payload || {};
  const extracted = item.extracted_fields || payload.extracted_fields || {};
  const date =
    extracted.gregorian_date ||
    extracted.start_date ||
    payload.date ||
    payload.start_date ||
    item.source_published_at?.slice?.(0, 10) ||
    item.published_at?.slice?.(0, 10) ||
    null;

  return {
    title: analysis?.ai_title || extracted.title || item.raw_title || payload.title,
    description: analysis?.ai_summary || extracted.description || item.raw_body || payload.summary || payload.body,
    speaker_name:
      extracted.speaker_name ||
      extracted.sheikh_name ||
      analysis?.ai_scholar ||
      payload.speaker ||
      payload.sheikh_name ||
      null,
    mosque: extracted.mosque || extracted.mosque_name || payload.mosque || payload.location || null,
    city: extracted.city || payload.city || "العاصمة",
    region: extracted.region || payload.region || null,
    country: extracted.country || payload.country || "الكويت",
    category: analysis?.ai_category || extracted.category || payload.category || "أخرى",
    day_of_week: extracted.day_of_week || extracted.day || payload.day_of_week || payload.day || dayFromIsoDate(date),
    lesson_time: extracted.lesson_time || extracted.time || payload.lesson_time || payload.time || "8:00 م",
    start_date: date,
    end_date: extracted.end_date || payload.end_date || null,
    poster_image_url: extracted.poster_image_url || payload.image_url || payload.poster_image_url || null,
    live_url: extracted.live_url || payload.live_url || null,
    maps_url: extracted.maps_url || payload.maps_url || null,
    keywords: extracted.keywords || analysis?.ai_keywords || payload.tags || null,
    is_course: Boolean(extracted.is_course || payload.is_course || item.content_kind === "course"),
    is_recurring: payload.is_recurring !== false && !payload.end_date && !extracted.end_date,
  };
}

function buildRecord(item, analysis) {
  const kind = normalizeContentKind(item.content_kind);
  const verified = item.verification_status === "verified";
  const base = {
    status: verified ? "approved" : "pending",
    source_url: item.raw_url || item.source_url,
  };

  switch (kind) {
    case "fawaid":
      return {
        table: "fawaid",
        lookupField: "external_key",
        record: {
          ...base,
          external_key: item.external_id,
          text: analysis.ai_summary || item.raw_body || item.raw_title,
          author_name: analysis.ai_scholar || item.source_attribution,
          category: analysis.ai_category,
          status: verified ? "approved" : "pending",
        },
      };
    case "book":
    case "article":
      return {
        table: "library_items",
        lookupField: "external_key",
        record: {
          ...base,
          external_key: item.external_id,
          title: analysis.ai_title || item.raw_title,
          description: analysis.ai_summary || item.raw_body,
          type: kind === "book" ? "كتاب" : "مقال",
          category: analysis.ai_category || "عام",
          external_url: item.raw_url,
          status: verified ? "approved" : "pending",
        },
      };
    case "miracle":
      return {
        table: "scientific_miracles",
        lookupField: "external_key",
        record: {
          ...base,
          external_key: item.external_id,
          title: analysis.ai_title || item.raw_title,
          body: analysis.ai_summary || item.raw_body,
          category: analysis.ai_category || "عام",
          source_type: "قرآن",
          status: verified ? "approved" : "pending",
        },
      };
    case "news":
    case "announcement":
      return {
        table: "platform_updates",
        lookupField: "external_key",
        record: {
          ...base,
          external_key: item.external_id,
          title: analysis.ai_title || item.raw_title,
          summary: analysis.ai_summary,
          body: item.raw_body,
          update_type: kind,
          status: verified ? "approved" : "pending",
        },
      };
    case "qa":
      return {
        table: "qa_questions",
        lookupField: "external_key",
        record: {
          ...base,
          external_key: item.external_id,
          question: analysis.ai_title || item.raw_title,
          answer: analysis.ai_summary || item.raw_body,
          status: verified ? "published" : "draft",
        },
      };
    case "fiqh_decision": {
      const payload = item.raw_payload || {};
      const title = analysis.ai_title || item.raw_title;
      const summary = (analysis.ai_summary || item.raw_body || "").slice(0, 500);
      const sourceUrl = item.raw_url || item.source_url;
      return {
        table: "library_items",
        lookupField: "external_url",
        lookupValue: sourceUrl,
        record: {
          title,
          description: summary,
          type: "مقال",
          category: payload.category || analysis.ai_category || "فقه",
          external_url: sourceUrl,
          status: verified ? "approved" : "pending",
        },
      };
    }
    case "fatwa":
      return {
        table: "fatwas",
        lookupField: "external_key",
        record: {
          ...base,
          external_key: item.external_id,
          question: analysis.ai_title || item.raw_title,
          answer: analysis.ai_summary || item.raw_body,
          summary: (analysis.ai_summary || "").slice(0, 300),
          category: analysis.ai_category || "فقه عام",
          mufti_name: analysis.ai_scholar || item.source_attribution,
          status: verified ? "approved" : "pending",
        },
      };
    case "lesson":
    case "lecture":
    case "course": {
      const lessonFields = collectLessonSourceFields(item, analysis);
      const activityType =
        kind === "lecture" ? "محاضرة" : kind === "course" || lessonFields.is_course ? "دورة" : "درس";
      return {
        table: "lessons",
        lookupField: "external_key",
        record: {
          ...base,
          external_key: item.external_id,
          title: lessonFields.title,
          description: lessonFields.description,
          speaker_name: lessonFields.speaker_name,
          mosque: lessonFields.mosque,
          city: lessonFields.city,
          region: lessonFields.region,
          country: lessonFields.country,
          category: lessonFields.category,
          day_of_week: lessonFields.day_of_week,
          lesson_time: lessonFields.lesson_time,
          schedule: lessonFields.day_of_week,
          start_date: lessonFields.start_date,
          end_date: lessonFields.end_date,
          poster_image_url: lessonFields.poster_image_url,
          live_url: lessonFields.live_url,
          maps_url: lessonFields.maps_url,
          activity_type: activityType,
          is_course: lessonFields.is_course,
          is_recurring: lessonFields.is_recurring,
          status: verified ? "approved" : "pending",
        },
      };
    }
    default:
      return null;
  }
}

async function resolvePublishTarget(admin, built, item) {
  if (built.table !== "fiqh_council_items") return built;

  const { error } = await admin.from("fiqh_council_items").select("id", { head: true, count: "exact" });
  if (!error) return built;

  const msg = String(error.message || "").toLowerCase();
  const missing = isMissingTableError(error) || msg.includes("fiqh_council_items");
  if (!missing) return built;

  log("fiqh-table-missing-fallback", { id: item.external_id, fallback: "library_items", probeError: error.message });
  return {
    table: "library_items",
    lookupField: "external_key",
    record: {
      external_key: item.external_id,
      title: built.record.title,
      description: built.record.summary || built.record.content,
      type: "مقال",
      category: built.record.category || "فقه",
      external_url: built.record.source_url,
      source_url: built.record.source_url,
      status: "approved",
    },
  };
}

export async function publishItem(admin, item, analysis) {
  let built = buildRecord(item, analysis);
  if (!built) {
    log("skip-kind", { kind: item.content_kind, id: item.external_id });
    return { published: false, reason: "unsupported_kind" };
  }

  if (item.verification_status !== "verified" || !item.can_publish) {
    return { published: false, reason: "needs_review", table: built.table };
  }

  try {
    built = await resolvePublishTarget(admin, built, item);
    assertPublishable(built.record);
    const lookupField = built.lookupField || "external_key";
    let lookupValue = lookupField === "external_id"
      ? String(item.external_id).replace(/^[^:]+:\s*/, "")
      : item.external_id;

    if (built.table === "lessons") {
      const fusionKey = item.fusion_key || buildFusionKey({
        speaker_name: built.record.speaker_name,
        title: built.record.title,
        mosque: built.record.mosque,
        start_date: built.record.start_date,
        lesson_time: built.record.lesson_time,
        city: built.record.city,
      });
      if (fusionKey) {
        built.record.fusion_key = fusionKey;
        const { data: fusedRow } = await admin
          .from("lessons")
          .select("id, external_key")
          .eq("fusion_key", fusionKey)
          .maybeSingle();
        if (fusedRow?.external_key) lookupValue = fusedRow.external_key;
      }
    }

    const { data: existing } = await admin
      .from(built.table)
      .select("id")
      .eq(lookupField, lookupValue)
      .maybeSingle();

    let recordId;
    if (existing?.id) {
      const { data, error } = await admin
        .from(built.table)
        .update({ ...built.record, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select("id")
        .single();
      if (error) throw error;
      recordId = data.id;
    } else {
      const { data, error } = await admin
        .from(built.table)
        .insert(built.record)
        .select("id")
        .single();
      if (error) throw error;
      recordId = data.id;
    }

    return {
      published: true,
      target_table: built.table,
      target_record_id: recordId,
    };
  } catch (err) {
    const errMsg = String(err.message || err);
    if (built.table === "fiqh_council_items" && errMsg.toLowerCase().includes("fiqh_council_items")) {
      const fallback = await resolvePublishTarget(admin, { table: "fiqh_council_items", record: buildRecord(item, analysis)?.record || {} }, item);
      if (fallback.table === "library_items") {
        try {
          const lookupValue = item.external_id;
          const { data: existing } = await admin.from("library_items").select("id").eq("external_key", lookupValue).maybeSingle();
          let recordId;
          if (existing?.id) {
            const { data, error } = await admin.from("library_items").update({ ...fallback.record, updated_at: new Date().toISOString() }).eq("id", existing.id).select("id").single();
            if (error) throw error;
            recordId = data.id;
          } else {
            const { data, error } = await admin.from("library_items").insert(fallback.record).select("id").single();
            if (error) throw error;
            recordId = data.id;
          }
          return { published: true, target_table: "library_items", target_record_id: recordId, fallback: true };
        } catch (fallbackErr) {
          log("publish-error", { error: String(fallbackErr.message || fallbackErr), kind: item.content_kind, stage: "fallback" });
          return { published: false, reason: String(fallbackErr.message || fallbackErr) };
        }
      }
    }
    log("publish-error", { error: errMsg, kind: item.content_kind });
    return { published: false, reason: errMsg };
  }
}

export async function publishBatch(admin, items) {
  const results = { published: 0, review: 0, failed: 0, details: [] };
  for (const item of items) {
    const outcome = await publishItem(admin, item, item.analysis || item);
    if (outcome.published) results.published++;
    else if (outcome.reason === "needs_review") results.review++;
    else results.failed++;
    results.details.push({ id: item.external_id, ...outcome });
  }
  return results;
}

export { TABLE_MAP };
