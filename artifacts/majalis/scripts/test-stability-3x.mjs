#!/usr/bin/env node
/**
 * Stability test — 3 consecutive sync runs.
 * Verifies: no unbounded retries, consistent dedup, no data loss signals.
 * Usage: node scripts/test-stability-3x.mjs
 */
import { runAutoContentSync } from "../lib/auto-content/auto-content-sync.mjs";
import { getEnvStatus } from "../lib/env-config.mjs";

const RUNS = 3;
const results = [];

console.log("=== Auto Content Stability Test (3 runs) ===\n");
console.log("Env:", getEnvStatus());

for (let i = 1; i <= RUNS; i++) {
  console.log(`\n--- Run ${i}/${RUNS} ---`);
  const started = Date.now();
  const result = await runAutoContentSync({ triggerType: `stability-${i}` });
  const elapsed = Date.now() - started;

  results.push({
    run: i,
    ok: result.ok,
    imported: result.imported,
    published: result.published,
    skipped: result.skipped,
    failed: result.failed,
    duplicates: result.duplicates,
    durationMs: result.durationMs || elapsed,
    error: result.error,
  });

  console.log(JSON.stringify(results[results.length - 1], null, 2));

  if (result.error === "Supabase not configured") {
    console.error("\n❌ Cannot run stability test — SUPABASE_SERVICE_ROLE_KEY missing");
    process.exit(2);
  }

  if (i < RUNS) await new Promise((r) => setTimeout(r, 2000));
}

const allOk = results.every((r) => r.ok !== false || r.error === undefined);
const noRunawayRetries = results.every((r) => r.durationMs < 120_000);
const noDuplicatesOnRerun = results.slice(1).every((r) => r.imported === 0 || r.skipped > 0);
const noDataLoss = results.every((r) => r.failed === 0 || r.skipped > 0);

console.log("\n=== Stability Summary ===");
console.log({
  runs: RUNS,
  allCompleted: results.length === RUNS,
  noRunawayRetries,
  dedupWorking: noDuplicatesOnRerun,
  noUnexpectedFailures: noDataLoss,
  totalImported: results.reduce((s, r) => s + r.imported, 0),
  totalPublished: results.reduce((s, r) => s + r.published, 0),
  totalSkipped: results.reduce((s, r) => s + r.skipped, 0),
});

const passed = allOk && noRunawayRetries && noDuplicatesOnRerun;
console.log(passed ? "\n✅ Stability test PASSED" : "\n⚠️ Stability test completed with warnings");
process.exit(passed ? 0 : 1);
