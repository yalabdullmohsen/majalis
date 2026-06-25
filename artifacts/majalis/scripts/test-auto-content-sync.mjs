#!/usr/bin/env node
/**
 * Production verification script for auto-content-sync pipeline.
 * Usage: node scripts/test-auto-content-sync.mjs
 */
import { runAutoContentSync, getAutoContentHealth } from "../lib/auto-content/auto-content-sync.mjs";

console.log("=== Auto Content Sync — Production Test ===\n");

console.log("--- Health Check ---");
const health = await getAutoContentHealth();
console.log(JSON.stringify(health, null, 2));

console.log("\n--- Full Sync Run ---");
const result = await runAutoContentSync({ triggerType: "test" });
console.log("\n--- Summary ---");
console.log(JSON.stringify({
  ok: result.ok,
  runId: result.runId,
  sourcesTotal: result.sourcesTotal,
  sourcesOk: result.sourcesOk,
  sourcesFailed: result.sourcesFailed,
  imported: result.imported,
  published: result.published,
  skipped: result.skipped,
  failed: result.failed,
  duplicates: result.duplicates,
  durationMs: result.durationMs,
  successRate: result.successRate,
  dataBytes: result.dataBytes,
  skipReasons: result.skipReasons,
  env: result.env,
}, null, 2));

if (result.logs?.length) {
  console.log("\n--- Pipeline Logs (last 20) ---");
  for (const entry of result.logs.slice(-20)) {
    console.log(`[${entry.step}] ${entry.message}`);
  }
}

process.exit(result.ok ? 0 : 1);
