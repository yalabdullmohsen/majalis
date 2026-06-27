import { getSupabaseAdmin } from "../supabase-admin.mjs";

export async function createJob(payload) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("supabase_admin_missing");

  const { data, error } = await admin
    .from("content_import_jobs")
    .insert({
      user_id: payload.userId || null,
      admin_role: payload.role || null,
      content_type: payload.contentType,
      filename: payload.filename || null,
      file_size_bytes: payload.fileSizeBytes || 0,
      total_rows: payload.totalRows || 0,
      column_headers: payload.columnHeaders || [],
      status: "pending",
      progress_stage: "created",
      started_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateJob(jobId, patch) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("supabase_admin_missing");
  const { data, error } = await admin.from("content_import_jobs").update(patch).eq("id", jobId).select("*").single();
  if (error) throw error;
  return data;
}

export async function getJob(jobId) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("supabase_admin_missing");
  const { data, error } = await admin.from("content_import_jobs").select("*").eq("id", jobId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listJobs(limit = 30) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const { data, error } = await admin
    .from("content_import_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (/Could not find|42P01|PGRST205/i.test(error.message)) return [];
    return [];
  }
  return data || [];
}

export async function recordInsertedRows(jobId, entries) {
  const admin = getSupabaseAdmin();
  if (!admin || !entries.length) return;
  const { error } = await admin.from("content_import_job_records").insert(
    entries.map((e) => ({
      job_id: jobId,
      row_index: e.rowIndex,
      table_name: e.tableName,
      record_id: e.recordId,
      dedupe_key: e.dedupeKey || null,
    })),
  );
  if (error) throw error;
}

export async function getJobRecords(jobId) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const { data, error } = await admin.from("content_import_job_records").select("*").eq("job_id", jobId);
  if (error) throw error;
  return data || [];
}
