#!/usr/bin/env node
/**
 * Static check: cron API handlers should not send responses from finally,
 * and non-allowlisted long crons must enqueue (createEnqueueCronHandler).
 * Handlers under lib/api-handlers/cron that perform heavy inline work fail CI.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cronDir = join(root, "artifacts", "majalis", "lib", "api-handlers", "cron");
const httpDir = join(root, "artifacts", "majalis", "lib", "api-handlers");

/** Fast crons allowed to run inline (health / auth / verify / tiny jobs). */
const INLINE_ALLOWLIST = new Set([
  "apply-migrations.js", // verify only
  "auto-content-health.js",
  "system-health.js",
  "connector-health.js",
  "bootstrap-owner.js",
  "check-fiqh-links.js",
  "daily-benefit-rotation.js",
  "job-worker.js", // processes one claimed job under deadline
  "majlis-knowledge-engine.js", // health inline + enqueue for full
  "bootstrap-database.js", // verify/connection inline; full enqueues
  "process-import-jobs.js", // short watchdog + bounded import queue (content-import contract)
]);

const HEAVY_PATTERNS = [
  /for\s*\(\s*(?:const|let|var)\s+\w+\s+of\s+/i,
  /while\s*\(/i,
  /runIslamicIntelligencePlatform|runMajlisKnowledgeEngine|runAutonomousPlatform|runAutoContentSync|applyMigrations\s*\(/,
];

let failed = 0;
console.log("=== verify-single-response-pattern + cron enqueue ===\n");

function scanHandlers(dir, prefix = "") {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (name.endsWith(".js") || name.endsWith(".mjs")) {
      const body = readFileSync(full, "utf8");
      const rel = `${prefix}${name}`;
      // finally { ... sendJson / res.end / res.json
      if (/finally\s*\{[\s\S]{0,400}\b(sendJson|res\.(end|json|send|writeHead))\b/.test(body)) {
        console.error(`  ✗ ${rel}: response write inside finally`);
        failed++;
      }
    }
  }
}

scanHandlers(httpDir, "api-handlers/");
scanHandlers(join(httpDir, "cron"), "cron/");
scanHandlers(join(httpDir, "admin"), "admin/");

if (!existsSync(cronDir)) {
  console.error("missing cron dir");
  process.exit(1);
}

for (const name of readdirSync(cronDir).filter((f) => f.endsWith(".js"))) {
  const body = readFileSync(join(cronDir, name), "utf8");
  const usesEnqueue = /createEnqueueCronHandler/.test(body);
  if (INLINE_ALLOWLIST.has(name)) {
    if (name === "majlis-knowledge-engine.js" && !usesEnqueue) {
      console.error(`  ✗ ${name}: must enqueue non-health modes`);
      failed++;
    } else {
      console.log(`  ✓ ${name}: allowlisted inline`);
    }
    continue;
  }
  if (!usesEnqueue) {
    const heavy = HEAVY_PATTERNS.some((re) => re.test(body));
    if (heavy || body.length > 800) {
      console.error(`  ✗ ${name}: long/heavy cron must use createEnqueueCronHandler`);
      failed++;
    } else {
      console.log(`  ~ ${name}: small inline (review)`);
    }
  } else {
    console.log(`  ✓ ${name}: enqueue`);
  }
}

if (failed) {
  console.error(`\n${failed} issue(s)`);
  process.exit(1);
}
console.log("\nSingle-response / cron enqueue checks passed.");
