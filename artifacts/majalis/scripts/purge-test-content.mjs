#!/usr/bin/env node
/**
 * Purge test/mock/quiz misclassified content from production tables.
 * Usage:
 *   node scripts/purge-test-content.mjs              # dry-run (default)
 *   node scripts/purge-test-content.mjs --apply      # delete + migrate quiz → qa
 */
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";
import { runProductionPurge } from "../lib/production/purge-runner.mjs";

const apply = process.argv.includes("--apply");

async function main() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error("✗ Supabase admin not configured — set SUPABASE_SERVICE_ROLE_KEY + SUPABASE_URL");
    process.exit(1);
  }

  const report = await runProductionPurge(admin, { apply });

  console.log(apply ? "=== Fawaid purge (APPLY) ===" : "=== Fawaid purge (DRY RUN) ===");
  console.log(JSON.stringify(report, null, 2));

  if (!apply && report.totalFound > 0) {
    console.log("\nRe-run with --apply to execute deletions and QA migration.");
  }

  if (report.errors?.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
