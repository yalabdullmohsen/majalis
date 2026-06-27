/**
 * Supabase-backed import job tracking with strict FK safety.
 * Jobs MUST exist in content_import_jobs before any content_import_staging insert.
 */

import { readFileSync } from "node:fs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { migrationFilePath } from "../migration-paths.mjs";

const MIGRATION_FILE = "content_import_jobs_v1.sql";

/** @type {Map<string, object>} */
const localJobs = new Map();

/** @type {Set<string>} */
const processingLocks = new Set();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function logJobs(event, meta = {}) {
  console.log(`[content-import:jobs] ${event}`, meta);
}

function sanitizeCreatedBy(createdBy) {
  if (!createdBy || createdBy === "service" || createdBy === "import-worker") return null;
  const id = String(createdBy).trim();
  return UUID_RE.test(id) ? id : null;
}

function loadMigrationSql() {
  try {
    return readFileSync(migrationFilePath(MIGRATION_FILE), "utf8");
  } catch {
    return null;
  }
}

/** @deprecated use loadMigrationSql — kept for callers importing ENSURE_IMPORT_JOBS_SQL */
export const ENSURE_IMPORT_JOBS_SQL = loadMigrationSql() || "";

export async function ensureImportTables(admin) {
  if (!admin) {
    logJobs("ensure_schema_skip", { reason: "no_admin" });
    return { ok: false, error: "no_admin" };
  }

  const sql = loadMigrationSql();
  if (!sql) {
    logJobs("ensure_schema_failed", { reason: "migration_file_missing", file: MIGRATION_FILE });
    return { ok: false, error: `migration_missing:${MIGRATION_FILE}` };
  }

  try {
    const { getPgClient } = await import("../database.mjs");
    const { client } = await getPgClient();
    try {
      await client.query(sql);
      const recovered = await recoverOrphanStaging(client);
      logJobs("ensure_schema_ok", { via: "postgres", recovered_orphans: recovered });
      return { ok: true, via: "postgres", recovered_orphans: recovered };
    } finally {
      await client.end().catch(() => {});
    }
  } catch (err) {
    logJobs("ensure_schema_postgres_failed", { error: err.message });
    return { ok: false, error: err.message };
  }
}

async function recoverOrphanStaging(client) {
  const { rowCount } = await client.query(`
    DELETE FROM content_import_staging s
    WHERE NOT EXISTS (SELECT 1 FROM content_import_jobs j WHERE j.id = s.job_id)
  `);
  return rowCount ?? 0;
}

export async function recoverImportJobIntegrity() {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const ensured = await ensureImportTables(admin);
  if (!ensured.ok) return ensured;

  try {
    const { getPgClient } = await import("../database.mjs");
    const { client } = await getPgClient();
    try {
      const orphans = await recoverOrphanStaging(client);
      const { rows: stuck } = await client.query(`
        UPDATE content_import_jobs
        SET status = 'failed',
            phase = 'failed',
            import_errors = '["انتهت مهمة الاستيراد بلا صفوف — تم التنظيف التلقائي"]'::jsonb,
            completed_at = now(),
            updated_at = now()
        WHERE status IN ('pending', 'uploading', 'staging')
          AND id NOT IN (SELECT DISTINCT job_id FROM content_import_staging)
          AND started_at < now() - interval '2 hours'
        RETURNING id
      `);
      logJobs("integrity_recovery", { orphans_removed: orphans, stuck_jobs_failed: stuck.length });
      return { ok: true, orphans_removed: orphans, stuck_jobs_failed: stuck.length };
    } finally {
      await client.end().catch(() => {});
    }
  } catch (err) {
    logJobs("integrity_recovery_failed", { error: err.message });
    return { ok: false, error: err.message };
  }
}

async function stageImportRowsPostgres(jobId, payloads, startIndex) {
  const { getPgClient } = await import("../database.mjs");
  const { client } = await getPgClient();
  try {
    await client.query("BEGIN");
    logJobs("staging_tx_begin", { jobId, rows: payloads.length, startIndex });

    const batchSize = 500;
    let staged = 0;
    for (let i = 0; i < payloads.length; i += batchSize) {
      const batch = payloads.slice(i, i + batchSize);
      const values = [];
      const params = [];
      let paramIdx = 1;
      for (let j = 0; j < batch.length; j++) {
        values.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}::jsonb)`);
        params.push(jobId, startIndex + i + j, JSON.stringify(batch[j]));
        paramIdx += 3;
      }
      await client.query(
        `INSERT INTO content_import_staging (job_id, row_index, payload)
         VALUES ${values.join(", ")}
         ON CONFLICT (job_id, row_index) DO UPDATE SET payload = EXCLUDED.payload`,
        params,
      );
      staged += batch.length;
    }

    await client.query("COMMIT");
    logJobs("staging_tx_commit", { jobId, rows: staged, startIndex, endIndex: startIndex + staged - 1 });
    return { ok: true, staged, via: "postgres" };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    logJobs("staging_tx_rollback", { jobId, error: err.message, startIndex });
    throw err;
  } finally {
    await client.end().catch(() => {});
  }
}

async function verifyJobPersisted(jobId, admin) {
  const { data, error } = await admin.from("content_import_jobs").select("id, status").eq("id", jobId).maybeSingle();
  if (error) return { ok: false, error: error.message, code: "job_lookup_failed" };
  if (!data?.id) return { ok: false, error: "job_not_in_database", code: "job_not_persisted" };
  return { ok: true, job: data };
}

async function insertJobPostgres({ id, type, filename, totalRows, createdBy }) {
  const { getPgClient } = await import("../database.mjs");
  const { client } = await getPgClient();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO content_import_jobs (id, type, filename, total_rows, created_by, status, phase)
       VALUES ($1, $2, $3, $4, $5, 'pending', 'pending')`,
      [id, type, filename || null, totalRows || 0, createdBy],
    );
    await client.query("COMMIT");
    logJobs("job_created", { jobId: id, via: "postgres", type, totalRows });
    return { ok: true, via: "postgres" };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end().catch(() => {});
  }
}

