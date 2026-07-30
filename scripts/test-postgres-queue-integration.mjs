#!/usr/bin/env node
/**
 * PostgreSQL integration: fresh public schema → full migration chain → queue tests.
 * Requires MIGRATION_TEST_DATABASE_URL (or DATABASE_URL). Skips unless set,
 * unless REQUIRE_POSTGRES_INTEGRATION=1.
 * Never connects to Production-looking hosts without ALLOW_PROD_MIGRATION_TEST=1.
 * Memory fallback must not make these tests pass.
 */
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = process.env.MIGRATION_TEST_DATABASE_URL || process.env.DATABASE_URL || "";

if (!url) {
  if (process.env.REQUIRE_POSTGRES_INTEGRATION === "1") {
    console.error("MIGRATION_TEST_DATABASE_URL required");
    process.exit(1);
  }
  console.log("postgres-integration: SKIPPED (no MIGRATION_TEST_DATABASE_URL)");
  process.exit(0);
}

if (/amazonaws\.com|supabase\.co/i.test(url) && process.env.ALLOW_PROD_MIGRATION_TEST !== "1") {
  console.error("Refusing Production-looking DATABASE_URL");
  process.exit(1);
}

process.env.DATABASE_URL = url;
process.env.MIGRATION_TEST_DATABASE_URL = url;
process.env.NODE_ENV = "test";
// Force durable path — memory must not satisfy assertions.
delete process.env.ALLOW_IN_MEMORY_RELIABILITY_STORE;
process.env.VERCEL_ENV = "production";
for (const k of [
  "SUPABASE_DB_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_HOST",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_DATABASE",
  "PGHOST",
  "PGUSER",
  "PGPASSWORD",
  "PGDATABASE",
  "SUPABASE_DB_PASSWORD",
  "DB_PASSWORD",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_MANAGEMENT_TOKEN",
  "SUPABASE_PAT",
]) {
  delete process.env[k];
}

const require = createRequire(join(root, "artifacts", "majalis", "package.json"));
const pg = require("pg");

const { applyMigrations } = await import(
  join(root, "artifacts/majalis/lib/db-migrate.mjs")
);
const { MIGRATION_FILES } = await import(
  join(root, "artifacts/majalis/lib/migration-paths.mjs")
);

async function resetPublic(client) {
  await client.query("DROP SCHEMA IF EXISTS public CASCADE");
  await client.query("CREATE SCHEMA public");
  await client.query("GRANT ALL ON SCHEMA public TO public");
}

