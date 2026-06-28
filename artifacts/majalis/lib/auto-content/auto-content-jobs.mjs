/**
 * Supabase-backed auto content job tracking (async sync pipeline).
 */

import { readFileSync } from "node:fs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { migrationFilePath } from "../migration-paths.mjs";

const MIGRATION_FILE = "auto_content_jobs_v1.sql";

/** @type {Map<string, object>} */
const localJobs = new Map();

/** @type {Set<string>} */
const processingLocks = new Set();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const JOB_STATUSES = ["queued", "running", "completed", "failed", "cancelled"];

export const TERMINAL_JOB_STATUSES = new Set(["completed", "failed", "cancelled"]);

export const ACTIVE_JOB_STATUSES = ["queued", "running"];

/** Jobs with no progress update for this long are marked failed by the watchdog. */
export const AUTO_CONTENT_WATCHDOG_MS = 10 * 60 * 1000;

export const AUTO_CONTENT_PHASES = [
  "queued",
  "fetch_sources",
  "normalize",
  "validate",
  "dedup",
  "classify",
  "ai_enrich",
  "publish",
  "reindex",
  "done",
  "failed",
  "cancelled",
];

function logJobs(event, meta = {}) {
  const jobId = meta.jobId || meta.job_id;
  console.log(
    JSON.stringify({
      tag: "auto-content:jobs",
      event,
      ...(jobId ? { job_id: jobId } : {}),
      ...meta,
      ts: new Date().toISOString(),
    }),
  );
}

export function jobLog(jobId, event, meta = {}) {
  logJobs(event, { jobId, ...meta });
}

function sanitizeCreatedBy(createdBy) {
  if (!createdBy || createdBy === "service") return null;
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

export async function ensureAutoContentJobTables(admin) {
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
      logJobs("ensure_schema_ok", { via: "postgres" });
      return { ok: true, via: "postgres" };
    } finally {
      await client.end().catch(() => {});
    }
  } catch (err) {
    logJobs("ensure_schema_postgres_failed", { error: err.message });
    return { ok: false, error: err.message };
  }
}

