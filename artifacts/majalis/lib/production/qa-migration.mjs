/**
 * QA migration helpers — fawaid purge recovery + CSV import with explicit reporting.
 */
import { fawaidRowToQaCandidate } from "./fawaid-cleanup.mjs";
import { enqueueReview } from "../content-engines/review-queue.mjs";

export function emptyQaMigrationReport() {
  return {
    migrated: 0,
    skipped: 0,
    rejected: 0,
    already_exists: 0,
    missing_fields: 0,
    review_queued: 0,
    errors: [],
    details: [],
  };
}

function bump(report, key, detail) {
  report[key] = (report[key] || 0) + 1;
  if (detail) report.details.push(detail);
}

async function hasExternalKeyColumn(admin) {
  const { error } = await admin.from("qa_questions").select("external_key").limit(1);
  return !error || !/external_key|column|schema cache/i.test(error.message || "");
}

/**
 * Migrate one fawaid row to qa_questions or review queue — no silent skip.
 */
export async function migrateFawaidRowToQa(admin, row, options = {}) {
  const report = options.report || emptyQaMigrationReport();
  const batchId = options.importBatchId || `purge-${Date.now()}`;
  const qa = fawaidRowToQaCandidate(row);

  if (!qa?.question || !qa?.answer) {
    bump(report, "missing_fields", { fawaid_id: row.id, reason: "not_quiz_format" });
    const rq = await enqueueReview({
      engineId: "qa-recovery",
      item: { fawaid_id: row.id, text: row.text, author_name: row.author_name },
      reason: "needs_manual_approval",
      reasonDetail: "fawaid_purge: missing question/answer — cannot auto-migrate to qa_questions",
      sourceType: "fawaid_recovery",
    });
    if (rq.ok) bump(report, "review_queued", { fawaid_id: row.id });
    else report.errors.push(`review_queue:${row.id}:${rq.error || rq.reason}`);
    return { ok: false, action: "review_queued", report };
  }

  const externalKey = `migrated-fawaid:${row.id}`;
  const hasKeyCol = await hasExternalKeyColumn(admin);

  if (hasKeyCol) {
    const { data: existingByKey, error: keyErr } = await admin
      .from("qa_questions")
      .select("id")
      .eq("external_key", externalKey)
      .maybeSingle();
    if (keyErr) {
      report.errors.push(`external_key_lookup:${row.id}:${keyErr.message}`);
      return { ok: false, action: "error", report };
    }
    if (existingByKey?.id) {
      bump(report, "already_exists", { fawaid_id: row.id, qa_id: existingByKey.id });
      return { ok: true, action: "already_exists", report };
    }
  }

  const { data: existingByQ } = await admin
    .from("qa_questions")
    .select("id")
    .eq("question", qa.question)
    .maybeSingle();
  if (existingByQ?.id) {
    bump(report, "already_exists", { fawaid_id: row.id, qa_id: existingByQ.id, by: "question" });
    return { ok: true, action: "already_exists", report };
  }

  const payload = {
    question: qa.question,
    answer: qa.answer,
    status: "draft",
    review_status: "needs_review",
  };
  if (hasKeyCol) {
    payload.external_key = externalKey;
    payload.source_type = "fawaid_recovery";
    payload.source_ref = String(row.id);
    payload.import_batch_id = batchId;
  }

  const { error } = await admin.from("qa_questions").insert(payload);
  if (error) {
    if (/external_key|column|schema cache/i.test(error.message || "")) {
      bump(report, "rejected", { fawaid_id: row.id, reason: "schema_missing_external_key" });
      const rq = await enqueueReview({
        engineId: "qa-recovery",
        item: { question: qa.question, answer: qa.answer, fawaid_id: row.id },
        reason: "needs_manual_approval",
        reasonDetail: `qa_schema_gap: ${error.message}`,
        sourceType: "fawaid_recovery",
      });
      if (rq.ok) bump(report, "review_queued", { fawaid_id: row.id });
      else report.errors.push(`review_queue:${row.id}:${rq.error}`);
      return { ok: false, action: "review_queued", report };
    }
    report.errors.push(`insert:${row.id}:${error.message}`);
    bump(report, "rejected", { fawaid_id: row.id, error: error.message });
    return { ok: false, action: "rejected", report };
  }

  bump(report, "migrated", { fawaid_id: row.id, external_key: externalKey });
  return { ok: true, action: "migrated", report };
}

/**
 * Import quiz rows from CSV-like records into qa_questions.
 */
export async function migrateQuizRowToQa(admin, row, options = {}) {
  const report = options.report || emptyQaMigrationReport();
  const batchId = options.importBatchId || `quiz-recovery-${Date.now()}`;
  const question = String(row.question || "").trim();
  const answer = String(row.answer || "").trim();

  if (!question || !answer) {
    bump(report, "missing_fields", { row: row._line || row._index });
    return { ok: false, action: "missing_fields", report };
  }

  const slug = `${row.section || "general"}:${row.category || "general"}:${question.slice(0, 40)}`;
  const externalKey = row.external_key || `quiz-csv:${hashSlug(slug)}`;
  const hasKeyCol = await hasExternalKeyColumn(admin);

  if (hasKeyCol) {
    const { data: existing } = await admin
      .from("qa_questions")
      .select("id")
      .eq("external_key", externalKey)
      .maybeSingle();
    if (existing?.id) {
      bump(report, "already_exists", { external_key: externalKey });
      return { ok: true, action: "already_exists", report };
    }
  }

  const { data: existingByQ } = await admin
    .from("qa_questions")
    .select("id")
    .eq("question", question)
    .maybeSingle();
  if (existingByQ?.id) {
    bump(report, "already_exists", { by: "question" });
    return { ok: true, action: "already_exists", report };
  }

  const payload = {
    question,
    answer,
    status: "draft",
    review_status: "needs_review",
  };
  if (hasKeyCol) {
    payload.external_key = externalKey;
    payload.source_type = row.source_type || "quiz_csv";
    payload.source_ref = row.source_ref || row._source || null;
    payload.import_batch_id = batchId;
  }

  const { error } = await admin.from("qa_questions").insert(payload);
  if (error) {
    report.errors.push(`insert:${externalKey}:${error.message}`);
    bump(report, "rejected", { external_key: externalKey, error: error.message });
    return { ok: false, action: "rejected", report };
  }

  bump(report, "migrated", { external_key: externalKey });
  return { ok: true, action: "migrated", report };
}

function hashSlug(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}
