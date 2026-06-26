/**
 * Publisher — writes verified knowledge items to platform tables (review-first).
 */

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
  const base = {
    status: item.verification_status === "verified" ? "approved" : "pending",
    external_key: item.external_id,
    source_url: item.raw_url || item.source_url,
  };

  switch (kind) {
    case "fawaid":
      return {
        table: "fawaid",
        record: {
          ...base,
          text: analysis.ai_summary || item.raw_body || item.raw_title,
          author_name: analysis.ai_scholar || item.source_attribution,
          category: analysis.ai_category,
          status: item.verification_status === "verified" ? "approved" : "pending",
        },
      };
    case "book":
    case "article":
      return {
        table: "library_items",
        record: {
          ...base,
          title: analysis.ai_title || item.raw_title,
          description: analysis.ai_summary || item.raw_body,
          type: kind === "book" ? "كتاب" : "مقال",
          category: analysis.ai_category || "عام",
          external_url: item.raw_url,
          status: item.verification_status === "verified" ? "approved" : "pending",
        },
      };
    case "miracle":
      return {
        table: "scientific_miracles",
        record: {
          ...base,
          title: analysis.ai_title || item.raw_title,
          body: analysis.ai_summary || item.raw_body,
          category: analysis.ai_category || "عام",
          source_type: "قرآن",
          status: item.verification_status === "verified" ? "approved" : "pending",
        },
      };
    case "news":
    case "announcement":
      return {
        table: "platform_updates",
        record: {
          ...base,
          title: analysis.ai_title || item.raw_title,
          summary: analysis.ai_summary,
          body: item.raw_body,
          update_type: kind,
          status: item.verification_status === "verified" ? "approved" : "pending",
        },
      };
    case "qa":
      return {
        table: "qa_questions",
        record: {
          ...base,
          question: analysis.ai_title || item.raw_title,
          answer: analysis.ai_summary || item.raw_body,
          status: item.verification_status === "verified" ? "published" : "draft",
        },
      };
    case "lesson":
    case "lecture":
    case "course":
      return {
        table: "lessons",
        record: {
          ...base,
          title: analysis.ai_title || item.raw_title,
          speaker_name: analysis.ai_scholar || item.source_attribution,
          description: analysis.ai_summary || item.raw_body,
          category: analysis.ai_category || "أخرى",
          mosque: analysis.ai_location || item.raw_location,
          city: analysis.ai_city || "الكويت",
          schedule: analysis.ai_schedule || item.raw_schedule,
          lesson_time: analysis.ai_time || item.raw_time,
          activity_type: kind === "course" ? "دورة" : kind === "lecture" ? "محاضرة" : "درس",
          is_course: kind === "course",
          book_url: item.raw_url || item.source_url,
          status: item.verification_status === "verified" ? "approved" : "pending",
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
    const { data: existing } = await admin
      .from(built.table)
      .select("id")
      .eq("external_key", item.external_id)
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
