/**
 * Publisher — writes verified knowledge items to platform tables (review-first).
 */

import { normalizeContentKind } from "../auto-knowledge-engine/content-kind.mjs";

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

function buildRecord(item, analysis) {
  const kind = item.content_kind;
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
      const fiqhType = ["resolution", "fatwa", "research", "recommendation", "ruling"].includes(payload.type)
        ? payload.type
        : "resolution";
      return {
        table: "fiqh_council_items",
        lookupField: "external_id",
        record: {
          title: analysis.ai_title || item.raw_title,
          slug: slugify(payload.slug || item.external_id || item.raw_title),
          type: fiqhType,
          category: payload.category || analysis.ai_category || "القضايا المعاصرة",
          summary: (analysis.ai_summary || item.raw_body || "").slice(0, 500),
          content: item.raw_body || analysis.ai_summary || "",
          source_name: payload.source_name || item.source_attribution,
          source_url: item.raw_url || item.source_url,
          session_date: payload.session_date || item.published_at || null,
          tags: Array.isArray(payload.tags) ? payload.tags : (analysis.ai_keywords || []).slice(0, 8),
          external_id: String(item.external_id).replace(/^[^:]+:\s*/, ""),
          status: verified ? "published" : "review",
          published_at: verified ? new Date().toISOString() : null,
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
    case "course":
      return {
        table: "lessons",
        lookupField: "external_key",
        record: {
          ...base,
          external_key: item.external_id,
          title: analysis.ai_title || item.raw_title,
          description: analysis.ai_summary || item.raw_body,
          activity_type: kind === "lecture" ? "محاضرة" : kind === "course" ? "دورة" : "درس",
          status: verified ? "approved" : "pending",
        },
      };
    default:
      return null;
  }
}

export async function publishItem(admin, item, analysis) {
  const built = buildRecord(item, analysis);
  if (!built) {
    log("skip-kind", { kind: item.content_kind, id: item.external_id });
    return { published: false, reason: "unsupported_kind" };
  }

  if (item.verification_status !== "verified" || !item.can_publish) {
    return { published: false, reason: "needs_review", table: built.table };
  }

  try {
    const lookupField = built.lookupField || "external_key";
    const lookupValue = lookupField === "external_id"
      ? String(item.external_id).replace(/^[^:]+:\s*/, "")
      : item.external_id;

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
    log("publish-error", { error: String(err.message || err), kind: item.content_kind });
    return { published: false, reason: String(err.message || err) };
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
