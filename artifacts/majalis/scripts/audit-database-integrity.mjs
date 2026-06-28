#!/usr/bin/env node
/**
 * Production database integrity audit (read-only).
 * Checks duplicates, orphans, broken references across core tables.
 */
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";

async function fetchAll(admin, table, select = "*", pageSize = 1000) {
  const rows = [];
  let from = 0;
  for (;;) {
    const { data, error } = await admin.from(table).select(select).range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

function dupesBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const k = keyFn(row);
    if (k == null || k === "") continue;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(row);
  }
  return [...map.entries()].filter(([, v]) => v.length > 1);
}

async function safeFetchAll(admin, table, select) {
  try {
    return await fetchAll(admin, table, select);
  } catch (err) {
    return { error: err.message, rows: [] };
  }
}

async function main() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error("✗ Supabase admin required (SUPABASE_SERVICE_ROLE_KEY)");
    process.exit(1);
  }

  const issues = [];

  const lessons = await fetchAll(admin, "lessons", "id, title, source_url");
  const fawaid = await fetchAll(admin, "fawaid", "id, external_id, title, status, text");
  const qa = await fetchAll(admin, "qa_questions", "id, question");
  const library = await fetchAll(admin, "library_items", "id, title, external_id");
  const knowledgeRes = await safeFetchAll(admin, "knowledge_items", "id, slug, source_type, source_id");
  const connectorsRes = await safeFetchAll(admin, "ake_connectors", "id, slug, name, health_status, is_active");
  const reviewRes = await safeFetchAll(admin, "content_engine_review_queue", "id, item_type, item_id, status");
  const knowledge = knowledgeRes.rows || knowledgeRes;
  const connectors = connectorsRes.rows || connectorsRes;
  const reviewQueue = reviewRes.rows || reviewRes;

  if (knowledgeRes.error) issues.push({ type: "table_missing", table: "knowledge_items", message: knowledgeRes.error });
  if (connectorsRes.error) issues.push({ type: "table_missing", table: "ake_connectors", message: connectorsRes.error });
  if (reviewRes.error) issues.push({ type: "table_missing", table: "content_engine_review_queue", message: reviewRes.error });

  for (const [table, rows, key] of [
    ["lessons", lessons, (r) => r.source_url || r.title?.trim()],
    ["fawaid", fawaid, (r) => r.text?.trim()?.slice(0, 120)],
    ["library_items", library, (r) => r.title?.trim()],
  ]) {
    const d = dupesBy(rows, key);
    if (d.length) issues.push({ type: "duplicate_key", table, count: d.length, samples: d.slice(0, 3).map(([k]) => k) });
  }

  const fawaidExt = dupesBy(fawaid.filter((r) => r.external_id), (r) => r.external_id);
  if (fawaidExt.length) {
    issues.push({ type: "duplicate_external_id", table: "fawaid", count: fawaidExt.length });
  }

  const qaDupes = dupesBy(qa, (r) => r.question?.trim());
  if (qaDupes.length) {
    issues.push({ type: "duplicate_question", table: "qa_questions", count: qaDupes.length });
  }

  const lessonIds = new Set(lessons.map((l) => l.id));
  const orphanKnowledge = (Array.isArray(knowledge) ? knowledge : []).filter(
    (k) => k.source_type === "lesson" && k.source_id && !lessonIds.has(k.source_id),
  );
  if (orphanKnowledge.length) {
    issues.push({ type: "orphan_reference", table: "knowledge_items→lessons", count: orphanKnowledge.length });
  }

  const fawaidIds = new Set(fawaid.map((f) => f.id));
  const orphanReview = (Array.isArray(reviewQueue) ? reviewQueue : []).filter(
    (r) => r.item_type === "fawaid" && r.item_id && !fawaidIds.has(r.item_id),
  );
  if (orphanReview.length) {
    issues.push({ type: "orphan_reference", table: "review_queue→fawaid", count: orphanReview.length });
  }

  const report = {
    ok: issues.filter((i) => i.type !== "table_missing").length === 0,
    scannedAt: new Date().toISOString(),
    counts: {
      lessons: lessons.length,
      fawaid: fawaid.length,
      fawaidApproved: fawaid.filter((f) => f.status === "approved").length,
      qa_questions: qa.length,
      library_items: library.length,
      knowledge_items: Array.isArray(knowledge) ? knowledge.length : 0,
      connectors: Array.isArray(connectors) ? connectors.length : 0,
      review_queue: Array.isArray(reviewQueue) ? reviewQueue.length : 0,
    },
    issues,
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
