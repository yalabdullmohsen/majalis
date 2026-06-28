/**
 * QA questions recovery — migrate external_key, dedupe, queue for review.
 */
import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

function normalizeQuestion(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function buildExternalKey(row) {
  if (row.external_key) return row.external_key;
  const norm = normalizeQuestion(row.question);
  const hash = createHash("sha256").update(norm).digest("hex").slice(0, 16);
  return `qa:hash:${hash}`;
}

export async function runQaRecovery(options = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, error: "supabase_not_configured", migrated: 0, skipped: 0, duplicated: 0, rejected: 0, reviewQueued: 0 };
  }

  const dryRun = options.dryRun === true;
  const report = {
    ok: true,
    dryRun,
    migrated: 0,
    skipped: 0,
    duplicated: 0,
    rejected: 0,
    reviewQueued: 0,
    errors: [],
    at: new Date().toISOString(),
  };

  const { data: rows, error } = await admin
    .from("qa_questions")
    .select("id, question, answer, external_key, status, review_status")
    .order("created_at", { ascending: true });

  if (error) {
    if (/external_key|column|schema cache/i.test(error.message || "")) {
      return {
        ok: false,
        error: "external_key_column_missing",
        hint: "Run apply-migrations?scope=qa-external-key first",
        ...report,
      };
    }
    return { ok: false, error: error.message, ...report };
  }

  const seenKeys = new Map();
  const seenQuestions = new Map();

  for (const row of rows || []) {
    const norm = normalizeQuestion(row.question);
    if (!norm || norm.length < 5) {
      report.rejected++;
      continue;
    }

    const key = buildExternalKey(row);

    if (seenQuestions.has(norm)) {
      report.duplicated++;
      if (!dryRun) {
        await admin.from("qa_questions").update({
          status: "draft",
          review_status: "needs_review",
        }).eq("id", row.id);
      }
      report.reviewQueued++;
      continue;
    }
    seenQuestions.set(norm, row.id);

    if (seenKeys.has(key) && row.external_key !== key) {
      report.duplicated++;
      if (!dryRun) {
        await admin.from("qa_questions").update({
          status: "draft",
          review_status: "needs_review",
        }).eq("id", row.id);
      }
      report.reviewQueued++;
      continue;
    }
    seenKeys.set(key, row.id);

    if (row.external_key === key) {
      report.skipped++;
      continue;
    }

    if (!dryRun) {
      const { error: upErr } = await admin.from("qa_questions").update({ external_key: key }).eq("id", row.id);
      if (upErr) {
        report.errors.push({ id: row.id, error: upErr.message });
        continue;
      }
    }
    report.migrated++;
  }

  report.ok = report.errors.length === 0;
  return report;
}

export async function verifyQaNoDuplicates() {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_not_configured" };

  const { data: rows, error } = await admin
    .from("qa_questions")
    .select("id, question, external_key");

  if (error) return { ok: false, error: error.message };

  const byQuestion = new Map();
  const byKey = new Map();
  const duplicates = [];

  for (const row of rows || []) {
    const norm = normalizeQuestion(row.question);
    if (byQuestion.has(norm)) {
      duplicates.push({ type: "question", id: row.id, duplicateOf: byQuestion.get(norm) });
    } else {
      byQuestion.set(norm, row.id);
    }

    if (row.external_key) {
      if (byKey.has(row.external_key)) {
        duplicates.push({ type: "external_key", id: row.id, duplicateOf: byKey.get(row.external_key) });
      } else {
        byKey.set(row.external_key, row.id);
      }
    }
  }

  return {
    ok: duplicates.length === 0,
    total: rows?.length || 0,
    duplicateCount: duplicates.length,
    duplicates: duplicates.slice(0, 20),
  };
}
