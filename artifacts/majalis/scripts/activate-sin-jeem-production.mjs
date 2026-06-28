#!/usr/bin/env node
/**
 * One-shot Sin Jeem production activation:
 * 1. Apply migration (sin_jeem_v1 + v1_2)
 * 2. Seed categories + 527 questions
 * 3. Verify schema + row counts
 * 4. Offline seed integrity
 *
 * Requires: DATABASE_URL or SUPABASE_ACCESS_TOKEN + SUPABASE_SERVICE_ROLE_KEY for seed
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

  console.log("Sin Jeem Production Activation");
  console.log(`DATABASE_URL: ${hasDb ? "set" : "MISSING"}`);
  console.log(`SERVICE_ROLE_KEY: ${hasService ? "set" : "MISSING"}`);

  if (!run("Offline seed integrity", "verify-sin-jeem-seed-integrity.mjs")) process.exit(1);
  if (!run("Code production verify", "verify-sin-jeem-production.mjs")) process.exit(1);
  if (!run("Engine tests", "test-sin-jeem-engine.mjs")) process.exit(1);
  if (!run("E2E simulation", "test-sin-jeem-e2e.mjs")) process.exit(1);

  if (!hasDb) {
    console.error("\n✗ DATABASE_URL not set — cannot apply migration.");
    console.error("  Set DATABASE_URL (Transaction Pooler port 6543) and re-run.");
    console.error("  Or on Vercel: GET /api/cron/apply-migrations?scope=sin-jeem&seed=1");
    process.exit(1);
  }

  if (!run("Apply migration", "apply-sin-jeem-migration.mjs")) process.exit(1);
  if (!run("Idempotent re-apply", "apply-sin-jeem-migration.mjs", ["--idempotent-test"])) process.exit(1);

  if (hasService) {
    if (!run("Seed questions", "seed-sin-jeem-questions.mjs")) process.exit(1);
  } else {
    console.warn("\n⚠ SERVICE_ROLE_KEY missing — skipping seed");
  }

  if (!run("DB verify", "verify-sin-jeem-db.mjs")) process.exit(1);

  console.log("\n✓ Sin Jeem production activation complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
