/**
 * Durable background job queue (Postgres).
 * Memory adapter only when ALLOW_IN_MEMORY_RELIABILITY_STORE=1 or NODE_ENV=test.
 * Production: fail closed if Postgres unavailable.
 */

import { randomUUID } from "node:crypto";
import { isPermanentAiFailure } from "../ai/error-classifier.mjs";
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
    const { rows } = await pool.query(
      `INSERT INTO background_jobs (job_type, idempotency_key, metadata, max_attempts, status)
       VALUES ($1, $2, $3::jsonb, $4, 'queued')
       ON CONFLICT (job_type, idempotency_key) DO UPDATE
         SET updated_at = now()
       RETURNING job_id, status, attempt_count, idempotency_key, job_type`,
      [jobType, key, JSON.stringify(metadata || {}), maxAttempts],
    );
    return rows[0];
  });

  if (fromDb) {
    return { ok: true, job: fromDb, durable: true };
  }

  const denied = memoryDenied("enqueueJob");
  if (denied) return denied;

  const memKey = `${jobType}::${key}`;
  if (memJobs.has(memKey)) {
    return { ok: true, job: memJobs.get(memKey), durable: false };
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
  };
  memJobs.set(memKey, job);
  return { ok: true, job, durable: false };
}

/**
 * Atomic claim of next ready job (SKIP LOCKED + expired lease reclaim).
 */
export async function claimNextJob({ workerId, jobTypes = null, leaseMs = 45_000 }) {
  const types = Array.isArray(jobTypes) && jobTypes.length ? jobTypes.filter(isAllowedJobType) : null;
  const pool = await getPgPoolOrNull();

  if (pool) {
    try {
      const { rows } = await pool.query(
        `WITH cte AS (
           SELECT job_id FROM background_jobs
           WHERE (
               (status = 'queued' AND next_run_at <= now())
               OR (status = 'running' AND lease_expires_at IS NOT NULL AND lease_expires_at < now())
             )
             AND ($1::text[] IS NULL OR job_type = ANY($1::text[]))
           ORDER BY next_run_at ASC
           FOR UPDATE SKIP LOCKED
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
      return rows[0] || null;
    } catch (err) {
      logDurableStoreUnavailable("queue.claim.query", err?.message || err);
      if (!allowInMemoryReliabilityStore()) {
        throw durableStoreUnavailableError("queue.claim");
      }
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
    if (job.status !== "queued" && !expired) continue;
    job.status = "running";
    job.locked_by = workerId;
    job.lease_expires_at = new Date(now + leaseMs).toISOString();
    if (!expired) job.attempt_count += 1;
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

export async function completeJob(jobId, summary = {}) {
  const fromDb = await withPg(async (pool) => {
    await pool.query(
      `UPDATE background_jobs SET status = 'succeeded', finished_at = now(), updated_at = now(),
         locked_at = NULL, locked_by = NULL, lease_expires_at = NULL,
         metadata = metadata || $2::jsonb
       WHERE job_id = $1`,
      [jobId, JSON.stringify({ summary })],
    );
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
    }
  }
}

export async function failJob(jobId, { errorCode, errorMessage, forceDeadLetter = false }) {
  const permanent =
    forceDeadLetter ||
    errorCode === "no_worker_registered" ||
    isPermanentAiFailure(errorCode);
  const fromDb = await withPg(async (pool) => {
    const { rows } = await pool.query(`SELECT * FROM background_jobs WHERE job_id = $1`, [jobId]);
    const job = rows[0];
    if (!job) return true;
    const dead = permanent || job.attempt_count >= job.max_attempts;
    if (dead) {
      await pool.query(
        `UPDATE background_jobs SET status = 'dead_letter', finished_at = now(),
           last_error_code = $2, last_error_message = $3, updated_at = now()
         WHERE job_id = $1`,
        [jobId, errorCode, String(errorMessage || "").slice(0, 500)],
      );
      await pool.query(
        `INSERT INTO background_job_dead_letters (job_id, job_type, last_error_code, last_error_message, payload)
         VALUES ($1,$2,$3,$4,$5::jsonb)
         ON CONFLICT (job_id) DO NOTHING`,
        [jobId, job.job_type, errorCode, String(errorMessage || "").slice(0, 500), JSON.stringify(job.metadata || {})],
      );
    } else {
      const delaySec = Math.min(3600, 2 ** job.attempt_count * 30);
      await pool.query(
        `UPDATE background_jobs SET status = 'queued',
           next_run_at = now() + ($2 || ' seconds')::interval,
           last_error_code = $3, last_error_message = $4,
           locked_at = NULL, locked_by = NULL, lease_expires_at = NULL, updated_at = now()
         WHERE job_id = $1`,
        [jobId, String(delaySec), errorCode, String(errorMessage || "").slice(0, 500)],
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
    const dead = permanent || job.attempt_count >= job.max_attempts;
    job.status = dead ? "dead_letter" : "queued";
    job.last_error_code = errorCode;
    if (!dead) {
      job.next_run_at = new Date(Date.now() + Math.min(3600, 2 ** job.attempt_count * 30) * 1000).toISOString();
    }
  }
}

export function __resetJobMemory() {
  memJobs.clear();
}