function normalizeJob(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type || "sync",
    status: row.status,
    phase: row.phase,
    progress: row.progress ?? 0,
    started_at: row.started_at,
    finished_at: row.finished_at,
    created_by: row.created_by,
    error_message: row.error_message,
    result: row.result,
    metadata: row.metadata || {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function createAutoContentJob({ type = "sync", createdBy, metadata = {} } = {}) {
  const admin = getSupabaseAdmin();
  const createdBySafe = sanitizeCreatedBy(createdBy);
  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();

  const job = {
    id: jobId,
    type,
    status: "queued",
    phase: "queued",
    progress: 0,
    started_at: null,
    finished_at: null,
    created_by: createdBySafe,
    error_message: null,
    result: null,
    metadata: { logs: [], ...metadata },
    created_at: now,
    updated_at: now,
    persisted: false,
  };

  if (!admin) {
    localJobs.set(jobId, { ...job });
    logJobs("job_created", { jobId, via: "memory", type });
    return { ok: true, jobId, job, status: "queued", persisted: false, via: "memory" };
  }

  const schema = await ensureAutoContentJobTables(admin);
  if (!schema.ok) {
    return { ok: false, error: `auto_content_schema_not_ready: ${schema.error}`, code: "schema_not_ready" };
  }

  const { error } = await admin.from("auto_content_jobs").insert({
    id: jobId,
    type,
    status: "queued",
    phase: "queued",
    progress: 0,
    created_by: createdBySafe,
    metadata: job.metadata,
  });

  if (error) {
    logJobs("job_create_failed", { jobId, error: error.message });
    return { ok: false, error: error.message, code: "job_create_failed" };
  }

  job.persisted = true;
  localJobs.set(jobId, { ...job });
  logJobs("job_created", { jobId, via: "supabase", type });
  return { ok: true, jobId, job, status: "queued", persisted: true, via: "supabase" };
}

export async function updateAutoContentJob(jobId, patch) {
  const local = localJobs.get(jobId) || {};
  const mergedMetadata =
    patch.metadata && local.metadata
      ? { ...local.metadata, ...patch.metadata }
      : patch.metadata || local.metadata || {};
  const merged = {
    ...local,
    ...patch,
    metadata: mergedMetadata,
    updated_at: patch.updated_at || new Date().toISOString(),
  };
  localJobs.set(jobId, merged);

  const admin = getSupabaseAdmin();
  if (!admin || !jobId) return normalizeJob(merged);

  const row = {
    type: merged.type,
    status: merged.status,
    phase: merged.phase,
    progress: merged.progress,
    started_at: merged.started_at,
    finished_at: merged.finished_at,
    error_message: merged.error_message,
    result: merged.result,
    metadata: merged.metadata,
    updated_at: merged.updated_at,
  };

  const { error } = await admin.from("auto_content_jobs").update(row).eq("id", jobId);
  if (error) logJobs("job_update_failed", { jobId, error: error.message });

  return normalizeJob(merged);
}

export async function getAutoContentJob(jobId) {
  const local = localJobs.get(jobId);
  const admin = getSupabaseAdmin();

  if (admin) {
    const { data, error } = await admin.from("auto_content_jobs").select("*").eq("id", jobId).maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (data) {
      const job = normalizeJob(data);
      localJobs.set(jobId, job);
      return { ok: true, job };
    }
  }

  if (local) return { ok: true, job: normalizeJob(local) };
  return { ok: false, error: "job_not_found", code: "job_not_found" };
}

export async function listAutoContentJobs(limit = 10) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    const jobs = [...localJobs.values()]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
      .map(normalizeJob);
    return { ok: true, jobs };
  }

  const { data, error } = await admin
    .from("auto_content_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { ok: false, error: error.message, jobs: [] };
  return { ok: true, jobs: (data || []).map(normalizeJob) };
}

export async function claimQueuedAutoContentJobs(limit = 3) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    const claimed = [];
    for (const [id, job] of localJobs) {
      if (job.status === "queued" && !processingLocks.has(id) && claimed.length < limit) {
        processingLocks.add(id);
        await updateAutoContentJob(id, {
          status: "running",
          phase: "fetch_sources",
          progress: 1,
          started_at: new Date().toISOString(),
        });
        claimed.push(id);
      }
    }
    return { ok: true, jobIds: claimed, via: "memory" };
  }

  const { data: queued, error } = await admin
    .from("auto_content_jobs")
    .select("id")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) return { ok: false, error: error.message, jobIds: [] };

  const jobIds = [];
  for (const row of queued || []) {
    if (processingLocks.has(row.id)) continue;
    processingLocks.add(row.id);
    const { data: updated, error: updErr } = await admin
      .from("auto_content_jobs")
      .update({
        status: "running",
        phase: "fetch_sources",
        progress: 1,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("status", "queued")
      .select("id")
      .maybeSingle();

    if (!updErr && updated?.id) jobIds.push(updated.id);
    else processingLocks.delete(row.id);
  }

  return { ok: true, jobIds, via: "supabase" };
}

export function releaseAutoContentJobLock(jobId) {
  processingLocks.delete(jobId);
}

export function acquireAutoContentJobLock(jobId) {
  if (processingLocks.has(jobId)) return false;
  processingLocks.add(jobId);
  return true;
}

export async function cancelAutoContentJob(jobId, reason = "أُلغيت المهمة بواسطة المستخدم") {
  const snap = await getAutoContentJob(jobId);
  if (!snap.ok) return snap;

  if (TERMINAL_JOB_STATUSES.has(snap.job.status)) {
    return { ok: true, jobId, status: snap.job.status, alreadyTerminal: true };
  }

  await updateAutoContentJob(jobId, {
    status: "cancelled",
    phase: "cancelled",
    error_message: reason,
    finished_at: new Date().toISOString(),
  });
  releaseAutoContentJobLock(jobId);
  jobLog(jobId, "cancelled", { reason });
  return { ok: true, jobId, status: "cancelled" };
}

export async function runAutoContentJobWatchdog() {
  const admin = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - AUTO_CONTENT_WATCHDOG_MS).toISOString();
  const reason = `Job timed out — no progress for ${AUTO_CONTENT_WATCHDOG_MS / 60000} minutes`;

  if (!admin) {
    const failed = [];
    for (const [id, job] of localJobs) {
      if (job.status === "running" && job.updated_at < cutoff) {
        await updateAutoContentJob(id, {
          status: "failed",
          phase: "failed",
          error_message: reason,
          finished_at: new Date().toISOString(),
          metadata: {
            ...job.metadata,
            alerts: [...(job.metadata?.alerts || []), { type: "watchdog_timeout", at: new Date().toISOString() }],
          },
        });
        releaseAutoContentJobLock(id);
        failed.push(id);
        jobLog(id, "watchdog_failed", { reason });
      }
    }
    return { ok: true, failed, count: failed.length, via: "memory" };
  }

  const { data: stuck, error } = await admin
    .from("auto_content_jobs")
    .select("id, status, phase, metadata")
    .eq("status", "running")
    .lt("updated_at", cutoff)
    .limit(50);

  if (error) return { ok: false, error: error.message, failed: [], count: 0 };

  const failed = [];
  for (const job of stuck || []) {
    const alerts = [...(job.metadata?.alerts || []), { type: "watchdog_timeout", at: new Date().toISOString() }];
    const { error: updErr } = await admin
      .from("auto_content_jobs")
      .update({
        status: "failed",
        phase: "failed",
        error_message: reason,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { ...(job.metadata || {}), alerts },
      })
      .eq("id", job.id);

    if (!updErr) {
      failed.push(job.id);
      releaseAutoContentJobLock(job.id);
      jobLog(job.id, "watchdog_failed", { previous_phase: job.phase, reason });
    }
  }

  return { ok: true, failed, count: failed.length, via: "supabase" };
}

export function appendJobLog(job, message, phase) {
  const logs = [...(job.metadata?.logs || [])];
  logs.push({ at: new Date().toISOString(), phase: phase || job.phase, message });
  return logs.slice(-50);
}