async function assertSchema(client) {
  const checks = [
    ["qa_categories", `SELECT to_regclass('public.qa_categories') IS NOT NULL AS ok`],
    ["ai_provider_circuit", `SELECT to_regclass('public.ai_provider_circuit') IS NOT NULL AS ok`],
    ["background_jobs", `SELECT to_regclass('public.background_jobs') IS NOT NULL AS ok`],
    ["background_job_attempts", `SELECT to_regclass('public.background_job_attempts') IS NOT NULL AS ok`],
    ["background_job_dead_letters", `SELECT to_regclass('public.background_job_dead_letters') IS NOT NULL AS ok`],
    [
      "qa_categories.sort_order",
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema='public' AND table_name='qa_categories' AND column_name='sort_order'
       ) AS ok`,
    ],
    [
      "background_jobs.next_retry_at",
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema='public' AND table_name='background_jobs' AND column_name='next_retry_at'
       ) AS ok`,
    ],
    [
      "background_jobs.completed_at",
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema='public' AND table_name='background_jobs' AND column_name='completed_at'
       ) AS ok`,
    ],
  ];
  for (const [name, q] of checks) {
    const { rows } = await client.query(q);
    assert.equal(rows[0]?.ok, true, `required after migration chain: ${name}`);
  }
}

function assertNoRuntimeDdlInQueueSource() {
  const src = readFileSync(join(root, "artifacts/majalis/lib/jobs/queue.mjs"), "utf8");
  assert.doesNotMatch(src, /\b(CREATE|ALTER|DROP)\s+(TABLE|INDEX|COLUMN)\b/i, "queue must not embed Runtime DDL");
  const worker = readFileSync(
    join(root, "artifacts/majalis/lib/api-handlers/cron/job-worker.js"),
    "utf8",
  );
  assert.doesNotMatch(worker, /\b(CREATE|ALTER|DROP)\s+TABLE\b/i, "job-worker must not run DDL");
  const readyz = readFileSync(join(root, "artifacts/majalis/lib/api-handlers/readyz.js"), "utf8");
  assert.doesNotMatch(readyz, /\b(CREATE|ALTER|DROP)\s+TABLE\b/i, "readyz must not run DDL");
}

const admin = new pg.Client({ connectionString: url, connectionTimeoutMillis: 15_000 });
await admin.connect();
try {
  console.log("postgres-integration: resetting public schema…");
  await resetPublic(admin);

  console.log(`postgres-integration: applying ${MIGRATION_FILES.length} migrations via applyMigrations…`);
  const chain = await applyMigrations({
    files: MIGRATION_FILES,
    continueOnError: true,
    trackApplied: false,
  });
  const results = chain.results || [];
  const critical = [
    "qa_phase4_seed.sql",
    "enterprise_reliability_p0_v1.sql",
    "background_jobs_runtime_hardening_v1.sql",
  ];
  for (const file of critical) {
    const row = results.find((r) => r.file === file);
    assert.ok(row, `migration result missing for ${file}`);
    if (!row.ok) {
      throw new Error(`critical migration failed: ${file}: ${row.error}`);
    }
  }

  await assertSchema(admin);

  const p0 = results.find((r) => r.file === "enterprise_reliability_p0_v1.sql");
  assert.ok(p0?.ok, "enterprise_reliability_p0_v1 must succeed on fresh DB");
  const p0Sql = readFileSync(
    join(root, "artifacts/majalis/supabase/enterprise_reliability_p0_v1.sql"),
    "utf8",
  );
  await admin.query(p0Sql);
  await assertSchema(admin);

  await admin.query(`DELETE FROM background_job_dead_letters`);
  await admin.query(`DELETE FROM background_job_attempts`);
  await admin.query(`DELETE FROM background_jobs`);

  // Parameter typing regression (process-import-jobs watchdog).
  {
    let untypedFailed = false;
    try {
      await admin.query(
        `SELECT jsonb_build_array($2)
         WHERE $1::text[] IS NOT NULL
           AND $3::timestamptz IS NOT NULL`,
        [["running", "processing"], "watchdog reason", new Date().toISOString()],
      );
    } catch (err) {
      untypedFailed = /could not determine data type of parameter \$2/i.test(String(err?.message || err));
    }
    assert.equal(untypedFailed, true, "untyped jsonb_build_array($2) must fail (reproduction)");

    const { rows: typedRows } = await admin.query(
      `SELECT jsonb_build_array($2::text) AS errs
       WHERE $1::text[] IS NOT NULL
         AND $3::timestamptz IS NOT NULL`,
      [["running", "processing"], "watchdog reason", new Date().toISOString()],
    );
    assert.equal(typedRows[0]?.errs?.[0], "watchdog reason", "$2::text cast must succeed");
  }

  assertNoRuntimeDdlInQueueSource();
} finally {
  await admin.end();
}

const {
  enqueueJob,
  claimNextJob,
  checkpointJob,
  completeJob,
  failJob,
  __resetColumnSupportCache,
} = await import(join(root, "artifacts/majalis/lib/jobs/queue.mjs"));
__resetColumnSupportCache?.();

const db = () => new pg.Client({ connectionString: url });

// 1) enqueue
const key = `it-${Date.now()}`;
const a = await enqueueJob({ jobType: "source-monitor", idempotencyKey: key, metadata: { t: 1 } });
assert.equal(a.ok, true, "enqueue ok");
assert.equal(a.durable, true, "1. enqueue must be durable (no memory fallback)");
assert.ok(a.job?.job_id);

// 2) idempotency
const b = await enqueueJob({ jobType: "source-monitor", idempotencyKey: key, metadata: { t: 2 } });
assert.equal(b.ok, true);
assert.equal(b.durable, true);
assert.equal(a.job.job_id, b.job.job_id, "2. idempotency returns same job");
assert.equal(b.duplicate, true);

// 3) concurrent claim — only one wins
const [w1, w2] = await Promise.all([
  claimNextJob({ workerId: "w1", leaseMs: 30_000 }),
  claimNextJob({ workerId: "w2", leaseMs: 30_000 }),
]);
const claimed = [w1, w2].filter(Boolean);
assert.equal(claimed.length, 1, "3. only one worker claims under concurrency");
const job = claimed[0];
assert.equal(job.status, "running");
assert.ok(job.locked_by === "w1" || job.locked_by === "w2");
assert.equal(job.attempt_count, 1);

// 5) checkpoint with cursor + lease heartbeat
await checkpointJob(job.job_id, { step: 5, page: 2 }, { leaseMs: 15_000 });
{
  const c = db();
  await c.connect();
  const { rows } = await c.query(
    `SELECT cursor, lease_expires_at, status FROM background_jobs WHERE job_id = $1`,
    [job.job_id],
  );
  assert.equal(rows[0].status, "running");
  assert.equal(rows[0].cursor?.step, 5);
  assert.ok(rows[0].lease_expires_at);
  await c.end();
}

// Soft abort must re-queue (not DLQ)
await failJob(job.job_id, {
  errorCode: "aborted",
  errorMessage: "worker_deadline",
  attemptId: job._attempt_id,
});
{
  const c = db();
  await c.connect();
  const { rows } = await c.query(`SELECT status, next_retry_at, next_run_at FROM background_jobs WHERE job_id = $1`, [
    job.job_id,
  ]);
  assert.equal(rows[0].status, "queued", "aborted soft-stop must re-queue");
  assert.notEqual(rows[0].status, "dead_letter");
  await c.query(`UPDATE background_jobs SET next_run_at = now() - interval '1 second', next_retry_at = now() - interval '1 second' WHERE job_id = $1`, [
    job.job_id,
  ]);
  await c.end();
}

// 7/8) failure increments attempt; retry sets next_retry_at
const afterSoft = await claimNextJob({ workerId: "w-retry", leaseMs: 30_000 });
assert.ok(afterSoft);
assert.equal(afterSoft.job_id, job.job_id);
assert.equal(afterSoft.attempt_count, 2, "7. attempt_count increments on re-claim from queued");
await failJob(afterSoft.job_id, {
  errorCode: "provider_unavailable",
  errorMessage: "temp",
  attemptId: afterSoft._attempt_id,
});
{
  const c = db();
  await c.connect();
  const { rows } = await c.query(
    `SELECT status, attempt_count, next_retry_at, next_run_at, last_error_code
     FROM background_jobs WHERE job_id = $1`,
    [afterSoft.job_id],
  );
  assert.equal(rows[0].status, "queued", "8. retry re-queues");
  assert.equal(rows[0].last_error_code, "provider_unavailable");
  assert.ok(rows[0].next_retry_at || rows[0].next_run_at, "8. next_retry_at/next_run_at set");
  await c.query(
    `UPDATE background_jobs SET next_run_at = now() - interval '1 second', next_retry_at = now() - interval '1 second' WHERE job_id = $1`,
    [afterSoft.job_id],
  );
  await c.end();
}

const reclaimed = await claimNextJob({ workerId: "w4", leaseMs: 2_000 });
assert.ok(reclaimed, "reclaim after backoff");
assert.equal(reclaimed.job_id, job.job_id);

// 9) dead-letter after permanent / max attempts
await failJob(reclaimed.job_id, {
  errorCode: "credit_exhausted",
  errorMessage: "no credits",
  attemptId: reclaimed._attempt_id,
});
{
  const c = db();
  await c.connect();
  const { rows } = await c.query(`SELECT status FROM background_jobs WHERE job_id = $1`, [reclaimed.job_id]);
  assert.equal(rows[0].status, "dead_letter", "9. permanent failure → dead_letter");
  const { rows: dl } = await c.query(`SELECT 1 FROM background_job_dead_letters WHERE job_id = $1`, [
    reclaimed.job_id,
  ]);
  assert.equal(dl.length, 1, "9. DLQ row present");
  // 10) cascade: attempts exist for job (FK ON DELETE CASCADE verified by schema + rows)
  const { rows: attempts } = await c.query(
    `SELECT id FROM background_job_attempts WHERE job_id = $1 ORDER BY attempt_no`,
    [reclaimed.job_id],
  );
  assert.ok(attempts.length >= 1, "10. attempts recorded");
  await c.query(`DELETE FROM background_jobs WHERE job_id = $1`, [reclaimed.job_id]);
  const { rows: attemptsAfter } = await c.query(
    `SELECT id FROM background_job_attempts WHERE job_id = $1`,
    [reclaimed.job_id],
  );
  assert.equal(attemptsAfter.length, 0, "10. CASCADE deletes attempts with job");
  const { rows: dlAfter } = await c.query(
    `SELECT 1 FROM background_job_dead_letters WHERE job_id = $1`,
    [reclaimed.job_id],
  );
  assert.equal(dlAfter.length, 0, "10. CASCADE deletes dead letters with job");
  await c.end();
}

// 4) lease expiry then reclaim (without burning attempt on reclaim of running)
const leaseKey = `lease-${Date.now()}`;
const enq = await enqueueJob({
  jobType: "lesson-source-monitor",
  idempotencyKey: leaseKey,
  maxAttempts: 5,
});
assert.equal(enq.durable, true);
const c1 = await claimNextJob({ workerId: "lease-a", leaseMs: 60_000 });
assert.ok(c1);
assert.equal(c1.attempt_count, 1);
{
  const c = db();
  await c.connect();
  await c.query(
    `UPDATE background_jobs SET lease_expires_at = now() - interval '1 second' WHERE job_id = $1`,
    [c1.job_id],
  );
  await c.end();
}
const c2 = await claimNextJob({ workerId: "lease-b", leaseMs: 10_000 });
assert.ok(c2, "4. reclaim after lease expiry");
assert.equal(c2.job_id, c1.job_id);
assert.equal(c2.locked_by, "lease-b");
assert.equal(c2.attempt_count, 1, "4. reclaim of running lease must not increment attempt_count");

// 6) success + completed_at
await checkpointJob(c2.job_id, { done_partial: true }, { leaseMs: 10_000 });
await completeJob(c2.job_id, { ok: true }, c2._attempt_id);
{
  const c = db();
  await c.connect();
  const { rows } = await c.query(
    `SELECT status, completed_at, finished_at, locked_by, lease_expires_at
     FROM background_jobs WHERE job_id = $1`,
    [c2.job_id],
  );
  assert.equal(rows[0].status, "succeeded");
  assert.ok(rows[0].completed_at, "6. completed_at set on success");
  assert.ok(rows[0].finished_at);
  assert.equal(rows[0].locked_by, null);
  assert.equal(rows[0].lease_expires_at, null);
  await c.end();
}

// 9b) max_attempts path → DLQ
const maxKey = `max-${Date.now()}`;
const maxEnq = await enqueueJob({
  jobType: "sync-data",
  idempotencyKey: maxKey,
  maxAttempts: 2,
});
assert.equal(maxEnq.durable, true);
let mj = await claimNextJob({ workerId: "max-1", leaseMs: 10_000 });
assert.ok(mj);
await failJob(mj.job_id, { errorCode: "network_error", errorMessage: "e1", attemptId: mj._attempt_id });
{
  const c = db();
  await c.connect();
  await c.query(
    `UPDATE background_jobs SET next_run_at = now() - interval '1 second', next_retry_at = now() - interval '1 second' WHERE job_id = $1`,
    [mj.job_id],
  );
  await c.end();
}
mj = await claimNextJob({ workerId: "max-2", leaseMs: 10_000 });
assert.ok(mj);
assert.equal(mj.attempt_count, 2);
await failJob(mj.job_id, { errorCode: "network_error", errorMessage: "e2", attemptId: mj._attempt_id });
{
  const c = db();
  await c.connect();
  const { rows } = await c.query(`SELECT status FROM background_jobs WHERE job_id = $1`, [mj.job_id]);
  assert.equal(rows[0].status, "dead_letter", "9. max_attempts → dead_letter");
  await c.end();
}

// 11) interval parameter typing on claim/checkpoint paths (no throw)
const typeKey = `type-${Date.now()}`;
const typed = await enqueueJob({ jobType: "monitor-sources", idempotencyKey: typeKey });
assert.equal(typed.durable, true);
const tj = await claimNextJob({ workerId: "type-w", leaseMs: 12_345 });
assert.ok(tj);
await checkpointJob(tj.job_id, { cursor: 1 }, { leaseMs: 12_345 });
await completeJob(tj.job_id, { typed: true }, tj._attempt_id);

console.log("postgres-integration: ok");
