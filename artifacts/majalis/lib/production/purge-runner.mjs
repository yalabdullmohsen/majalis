/**
 * Production content purge — shared by CLI, admin API, and cron.
 */
import { containsBlockedContentMarker } from "./content-sanitizer.mjs";
import { shouldPurgeFawaidRow, fawaidRowToQaCandidate } from "./fawaid-cleanup.mjs";

const BLOCKED = [
  /\b(?:e2e|mock|placeholder|dummy|fixture|debug|sample|verification)\b/i,
  /\[import-\d+\]\s*$/i,
  /\[verify-/i,
  /^test[-_\s]/i,
  /\btest data\b/i,
];

export const PURGE_TABLES = [
  { table: "fawaid", fields: ["text", "author_name"], fawaid: true },
  { table: "lessons", fields: ["title", "description", "speaker_name"] },
  { table: "qa_questions", fields: ["question", "answer"] },
  { table: "library_items", fields: ["title", "description"] },
  { table: "scientific_miracles", fields: ["title", "body"] },
  { table: "knowledge_items", fields: ["raw_title", "raw_body"] },
  { table: "platform_updates", fields: ["title", "summary", "body"], optional: true },
  { table: "content_engine_review_queue", fields: ["title", "summary"], optional: true },
];

export function isBlockedRow(record, fields, fawaid) {
  if (fawaid && shouldPurgeFawaidRow(record)) {
    return { field: "text", value: String(record.text || "").slice(0, 80) };
  }
  for (const field of fields) {
    const val = record[field];
    if (typeof val === "string" && containsBlockedContentMarker(val)) {
      return { field, value: val.slice(0, 80) };
    }
    for (const re of BLOCKED) {
      if (typeof val === "string" && re.test(val)) {
        return { field, value: val.slice(0, 80) };
      }
    }
  }
  return null;
}

async function fetchAll(admin, table, fields) {
  const rows = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await admin
      .from(table)
      .select(`id, ${fields.join(", ")}`)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function migrateFawaidToQa(admin, row) {
  const qa = fawaidRowToQaCandidate(row);
  if (!qa) return { migrated: false, skipped: true };
  const externalKey = `migrated-fawaid:${row.id}`;

  const { data: existingByKey, error: keyErr } = await admin
    .from("qa_questions")
    .select("id")
    .eq("external_key", externalKey)
    .maybeSingle();
  if (keyErr && !/external_key|column|schema cache/i.test(keyErr.message || "")) {
    return { migrated: false, error: keyErr.message };
  }
  if (existingByKey?.id) return { migrated: false, skipped: true, duplicate: true };

  const { data: existingByQ } = await admin
    .from("qa_questions")
    .select("id")
    .eq("question", qa.question)
    .maybeSingle();
  if (existingByQ?.id) return { migrated: false, skipped: true, duplicate: true };

  const payload = { question: qa.question, answer: qa.answer, status: "draft" };
  if (!keyErr) payload.external_key = externalKey;

  const { error } = await admin.from("qa_questions").insert(payload);
  if (error) return { migrated: false, error: error.message };
  return { migrated: true };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {{ dryRun?: boolean; apply?: boolean }} options
 */
export async function runProductionPurge(admin, options = {}) {
  const dryRun = options.apply === true ? false : options.dryRun !== false;
  const report = {
    dryRun,
    tables: {},
    totalFound: 0,
    totalDeleted: 0,
    qaMigrated: 0,
    qaSkipped: 0,
    errors: [],
  };

  for (const { table, fields, fawaid, optional } of PURGE_TABLES) {
    let data;
    try {
      data = await fetchAll(admin, table, fields);
    } catch (err) {
      report.tables[table] = { error: err.message, optional: Boolean(optional) };
      if (!optional) report.errors.push(`${table}: ${err.message}`);
      continue;
    }

    const blocked = data.filter((row) => isBlockedRow(row, fields, fawaid));
    report.tables[table] = { scanned: data.length, blocked: blocked.length };
    report.totalFound += blocked.length;

    if (dryRun || !blocked.length) continue;

    if (table === "fawaid") {
      for (const row of blocked) {
        const mig = await migrateFawaidToQa(admin, row);
        if (mig.migrated) report.qaMigrated++;
        else if (mig.skipped) report.qaSkipped++;
        else if (mig.error) report.errors.push(`qa_migrate:${row.id}:${mig.error}`);
      }
    }

    for (let i = 0; i < blocked.length; i += 100) {
      const batch = blocked.slice(i, i + 100).map((r) => r.id);
      const { error: delErr } = await admin.from(table).delete().in("id", batch);
      if (delErr) {
        report.tables[table].deleteError = delErr.message;
        report.errors.push(`${table}_delete:${delErr.message}`);
        break;
      }
      report.totalDeleted += batch.length;
    }
  }

  report.ok = report.errors.length === 0;
  return report;
}
