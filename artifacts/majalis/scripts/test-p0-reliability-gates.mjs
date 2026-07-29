/**
 * Gate: runtime schema migration must be blocked by default; HTTP sendJson guards headersSent.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const applyMig = readFileSync(join(root, "lib/api-handlers/cron/apply-migrations.js"), "utf8");
const http = readFileSync(join(root, "lib/api/_http.mjs"), "utf8");
const dispatch = readFileSync(join(root, "lib/api-dispatch.mjs"), "utf8");
const extractor = readFileSync(join(root, "lib/cms/lesson-extractor.mjs"), "utf8");
const sql = readFileSync(join(root, "supabase/enterprise_reliability_p0_v1.sql"), "utf8");
const supabaseTs = readFileSync(join(root, "src/lib/supabase.ts"), "utf8");

assert.match(applyMig, /ALLOW_RUNTIME_SCHEMA_MIGRATIONS/, "apply-migrations must gate schema writes");
assert.match(applyMig, /runtime_schema_migrations_disabled|schemaMutationBlocked/, "blocked response required");
assert.match(http, /headersSent|isResponseClosed/, "safe sendJson required");
assert.match(dispatch, /createRequestContext/, "dispatch must abort on timeout");
assert.match(dispatch, /CRON_HANDLER_TIMEOUT_MS = 12_000/, "cron HTTP timeout shortened");
assert.match(extractor, /runAiCall/, "lesson-extractor uses provider client");
assert.match(sql, /ai_provider_circuit/, "migration creates AI circuit table");
assert.match(sql, /background_jobs/, "migration creates job queue");
assert.match(sql, /sort_order/, "migration adds qa_categories.sort_order");
assert.match(supabaseTs, /classifyIdentifier|isUuid/, "lesson lookup separates UUID/slug");
assert.match(supabaseTs, /order\("sort_order"/, "QA categories ordered by sort_order");

console.log("p0-reliability-gates: ok");
