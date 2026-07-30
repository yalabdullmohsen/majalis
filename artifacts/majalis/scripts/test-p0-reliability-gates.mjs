/**
 * Gate: runtime schema migration must be blocked by default; HTTP sendJson guards headersSent.
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const applyMig = readFileSync(join(root, "lib/api-handlers/cron/apply-migrations.js"), "utf8");
const http = readFileSync(join(root, "lib/api/_http.mjs"), "utf8");
const dispatch = readFileSync(join(root, "lib/api-dispatch.mjs"), "utf8");
const extractor = readFileSync(join(root, "lib/cms/lesson-extractor.mjs"), "utf8");
const sql = readFileSync(join(root, "supabase/enterprise_reliability_p0_v1.sql"), "utf8");
const supabaseTs = readFileSync(join(root, "src/lib/supabase.ts"), "utf8");

assert.match(applyMig, /runtime_schema_migrations_disabled/, "apply-migrations must block schema writes");
assert.match(applyMig, /schemaMutationBlocked|Runtime schema migrations are permanently disabled/, "blocked response required");
assert.doesNotMatch(applyMig, /ALLOW_RUNTIME_SCHEMA_MIGRATIONS/, "no runtime DDL escape hatch");
assert.doesNotMatch(applyMig, /applyMigrations\(/, "must not call applyMigrations at runtime");
assert.match(http, /headersSent|isResponseClosed/, "safe sendJson required");
assert.match(dispatch, /createRequestContext/, "dispatch must abort on timeout");
assert.match(dispatch, /CRON_HANDLER_TIMEOUT_MS = 12_000/, "cron HTTP timeout shortened");
assert.match(extractor, /runAiCall/, "lesson-extractor uses provider client");
assert.match(sql, /ai_provider_circuit/, "migration creates AI circuit table");
assert.match(sql, /background_jobs/, "migration creates job queue");
assert.match(sql, /sort_order/, "migration adds qa_categories.sort_order");

const hardenSql = readFileSync(join(root, "supabase/background_jobs_runtime_hardening_v1.sql"), "utf8");
assert.match(hardenSql, /next_retry_at/, "hardening adds next_retry_at");
assert.match(hardenSql, /completed_at/, "hardening adds completed_at");
assert.ok(
  existsSync(join(root, "supabase/background_jobs_runtime_hardening_v1_ROLLBACK.sql")),
  "hardening rollback required",
);

const workers = readFileSync(join(root, "lib/jobs/job-workers.mjs"), "utf8");
assert.match(workers, /"lesson-intelligence"/, "lesson-intelligence worker registered");
assert.match(workers, /"sync-data"/, "sync-data worker registered");
assert.match(workers, /"governance-backup"/, "governance-backup worker registered");

const enqueue = readFileSync(join(root, "lib/jobs/cron-enqueue.mjs"), "utf8");
assert.match(enqueue, /no_worker_registered/, "enqueue rejects missing workers");
assert.match(enqueue, /metadata\.mode|mode:/, "enqueue propagates mode");

const jobWorker = readFileSync(join(root, "lib/api-handlers/cron/job-worker.js"), "utf8");
assert.match(jobWorker, /AbortController/, "job-worker aborts on deadline");
assert.match(jobWorker, /worker_deadline/, "deadline abort reason set");

assert.match(supabaseTs, /classifyIdentifier|isUuid/, "lesson lookup separates UUID/slug");
assert.match(supabaseTs, /order\("sort_order"/, "QA categories ordered by sort_order");

console.log("p0-reliability-gates: ok");
