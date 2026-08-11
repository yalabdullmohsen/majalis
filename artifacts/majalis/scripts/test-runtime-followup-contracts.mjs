/**
 * Contract gates for P0 runtime follow-up: missing APIs, NFT-safe health, import $2 cast.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dispatch = readFileSync(join(root, "lib/api-dispatch.mjs"), "utf8");
const importJobs = readFileSync(join(root, "lib/content-import/import-jobs.mjs"), "utf8");
const jobWorker = readFileSync(join(root, "lib/api-handlers/cron/job-worker.js"), "utf8");
const prayer = readFileSync(join(root, "lib/api-handlers/prayer-times.js"), "utf8");
const quranPersonal = readFileSync(join(root, "src/lib/quran-personal.ts"), "utf8");

for (const route of ["/api/content-delta", "/api/reading-sync"]) {
  assert.match(dispatch, new RegExp(route.replace(/\//g, "\\/")), `${route} must be registered`);
}

assert.match(
  importJobs,
  /jsonb_build_array\(\$2::text\)/,
  "watchdog must cast $2::text for jsonb_build_array",
);
assert.doesNotMatch(
  importJobs,
  /jsonb_build_array\(\$2\)/,
  "untyped $2 inside jsonb_build_array is forbidden",
);

assert.match(jobWorker, /WORKER_DEADLINE_MS\s*=\s*6_000/, "job-worker budget ≤6s");
assert.match(jobWorker, /MAX_BATCHES_PER_INVOKE\s*=\s*1/, "batch limit = 1");
assert.match(jobWorker, /runJobBatchesWithBudget/, "budget race helper required");
assert.match(jobWorker, /WORKER_LEASE_MS\s*=\s*15_000/, "lease aligned to tick");

assert.doesNotMatch(prayer, /\.select\(\s*["']\*["']\s*\)/, "prayer_times must not select *");

assert.match(quranPersonal, /VITE_READING_SYNC/, "reading remote sync is feature-gated");

const contentDelta = readFileSync(join(root, "lib/api-handlers/content-delta.js"), "utf8");
assert.match(contentDelta, /function buildPacks/, "content-delta builds packs");
assert.match(contentDelta, /packId:\s*["']search-index["']/, "content-delta search-index pack");
assert.match(contentDelta, /protocol:\s*["']delta-v1["']/, "content-delta protocol");
assert.doesNotMatch(
  contentDelta,
  /sendJson\([\s\S]*packs:\s*\[\s*\]/,
  "content-delta must not hardcode empty packs in response",
);

const readingSync = readFileSync(join(root, "lib/api-handlers/reading-sync.js"), "utf8");
assert.match(readingSync, /reading_sync_unavailable|reading_sync_schema_missing/, "no fake success without persist");

console.log("test-runtime-followup-contracts: ok");
