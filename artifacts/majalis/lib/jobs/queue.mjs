/**
 * Durable background job queue (Postgres).
 * Memory adapter only when ALLOW_IN_MEMORY_RELIABILITY_STORE=1 or NODE_ENV=test.
 * Production: fail closed if Postgres unavailable.
 *
 * Fields: idempotency_key, attempt_count, locked_at, locked_by,
 * next_retry_at / next_run_at, completed_at / finished_at, last_error_code,
 * dead_letter via status + background_job_dead_letters.
 * Claim uses FOR UPDATE SKIP LOCKED + advisory lock + single active job_type lease.
 */

import { randomUUID } from "node:crypto";
import { classifyAiError, isPermanentAiFailure } from "../ai/error-classifier.mjs";
import {
  allowInMemoryReliabilityStore,
  durableStoreUnavailableError,
  logDurableStoreUnavailable,
} from "../reliability/env.mjs";

const ALLOWED_JOB_TYPES = new Set([
  "source-monitor",
  "lesson-source-monitor",
  "lesson-intelligence",
  "majlis-knowledge-engine",
  "content-scheduler",
  "auto-content-sync",
  "auto-knowledge-sync",
  "islamic-intelligence",
  "knowledge-reasoning",
  "verified-knowledge",
  "scholarly-verification",
  "ai-agents",
  "autonomous-platform",
  "autonomous-platform-recovery",
  "telegram-processor",
  "process-import-jobs",
  "knowledge-sync",
  "platform-bootstrap",
  "autonomous-orchestrator",
  "monitor-sources",
  "content-scoring",
  "global-reference-review",
  "researches-daily-import",
  "universities-review",
  "sync-data",
  "sync-fiqh-council",
  "import-phase2-trial",
  "governance-backup",
]);

/** @type {Map<string, any>} */
const memJobs = new Map();
/** @type {Map<string, any[]>} */
const memAttempts = new Map();
/** @type {Set<string>} */
const memRunningTypes = new Set();
/** @type {Map<string, any>} */
const memDeadLetters = new Map();

export function isAllowedJobType(jobType) {
  return ALLOWED_JOB_TYPES.has(String(jobType || ""));
}

export function listAllowedJobTypes() {
  return [...ALLOWED_JOB_TYPES].sort();
}

async function getPgPoolOrNull() {
  try {
    const mod = await import("../database.mjs");
    const pool = typeof mod.getPgPool === "function" ? await mod.getPgPool() : null;
    return pool || null;
  } catch (err) {
    logDurableStoreUnavailable("queue.pg", err?.message || err);
    return null;
  }
}

async function withPg(fn) {
  const pool = await getPgPoolOrNull();
  if (!pool) return null;
  try {
    return await fn(pool);
  } catch (err) {
    logDurableStoreUnavailable("queue.pg.query", err?.message || err);
    return null;
  }
}

function memoryDenied(op) {
  if (allowInMemoryReliabilityStore()) return null;
  logDurableStoreUnavailable("queue", op);
  return { ok: false, error: "durable_store_unavailable", durable: false };
}

/** @type {null | { next_retry_at: boolean, completed_at: boolean }} */
let columnSupportCache = null;

async function getColumnSupport(pool) {
  if (columnSupportCache) return columnSupportCache;
  try {
    const { rows } = await pool.query(
      `SELECT
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'background_jobs' AND column_name = 'next_retry_at'
         ) AS has_next_retry_at,
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'background_jobs' AND column_name = 'completed_at'
         ) AS has_completed_at`,
    );
    columnSupportCache = {
      next_retry_at: Boolean(rows[0]?.has_next_retry_at),
      completed_at: Boolean(rows[0]?.has_completed_at),
    };
  } catch {
    columnSupportCache = { next_retry_at: false, completed_at: false };
  }
  return columnSupportCache;
}

export function __resetColumnSupportCache() {
  columnSupportCache = null;
}

async function recordAttemptStart(pool, job) {
  if (!pool || !job?.job_id) return null;
  try {
    const { rows } = await pool.query(
      `INSERT INTO background_job_attempts (job_id, attempt_no, started_at)
       VALUES ($1, $2, now())
       RETURNING id`,
      [job.job_id, job.attempt_count || 1],
    );
    return rows[0]?.id || null;
  } catch {
    return null;
  }
}

