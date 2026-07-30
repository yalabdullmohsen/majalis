#!/usr/bin/env node
/**
 * PostgreSQL integration tests for durable queue (SKIP LOCKED, lease, idempotency).
 * Requires MIGRATION_TEST_DATABASE_URL. Skips cleanly when unset (exit 0) unless
 * REQUIRE_POSTGRES_INTEGRATION=1.
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

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
delete process.env.ALLOW_IN_MEMORY_RELIABILITY_STORE;
// Prevent Supabase/Vercel secrets from rewriting local CI URLs via pooler normalizer
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
]) {
  delete process.env[k];
}

const require = createRequire(join(root, "artifacts", "majalis", "package.json"));
const pg = require("pg");

const sqlPath = join(root, "artifacts", "majalis", "supabase", "enterprise_reliability_p0_v1.sql");
const hardenPath = join(
  root,
  "artifacts",
  "majalis",
  "supabase",
  "background_jobs_runtime_hardening_v1.sql",
);
assert.ok(existsSync(sqlPath));
assert.ok(existsSync(hardenPath));

const admin = new pg.Client({ connectionString: url });
await admin.connect();
await admin.query(readFileSync(sqlPath, "utf8"));
// qa_categories may not exist on empty DB — create stub for sort_order check path
await admin.query(`
  CREATE TABLE IF NOT EXISTS qa_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text
  );
`);
await admin.query(readFileSync(sqlPath, "utf8"));
await admin.query(readFileSync(hardenPath, "utf8"));
await admin.query(`DELETE FROM background_job_dead_letters`);
await admin.query(`DELETE FROM background_job_attempts`);
await admin.query(`DELETE FROM background_jobs`);
await admin.end();

const { enqueueJob, claimNextJob, checkpointJob, completeJob, failJob } = await import(
  "../artifacts/majalis/lib/jobs/queue.mjs"
);

const key = `it-${Date.now()}`;
const a = await enqueueJob({ jobType: "source-monitor", idempotencyKey: key, metadata: { t: 1 } });
const b = await enqueueJob({ jobType: "source-monitor", idempotencyKey: key, metadata: { t: 2 } });
assert.equal(a.ok, true);
assert.equal(a.durable, true);
assert.equal(a.job.job_id, b.job.job_id);

const [w1, w2] = await Promise.all([
  claimNextJob({ workerId: "w1", leaseMs: 30_000 }),
  claimNextJob({ workerId: "w2", leaseMs: 30_000 }),
]);
const claimed = [w1, w2].filter(Boolean);
assert.equal(claimed.length, 1, "only one worker claims");

const job = claimed[0];
await checkpointJob(job.job_id, { cursor: 5 });
await failJob(job.job_id, { errorCode: "provider_unavailable", errorMessage: "temp" });

const force = new pg.Client({ connectionString: url });
await force.connect();
await force.query(`UPDATE background_jobs SET next_run_at = now() - interval '1 second' WHERE job_id = $1`, [
  job.job_id,
]);
await force.end();

const reclaimed = await claimNextJob({ workerId: "w4", leaseMs: 2_000 });
assert.ok(reclaimed, "reclaim after backoff");
assert.equal(reclaimed.job_id, job.job_id);

await failJob(reclaimed.job_id, {
  errorCode: "credit_exhausted",
  errorMessage: "no credits",
});

const deadClient = new pg.Client({ connectionString: url });
await deadClient.connect();
const { rows } = await deadClient.query(`SELECT status FROM background_jobs WHERE job_id = $1`, [
  reclaimed.job_id,
]);
assert.equal(rows[0].status, "dead_letter");
const { rows: dl } = await deadClient.query(
  `SELECT 1 FROM background_job_dead_letters WHERE job_id = $1`,
  [reclaimed.job_id],
);
assert.equal(dl.length, 1);
await deadClient.end();

const leaseKey = `lease-${Date.now()}`;
const enq = await enqueueJob({ jobType: "lesson-source-monitor", idempotencyKey: leaseKey });
assert.equal(enq.durable, true);
const c1 = await claimNextJob({ workerId: "lease-a", leaseMs: 1 });
assert.ok(c1);
await new Promise((r) => setTimeout(r, 50));
const leaseDb = new pg.Client({ connectionString: url });
await leaseDb.connect();
await leaseDb.query(
  `UPDATE background_jobs SET lease_expires_at = now() - interval '1 second' WHERE job_id = $1`,
  [c1.job_id],
);
await leaseDb.end();
const c2 = await claimNextJob({ workerId: "lease-b", leaseMs: 10_000 });
assert.ok(c2);
assert.equal(c2.job_id, c1.job_id);
assert.equal(c2.locked_by, "lease-b");
await completeJob(c2.job_id, { ok: true });

// Same job_type concurrency: second queued job must not claim while first lease is active
const typeKey = `type-${Date.now()}`;
await enqueueJob({ jobType: "sync-data", idempotencyKey: `${typeKey}-a` });
await enqueueJob({ jobType: "sync-data", idempotencyKey: `${typeKey}-b` });
const t1 = await claimNextJob({ workerId: "type-a", leaseMs: 30_000 });
assert.ok(t1);
const t2 = await claimNextJob({ workerId: "type-b", leaseMs: 30_000 });
assert.equal(t2, null, "same job_type concurrent claim blocked");
const attemptRows = await (async () => {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  const { rows } = await c.query(`SELECT * FROM background_job_attempts WHERE job_id = $1`, [t1.job_id]);
  await c.end();
  return rows;
})();
assert.ok(attemptRows.length >= 1, "attempt row recorded");
await completeJob(t1.job_id, { ok: true }, t1._attempt_id);
const t3 = await claimNextJob({ workerId: "type-c", leaseMs: 30_000 });
assert.ok(t3, "second job claimable after first completes");
await completeJob(t3.job_id, { ok: true }, t3._attempt_id);

// Hardening columns present
{
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  const { rows } = await c.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'background_jobs' AND column_name IN ('next_retry_at','completed_at')`,
  );
  assert.equal(rows.length, 2, "hardening columns present");
  await c.end();
}

console.log("postgres-integration: ok");
