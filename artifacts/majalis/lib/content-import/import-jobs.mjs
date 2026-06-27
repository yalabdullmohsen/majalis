/**
 * In-memory + Supabase import job tracking (no filesystem).
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";

export const ENSURE_IMPORT_JOBS_SQL = `
CREATE TABLE IF NOT EXISTS content_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  phase TEXT NOT NULL DEFAULT 'pending',
  filename TEXT,
  total_rows INT NOT NULL DEFAULT 0,
  processed_rows INT NOT NULL DEFAULT 0,
  imported INT NOT NULL DEFAULT 0,
  skipped INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  progress_pct REAL NOT NULL DEFAULT 0,
  validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  import_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  report JSONB,
  timings JSONB,
  execution_mode TEXT,
  created_by UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_import_staging (
  job_id UUID NOT NULL REFERENCES content_import_jobs(id) ON DELETE CASCADE,
  row_index INT NOT NULL,
  payload JSONB NOT NULL,
  PRIMARY KEY (job_id, row_index)
);

CREATE INDEX IF NOT EXISTS idx_content_import_staging_job ON content_import_staging (job_id);
CREATE INDEX IF NOT EXISTS idx_content_import_jobs_status ON content_import_jobs (status);

ALTER TABLE content_import_jobs ADD COLUMN IF NOT EXISTS phase TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE content_import_jobs ADD COLUMN IF NOT EXISTS timings JSONB;
ALTER TABLE content_import_jobs ADD COLUMN IF NOT EXISTS execution_mode TEXT;
`;

/** @type {Map<string, object>} */
const localJobs = new Map();

/** @type {Set<string>} */
const processingLocks = new Set();

export async function ensureImportTables(admin) {
  if (!admin) return false;
  try {
    const { getPgClient } = await import("../database.mjs");
    const { client } = await getPgClient();
    try {
      await client.query(ENSURE_IMPORT_JOBS_SQL);
      return true;
    } finally {
      await client.end().catch(() => {});
    }
  } catch {
    return false;
  }
}

export async function createImportJob({ type, filename, totalRows, createdBy }) {
  const admin = getSupabaseAdmin();
  const job = {
    id: crypto.randomUUID(),
    type,
    status: "pending",
    phase: "pending",
    filename: filename || null,
    total_rows: totalRows || 0,
    processed_rows: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    progress_pct: 0,
    validation_errors: [],
    import_errors: [],
    timings: null,
    execution_mode: null,
    started_at: new Date().toISOString(),
  };

  if (admin) {
    await ensureImportTables(admin);
    const { data, error } = await admin
      .from("content_import_jobs")
      .insert({
        type,
        filename,
        total_rows: totalRows || 0,
        created_by: createdBy || null,
        status: "pending",
        phase: "pending",
      })
      .select("id, started_at")
      .single();
    if (!error && data?.id) {
      job.id = data.id;
      job.started_at = data.started_at;
    }
  }

  localJobs.set(job.id, { ...job });
  return job;
}

export async function updateImportJob(jobId, patch) {
  const local = localJobs.get(jobId) || {};
  const merged = { ...local, ...patch, updated_at: new Date().toISOString() };
  localJobs.set(jobId, merged);

  const admin = getSupabaseAdmin();
  if (!admin || !jobId) return merged;

  const row = {
    status: merged.status,
    phase: merged.phase,
    processed_rows: merged.processed_rows,
    imported: merged.imported,
    skipped: merged.skipped,
    failed: merged.failed,
    progress_pct: merged.progress_pct,
    validation_errors: merged.validation_errors,
    import_errors: merged.import_errors,
    report: merged.report,
    timings: merged.timings,
    execution_mode: merged.execution_mode,
    completed_at: merged.completed_at,
    updated_at: merged.updated_at,
  };
  await admin.from("content_import_jobs").update(row).eq("id", jobId);
  return merged;
}

export async function getImportJob(jobId) {
  if (localJobs.has(jobId)) return localJobs.get(jobId);

  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin.from("content_import_jobs").select("*").eq("id", jobId).maybeSingle();
  if (data) localJobs.set(jobId, data);
  return data;
}

export function tryAcquireProcessingLock(jobId) {
  if (processingLocks.has(jobId)) return false;
  processingLocks.add(jobId);
  return true;
}

export function releaseProcessingLock(jobId) {
  processingLocks.delete(jobId);
}

export async function listQueuedImportJobs(limit = 5) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return [...localJobs.values()]
      .filter((j) => j.status === "queued" || j.status === "processing")
      .slice(0, limit);
  }
  const { data } = await admin
    .from("content_import_jobs")
    .select("*")
    .in("status", ["queued", "processing"])
    .order("started_at", { ascending: true })
    .limit(limit);
  return data || [];
}

export async function stageImportRows(jobId, payloads, startIndex = 0) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    const local = localJobs.get(jobId) || {};
    local.staged = [...(local.staged || []), ...payloads];
    localJobs.set(jobId, local);
    return { ok: true, staged: payloads.length, via: "memory" };
  }

  await ensureImportTables(admin);
  const rows = payloads.map((payload, i) => ({
    job_id: jobId,
    row_index: startIndex + i,
    payload,
  }));

  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await admin.from("content_import_staging").upsert(batch, {
      onConflict: "job_id,row_index",
    });
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true, staged: payloads.length, via: "supabase" };
}

export async function loadStagedPayloads(jobId) {
  const local = localJobs.get(jobId);
  if (local?.staged) return local.staged;

  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const all = [];
  let from = 0;
  const page = 5000;
  while (true) {
    const { data, error } = await admin
      .from("content_import_staging")
      .select("row_index, payload")
      .eq("job_id", jobId)
      .order("row_index", { ascending: true })
      .range(from, from + page - 1);
    if (error || !data?.length) break;
    all.push(...data.map((r) => r.payload));
    if (data.length < page) break;
    from += page;
  }
  return all;
}

export async function clearStaging(jobId) {
  const local = localJobs.get(jobId);
  if (local) {
    delete local.staged;
    localJobs.set(jobId, local);
  }
  const admin = getSupabaseAdmin();
  if (admin) {
    await admin.from("content_import_staging").delete().eq("job_id", jobId);
  }
}
