import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getJobRecords, updateJob } from "./job-store.mjs";

export async function rollbackJob(jobId) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("supabase_admin_missing");

  const records = await getJobRecords(jobId);
  const byTable = new Map();
  for (const r of records) {
    if (!byTable.has(r.table_name)) byTable.set(r.table_name, []);
    byTable.get(r.table_name).push(r.record_id);
  }

  const deleted = {};
  for (const [table, ids] of byTable.entries()) {
    try {
      const { error } = await admin.from(table).delete().in("id", ids);
      if (error) {
        deleted[table] = { ok: false, error: error.message, count: 0 };
      } else {
        deleted[table] = { ok: true, count: ids.length };
      }
    } catch (err) {
      deleted[table] = { ok: false, error: err.message, count: 0 };
    }
  }

  await updateJob(jobId, {
    status: "rolled_back",
    progress_stage: "rolled_back",
    completed_at: new Date().toISOString(),
    error_summary: "Rollback completed — partial import removed",
  });

  return { ok: true, jobId, deleted, recordsRemoved: records.length };
}