async function recordAttemptFinish(pool, attemptId, { errorCode, errorMessage, summary } = {}) {
  if (!pool || !attemptId) return;
  try {
    await pool.query(
      `UPDATE background_job_attempts SET
         finished_at = now(),
         error_code = $2,
         error_message = $3,
         summary = COALESCE($4::jsonb, summary)
       WHERE id = $1`,
      [
        attemptId,
        errorCode || null,
        errorMessage ? String(errorMessage).slice(0, 500) : null,
        summary ? JSON.stringify(summary) : null,
      ],
    );
  } catch {
    /* attempts table may lag migration */
  }
}

/**
 * Enqueue or return existing job for (job_type, idempotency_key).
 */
export async function enqueueJob({ jobType, idempotencyKey, metadata = {}, maxAttempts = 5 }) {
  if (!isAllowedJobType(jobType)) {
    return { ok: false, error: "invalid_job_type" };
  }
  const key = String(idempotencyKey || "").trim();
  if (!key) return { ok: false, error: "missing_idempotency_key" };

  const fromDb = await withPg(async (pool) => {
    const existing = await pool.query(
      `SELECT job_id, status, attempt_count, idempotency_key, job_type, metadata
       FROM background_jobs
       WHERE job_type = $1 AND idempotency_key = $2`,
      [jobType, key],
    );
    if (existing.rows[0]) {
      await pool.query(`UPDATE background_jobs SET updated_at = now() WHERE job_id = $1`, [
        existing.rows[0].job_id,
      ]);
      return { row: existing.rows[0], duplicate: true };
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO background_jobs (job_type, idempotency_key, metadata, max_attempts, status)
         VALUES ($1, $2, $3::jsonb, $4, 'queued')
         RETURNING job_id, status, attempt_count, idempotency_key, job_type, metadata`,
        [jobType, key, JSON.stringify(metadata || {}), maxAttempts],
      );
      return { row: rows[0], duplicate: false };
    } catch (err) {
      if (err?.code === "23505") {
        const again = await pool.query(
          `SELECT job_id, status, attempt_count, idempotency_key, job_type, metadata
           FROM background_jobs
           WHERE job_type = $1 AND idempotency_key = $2`,
          [jobType, key],
        );
        if (again.rows[0]) return { row: again.rows[0], duplicate: true };
      }
      throw err;
    }
  });

  if (fromDb?.row) {
    return { ok: true, job: fromDb.row, durable: true, duplicate: fromDb.duplicate === true };
  }

  const denied = memoryDenied("enqueueJob");
  if (denied) return denied;

  const memKey = `${jobType}::${key}`;
  if (memJobs.has(memKey)) {
    return { ok: true, job: memJobs.get(memKey), durable: false, duplicate: true };
  }
  const job = {
    job_id: randomUUID(),
    job_type: jobType,
    status: "queued",
    idempotency_key: key,
    attempt_count: 0,
    max_attempts: maxAttempts,
    cursor: {},
    metadata,
    next_run_at: new Date().toISOString(),
    next_retry_at: null,
    completed_at: null,
    locked_at: null,
    locked_by: null,
    last_error_code: null,
  };
  memJobs.set(memKey, job);
  return { ok: true, job, durable: false, duplicate: false };
}

/**
 * Atomic claim of next ready job (SKIP LOCKED + expired lease reclaim).
 * Prevents two concurrent active leases for the same job_type.
 */
export async function claimNextJob({ workerId, jobTypes = null, leaseMs = 45_000 }) {
  const types = Array.isArray(jobTypes) && jobTypes.length ? jobTypes.filter(isAllowedJobType) : null;
  const pool = await getPgPoolOrNull();

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `WITH cte AS (
           SELECT j.job_id
           FROM background_jobs j
           WHERE (
               (j.status = 'queued' AND j.next_run_at <= now())
               OR (j.status = 'running' AND j.lease_expires_at IS NOT NULL AND j.lease_expires_at < now())
             )
             AND ($1::text[] IS NULL OR j.job_type = ANY($1::text[]))
             AND NOT EXISTS (
               SELECT 1 FROM background_jobs r
               WHERE r.job_type = j.job_type
                 AND r.status = 'running'
                 AND r.lease_expires_at IS NOT NULL
                 AND r.lease_expires_at > now()
                 AND r.job_id <> j.job_id
             )
             AND pg_try_advisory_xact_lock(hashtext('bgjob:' || j.job_type))
           ORDER BY j.next_run_at ASC
           FOR UPDATE OF j SKIP LOCKED
           LIMIT 1
         )
         UPDATE background_jobs j SET
           status = 'running',
           locked_at = now(),
           locked_by = $2,
           lease_expires_at = now() + ($3 || ' milliseconds')::interval,
           started_at = COALESCE(j.started_at, now()),
           attempt_count = CASE
             WHEN j.status = 'queued' THEN j.attempt_count + 1
             ELSE j.attempt_count
           END,
           updated_at = now()
         FROM cte WHERE j.job_id = cte.job_id
         RETURNING j.*`,
        [types, workerId, String(leaseMs)],
      );

      let job = rows[0] || null;
      if (job) {
        const cols = await getColumnSupport(client);
        if (cols.next_retry_at) {
          await client.query(`UPDATE background_jobs SET next_retry_at = NULL WHERE job_id = $1`, [
            job.job_id,
          ]);
        }
        const attemptId = await recordAttemptStart(client, job);
        job = { ...job, _attempt_id: attemptId };
      }
      await client.query("COMMIT");
      return job;
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore */
      }
      logDurableStoreUnavailable("queue.claim.query", err?.message || err);
      if (!allowInMemoryReliabilityStore()) {
        throw durableStoreUnavailableError("queue.claim");
      }
    } finally {
      client.release();
    }
  } else if (!allowInMemoryReliabilityStore()) {
    throw durableStoreUnavailableError("queue.claim");
  }

  const now = Date.now();
  for (const job of memJobs.values()) {
    if (types && !types.includes(job.job_type)) continue;
    const expired =
      job.status === "running" &&
      job.lease_expires_at &&
      new Date(job.lease_expires_at).getTime() < now;
    if (job.status === "running" && !expired) continue;
    if (job.status !== "queued" && !expired) continue;
    if (job.status === "queued" && job.next_run_at && new Date(job.next_run_at).getTime() > now) {
      continue;
    }
    if (memRunningTypes.has(job.job_type) && !expired) continue;

    job.status = "running";
    job.locked_by = workerId;
    job.locked_at = new Date(now).toISOString();
    job.lease_expires_at = new Date(now + leaseMs).toISOString();
    if (!expired) job.attempt_count += 1;
    job.next_retry_at = null;
    memRunningTypes.add(job.job_type);
    const attempts = memAttempts.get(job.job_id) || [];
    const attempt = {
      id: randomUUID(),
      attempt_no: job.attempt_count,
      started_at: new Date().toISOString(),
    };
    attempts.push(attempt);
    memAttempts.set(job.job_id, attempts);
    job._attempt_id = attempt.id;
    return job;
  }
  return null;
}

export async function checkpointJob(jobId, cursor) {
  const fromDb = await withPg(async (pool) => {
    await pool.query(
      `UPDATE background_jobs SET cursor = $2::jsonb, updated_at = now(),
         lease_expires_at = now() + interval '45 seconds'
       WHERE job_id = $1`,
      [jobId, JSON.stringify(cursor || {})],
    );
    return true;
  });
  if (fromDb) return;
  if (!allowInMemoryReliabilityStore()) {
    throw durableStoreUnavailableError("queue.checkpoint");
  }
  for (const job of memJobs.values()) {
    if (job.job_id === jobId) {
      job.cursor = cursor || {};
      job.lease_expires_at = new Date(Date.now() + 45_000).toISOString();
    }
  }
}

export async function completeJob(jobId, summary = {}, attemptId = null) {
  const fromDb = await withPg(async (pool) => {
    const cols = await getColumnSupport(pool);
    const extraSets = [];
    if (cols.completed_at) extraSets.push("completed_at = now()");
    if (cols.next_retry_at) extraSets.push("next_retry_at = NULL");
    const extraSql = extraSets.length ? `, ${extraSets.join(", ")}` : "";
    await pool.query(
      `UPDATE background_jobs SET
         status = 'succeeded',
         finished_at = now(),
         updated_at = now(),
         locked_at = NULL,
         locked_by = NULL,
         lease_expires_at = NULL,
         metadata = metadata || $2::jsonb
         ${extraSql}
       WHERE job_id = $1`,
      [jobId, JSON.stringify({ summary })],
    );
    await recordAttemptFinish(pool, attemptId, { summary });
    return true;
  });
  if (fromDb) return;
  if (!allowInMemoryReliabilityStore()) {
    throw durableStoreUnavailableError("queue.complete");
  }
  for (const job of memJobs.values()) {
    if (job.job_id === jobId) {
      job.status = "succeeded";
      job.finished_at = new Date().toISOString();
      job.completed_at = job.finished_at;
      job.locked_at = null;
      job.locked_by = null;
      job.lease_expires_at = null;
      memRunningTypes.delete(job.job_type);
      const attempts = memAttempts.get(jobId) || [];
      const a = attempts.find((x) => x.id === attemptId) || attempts[attempts.length - 1];
      if (a) {
        a.finished_at = new Date().toISOString();
        a.summary = summary;
      }
    }
  }
}

export async function failJob(jobId, { errorCode, errorMessage, forceDeadLetter = false, attemptId = null }) {
  const classified = errorCode ? { code: errorCode } : classifyAiError({ message: errorMessage });
  const code = errorCode || classified.code || "worker_error";
  const permanent =
    forceDeadLetter ||
    code === "no_worker_registered" ||
    code === "aborted" ||
    isPermanentAiFailure(code);

  const fromDb = await withPg(async (pool) => {
    const { rows } = await pool.query(`SELECT * FROM background_jobs WHERE job_id = $1`, [jobId]);
    const job = rows[0];
    if (!job) return true;
    await recordAttemptFinish(pool, attemptId || null, {
      errorCode: code,
      errorMessage,
    });
    const cols = await getColumnSupport(pool);
    const dead = permanent || job.attempt_count >= job.max_attempts;
    if (dead) {
      const deadExtra = [];
      if (cols.completed_at) deadExtra.push("completed_at = NULL");
      if (cols.next_retry_at) deadExtra.push("next_retry_at = NULL");
      const deadExtraSql = deadExtra.length ? `, ${deadExtra.join(", ")}` : "";
      await pool.query(
        `UPDATE background_jobs SET
           status = 'dead_letter',
           finished_at = now(),
           last_error_code = $2,
           last_error_message = $3,
           locked_at = NULL,
           locked_by = NULL,
           lease_expires_at = NULL,
           updated_at = now()
           ${deadExtraSql}
         WHERE job_id = $1`,
        [jobId, code, String(errorMessage || "").slice(0, 500)],
      );
      await pool.query(
        `INSERT INTO background_job_dead_letters (job_id, job_type, last_error_code, last_error_message, payload)
         VALUES ($1,$2,$3,$4,$5::jsonb)
         ON CONFLICT (job_id) DO UPDATE SET
           last_error_code = EXCLUDED.last_error_code,
           last_error_message = EXCLUDED.last_error_message,
           payload = EXCLUDED.payload`,
        [jobId, job.job_type, code, String(errorMessage || "").slice(0, 500), JSON.stringify(job.metadata || {})],
      );
    } else {
      const delaySec = Math.min(3600, 2 ** job.attempt_count * 30);
      const retryExtra = cols.next_retry_at
        ? ", next_retry_at = now() + ($2 || ' seconds')::interval"
        : "";
      await pool.query(
        `UPDATE background_jobs SET
           status = 'queued',
           next_run_at = now() + ($2 || ' seconds')::interval,
           last_error_code = $3,
           last_error_message = $4,
           locked_at = NULL,
           locked_by = NULL,
           lease_expires_at = NULL,
           updated_at = now()
           ${retryExtra}
         WHERE job_id = $1`,
        [jobId, String(delaySec), code, String(errorMessage || "").slice(0, 500)],
      );
    }
    return true;
  });
  if (fromDb) return;
  if (!allowInMemoryReliabilityStore()) {
    throw durableStoreUnavailableError("queue.fail");
  }
  for (const job of memJobs.values()) {
    if (job.job_id !== jobId) continue;
    memRunningTypes.delete(job.job_type);
    const attempts = memAttempts.get(jobId) || [];
    const a = attempts.find((x) => x.id === attemptId) || attempts[attempts.length - 1];
    if (a) {
      a.finished_at = new Date().toISOString();
      a.error_code = code;
      a.error_message = String(errorMessage || "").slice(0, 500);
    }
    const dead = permanent || job.attempt_count >= job.max_attempts;
    job.status = dead ? "dead_letter" : "queued";
    job.last_error_code = code;
    job.last_error_message = String(errorMessage || "").slice(0, 500);
    job.locked_at = null;
    job.locked_by = null;
    job.lease_expires_at = null;
    if (dead) {
      memDeadLetters.set(jobId, {
        job_id: jobId,
        job_type: job.job_type,
        last_error_code: code,
        last_error_message: job.last_error_message,
      });
      job.finished_at = new Date().toISOString();
      job.next_retry_at = null;
    } else {
      const delayMs = Math.min(3600, 2 ** job.attempt_count * 30) * 1000;
      job.next_run_at = new Date(Date.now() + delayMs).toISOString();
      job.next_retry_at = job.next_run_at;
    }
  }
}

export function __resetJobMemory() {
  memJobs.clear();
  memAttempts.clear();
  memRunningTypes.clear();
  memDeadLetters.clear();
  columnSupportCache = null;
}

export function __getMemAttempts(jobId) {
  return memAttempts.get(jobId) || [];
}

export function __getMemDeadLetter(jobId) {
  return memDeadLetters.get(jobId) || null;
}
