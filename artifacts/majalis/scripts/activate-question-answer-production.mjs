#!/usr/bin/env node
/**
 * One-shot سؤال وجواب production activation:
 * 1. Verify local bank integrity (527 questions)
 * 2. Apply sin_jeem migration
 * 3. Seed sin_jeem_questions
 * 4. Verify >= 500 in production DB
 *
 * Requires DATABASE_URL + SUPABASE_SERVICE_ROLE_KEY for full activation.
 * Remote: GET /api/cron/apply-migrations?scope=question-answer&seed=1
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function run(label, script, extraArgs = []) {
  console.log(`\n── ${label} ──`);
  const r = spawnSync("node", [path.join(ROOT, "scripts", script), ...extraArgs], {
    stdio: "inherit",
    cwd: ROOT,
    env: process.env,
  });
  if (r.status !== 0) {
    console.error(`FAILED: ${label}`);
    return false;
  }
  return true;
}

async function main() {
  const hasDb = Boolean(process.env.DATABASE_URL || process.env.SUPABASE_ACCESS_TOKEN);
  const hasService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  console.log("\n=== سؤال وجواب — Production Activation ===\n");
  console.log(`DATABASE_URL: ${hasDb ? "set" : "MISSING"}`);
  console.log(`SERVICE_ROLE_KEY: ${hasService ? "set" : "MISSING"}`);
  console.log("Target table: sin_jeem_questions\n");

  if (!run("Bank integrity", "verify-sin-jeem-seed-integrity.mjs")) process.exit(1);
  if (!run("Code verify", "verify-sin-jeem-production.mjs")) process.exit(1);
  if (!run("Engine tests", "test-sin-jeem-engine.mjs")) process.exit(1);
  if (!run("Route smoke", "smoke-question-answer-routes.mjs")) process.exit(1);

  if (!hasDb) {
    console.error("\n✗ DATABASE_URL not set — cannot apply migration.");
    console.error("  Run on Vercel with secrets, or:");
    console.error("  GET /api/cron/apply-migrations?scope=question-answer&seed=1");
    process.exit(1);
  }

  if (!run("Apply migration", "apply-sin-jeem-migration.mjs")) process.exit(1);

  if (hasService) {
    if (!run("Seed questions", "seed-question-answer.mjs")) process.exit(1);
  } else {
    console.warn("\n⚠ SERVICE_ROLE_KEY missing — skipping seed");
  }

  if (!run("DB verify", "verify-question-answer-db.mjs")) process.exit(1);

  console.log("\n✓ سؤال وجواب production activation complete\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
