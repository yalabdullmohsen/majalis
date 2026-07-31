/**
 * Gate: heavy vercel crons must enqueue (202), not run inline.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const MUST_ENQUEUE = [
  "lib/api-handlers/cron/process-import-jobs.js",
  "lib/api-handlers/cron/check-fiqh-links.js",
  "lib/api-handlers/cron/connector-health.js",
  "lib/api-handlers/cron/daily-benefit-rotation.js",
];

console.log("=== cron-enqueue-gate ===\n");
for (const rel of MUST_ENQUEUE) {
  const src = readFileSync(join(root, rel), "utf8");
  assert.match(src, /createEnqueueCronHandler/, `${rel} must use createEnqueueCronHandler`);
  assert.doesNotMatch(src, /processQueuedImportJobs|runFiqhLinkCheck|runConnectorHealthChecks|runDailyBenefitRotation/, `${rel} must not run work inline`);
  console.log(`  ✓ ${rel}`);
}

const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const banned = new Set([
  "/api/cron/apply-migrations",
  "/api/cron/bootstrap-database",
  "/api/cron/platform-bootstrap",
  "/api/cron/autonomous-platform-bootstrap",
]);
for (const c of vercel.crons || []) {
  assert.equal(banned.has(c.path), false, `vercel cron must not schedule ${c.path}`);
}
console.log("  ✓ vercel.json has no DDL/bootstrap crons");
console.log("\nAll cron enqueue gates passed.\n");
