#!/usr/bin/env node
/**
 * PostgreSQL integration: fresh public schema → full migration chain → queue tests.
 * Requires MIGRATION_TEST_DATABASE_URL (or DATABASE_URL). Skips unless set,
 * unless REQUIRE_POSTGRES_INTEGRATION=1.
 * Never connects to Production-looking hosts without ALLOW_PROD_MIGRATION_TEST=1.
 */
import assert from "node:assert/strict";
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
    [
      "qa_categories.sort_order",
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema='public' AND table_name='qa_categories' AND column_name='sort_order'
       ) AS ok`,
    ],
  ];
  for (const [name, q] of checks) {
    const { rows } = await client.query(q);
    assert.equal(rows[0]?.ok, true, `required after migration chain: ${name}`);
  }
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
  const critical = ["qa_phase4_seed.sql", "enterprise_reliability_p0_v1.sql"];
  for (const file of critical) {
    const row = results.find((r) => r.file === file);
    assert.ok(row, `migration result missing for ${file}`);
    if (!row.ok) {
      // Surface root cause clearly — do not invent stub tables
      throw new Error(`critical migration failed: ${file}: ${row.error}`);
    }
  }

  await assertSchema(admin);

  // Re-verify chain / P0 idempotency without schema wipe
  const p0 = results.find((r) => r.file === "enterprise_reliability_p0_v1.sql");
  assert.ok(p0?.ok, "enterprise_reliability_p0_v1 must succeed on fresh DB");
  const { readFileSync } = await import("node:fs");
  const p0Sql = readFileSync(
    join(root, "artifacts/majalis/supabase/enterprise_reliability_p0_v1.sql"),
    "utf8",
  );
  await admin.query(p0Sql);
  await assertSchema(admin);

  await admin.query(`DELETE FROM background_job_dead_letters`);
  await admin.query(`DELETE FROM background_job_attempts`);
  await admin.query(`DELETE FROM background_jobs`);

  // Reproduce process-import-jobs watchdog: jsonb_build_array($2) type inference.
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
} finally {
  await admin.end();
}

const { enqueueJob, claimNextJob, checkpointJob, completeJob, failJob } = await import(
  join(root, "artifacts/majalis/lib/jobs/queue.mjs")
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

console.log("postgres-integration: ok");