async function insertJobSupabase(admin, { id, type, filename, totalRows, createdBy }) {
  const { data, error } = await admin
    .from("content_import_jobs")
    .insert({
      id,
      type,
      filename: filename || null,
      total_rows: totalRows || 0,
      created_by: createdBy,
      status: "pending",
      phase: "pending",
    })
    .select("id, started_at")
    .single();

  if (error) {
    logJobs("job_create_failed", { jobId: id, via: "supabase", error: error.message });
    return { ok: false, error: error.message };
  }

  logJobs("job_created", { jobId: data.id, via: "supabase", type, totalRows });
  return { ok: true, via: "supabase", started_at: data.started_at };
}

/**
 * Create import job — MUST persist to DB when Supabase admin is configured.
 * @returns {Promise<{ ok: boolean, job?: object, id?: string, error?: string, persisted?: boolean, via?: string }>}
 */
export async function createImportJob({ type, filename, totalRows, createdBy }) {
  const admin = getSupabaseAdmin();
  const createdBySafe = sanitizeCreatedBy(createdBy);
  const jobId = crypto.randomUUID();

  const job = {
    id: jobId,
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
    persisted: false,
  };

  if (!admin) {
    localJobs.set(jobId, { ...job, staged: [] });
    logJobs("job_created", { jobId, via: "memory", type, totalRows, note: "no_supabase_admin" });
    return { ok: true, job, id: jobId, persisted: false, via: "memory" };
  }

  const schema = await ensureImportTables(admin);
  if (!schema.ok) {
    return {
      ok: false,
      error: `import_schema_not_ready: ${schema.error}`,
      code: "schema_not_ready",
    };
  }

  try {
    await insertJobPostgres({ id: jobId, type, filename, totalRows, createdBy: createdBySafe });
    job.persisted = true;
    job.via = "postgres";
  } catch (pgErr) {
    logJobs("job_create_postgres_fallback", { jobId, error: pgErr.message });
    const inserted = await insertJobSupabase(admin, {
      id: jobId,
      type,
      filename,
      totalRows,
      createdBy: createdBySafe,
    });
    if (!inserted.ok) {
      return {
        ok: false,
        error: inserted.error || pgErr.message,
        code: "job_create_failed",
      };
    }
    job.persisted = true;
    job.via = inserted.via;
    if (inserted.started_at) job.started_at = inserted.started_at;
  }

  const verified = await verifyJobPersisted(jobId, admin);
  if (!verified.ok) {
    logJobs("job_verify_failed_after_create", { jobId, error: verified.error });
    return { ok: false, error: verified.error, code: verified.code };
  }

  localJobs.set(jobId, { ...job });
  return { ok: true, job, id: jobId, persisted: true, via: job.via };
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
  const { error } = await admin.from("content_import_jobs").update(row).eq("id", jobId);
  if (error) logJobs("job_update_failed", { jobId, error: error.message });
  return merged;
}

export async function getImportJob(jobId) {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin.from("content_import_jobs").select("*").eq("id", jobId).maybeSingle();
    if (error) {
      logJobs("job_lookup_error", { jobId, error: error.message });
    }
    if (data) {
      localJobs.set(jobId, data);
      return data;
    }
    if (localJobs.has(jobId)) {
      localJobs.delete(jobId);
    }
    return null;
  }
  return localJobs.get(jobId) || null;
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
    const local = localJobs.get(jobId);
    if (!local) {
      return { ok: false, error: "job_not_found", code: "job_not_found" };
    }
    local.staged = [...(local.staged || []), ...payloads];
    localJobs.set(jobId, local);
    logJobs("staging_memory", { jobId, rows: payloads.length, startIndex });
    return { ok: true, staged: payloads.length, via: "memory" };
  }

  const verified = await verifyJobPersisted(jobId, admin);
  if (!verified.ok) {
    logJobs("staging_aborted", { jobId, reason: verified.error, code: verified.code });
    return { ok: false, error: verified.error, code: verified.code };
  }

  try {
    return await stageImportRowsPostgres(jobId, payloads, startIndex);
  } catch (pgErr) {
    logJobs("staging_postgres_fallback", { jobId, error: pgErr.message });
  }

  const rows = payloads.map((payload, i) => ({
    job_id: jobId,
    row_index: startIndex + i,
    payload,
  }));

  const batchSize = 500;
  let staged = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await admin.from("content_import_staging").upsert(batch, {
      onConflict: "job_id,row_index",
    });
    if (error) {
      logJobs("staging_insert_failed", { jobId, error: error.message, batchStart: startIndex + i });
      return { ok: false, error: error.message, code: "staging_insert_failed", staged_before_failure: staged };
    }
    staged += batch.length;
  }

  logJobs("staging_insert_ok", { jobId, rows: staged, startIndex, endIndex: startIndex + staged - 1, via: "supabase" });
  return { ok: true, staged, via: "supabase" };
}

export async function loadStagedPayloads(jobId) {
  const local = localJobs.get(jobId);
  if (local?.staged?.length) return local.staged;

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
    if (error) {
      logJobs("staging_load_failed", { jobId, error: error.message });
      break;
    }
    if (!data?.length) break;
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
    const { error } = await admin.from("content_import_staging").delete().eq("job_id", jobId);
    if (error) logJobs("staging_clear_failed", { jobId, error: error.message });
    else logJobs("staging_cleared", { jobId });
  }
}
