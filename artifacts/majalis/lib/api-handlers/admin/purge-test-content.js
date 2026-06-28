import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import { shouldPurgeFawaidRow, fawaidRowToQaCandidate } from "../../../lib/production/fawaid-cleanup.mjs";
import { containsBlockedContentMarker } from "../../../lib/production/content-sanitizer.mjs";

const BLOCKED_RES = [
  /\b(?:e2e|mock|placeholder|dummy|fixture|debug|sample|verification)\b/i,
  /\[import-\d+\]\s*$/i,
  /\[verify-/i,
  /^test[-_\s]/i,
];

const TABLES = [
  { table: "fawaid", fields: ["text", "author_name"], fawaid: true },
  { table: "lessons", fields: ["title", "description"] },
  { table: "qa_questions", fields: ["question", "answer"] },
  { table: "library_items", fields: ["title", "description"] },
  { table: "knowledge_items", fields: ["raw_title", "raw_body"] },
  { table: "content_engine_review_queue", fields: ["title", "body", "summary"] },
];

function isBlockedRow(row, fields, fawaid) {
  if (fawaid && shouldPurgeFawaidRow(row)) return true;
  for (const f of fields) {
    const v = row[f];
    if (typeof v === "string" && containsBlockedContentMarker(v)) return true;
    if (typeof v === "string" && BLOCKED_RES.some((re) => re.test(v))) return true;
  }
  return false;
}

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const dryRun = req.query?.dryRun === "1" || req.body?.dryRun === true;
  const admin = getSupabaseAdmin();
  if (!admin) {
    sendJson(res, 503, { ok: false, error: "no_admin_client" });
    return;
  }

  const report = { dryRun, tables: {}, totalFound: 0, totalDeleted: 0, qaMigrated: 0 };

  for (const { table, fields, fawaid } of TABLES) {
    const { data, error } = await admin.from(table).select(`id, ${fields.join(", ")}`).limit(5000);
    if (error) {
      report.tables[table] = { error: error.message };
      continue;
    }
    const blocked = (data || []).filter((row) => isBlockedRow(row, fields, fawaid));
    report.tables[table] = { scanned: data?.length || 0, blocked: blocked.length };
    report.totalFound += blocked.length;

    if (!dryRun && blocked.length) {
      if (table === "fawaid") {
        for (const row of blocked) {
          const qa = fawaidRowToQaCandidate(row);
          if (qa) {
            const { error: qaErr } = await admin.from("qa_questions").insert({
              question: qa.question,
              answer: qa.answer,
              status: "draft",
              external_key: `migrated-fawaid:${row.id}`,
            });
            if (!qaErr) report.qaMigrated++;
          }
        }
      }
      const ids = blocked.map((r) => r.id);
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100);
        const { error: delErr } = await admin.from(table).delete().in("id", batch);
        if (delErr) {
          report.tables[table].deleteError = delErr.message;
          break;
        }
        report.totalDeleted += batch.length;
      }
    }
  }

  sendJson(res, 200, { ok: true, ...report });
}
