/**
 * GET /api/cron/audit-database-integrity
 * Read-only production DB integrity audit (cron-protected).
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";

async function fetchAll(admin, table, select, pageSize = 1000) {
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

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    sendJson(res, 503, { ok: false, error: "no_admin_client" });
    return;
  }

  try {
    const issues = [];
    const lessons = await fetchAll(admin, "lessons", "id, title, source_url");
    const fawaid = await fetchAll(admin, "fawaid", "id, title, external_id, status, text");
    const qa = await fetchAll(admin, "qa_questions", "id, question");
    const library = await fetchAll(admin, "library_items", "id, title, external_id");

    for (const [table, rows, key] of [
      ["lessons", lessons, (r) => r.source_url || r.title?.trim()],
      ["fawaid", fawaid, (r) => r.text?.trim()?.slice(0, 120)],
      ["library_items", library, (r) => r.title?.trim()],
    ]) {
      const d = dupesBy(rows, key);
      if (d.length) issues.push({ type: "duplicate_slug", table, count: d.length });
    }

    const fawaidExt = dupesBy(fawaid.filter((r) => r.external_id), (r) => r.external_id);
    if (fawaidExt.length) issues.push({ type: "duplicate_external_id", table: "fawaid", count: fawaidExt.length });

    const qaDupes = dupesBy(qa, (r) => r.question?.trim());
    if (qaDupes.length) issues.push({ type: "duplicate_question", table: "qa_questions", count: qaDupes.length });

    sendJson(res, 200, {
      ok: issues.length === 0,
      scannedAt: new Date().toISOString(),
      counts: {
        lessons: lessons.length,
        fawaid: fawaid.length,
        fawaidApproved: fawaid.filter((f) => f.status === "approved").length,
        qa_questions: qa.length,
        library_items: library.length,
      },
      issues,
    });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : "Audit failed" });
  }
}
