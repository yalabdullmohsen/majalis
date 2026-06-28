#!/usr/bin/env node
/**
 * Seed سؤال وجواب categories + question bank into Supabase Production.
 *
 * Source of truth table: sin_jeem_questions (NOT quiz_questions).
 * Bank file: data/sin-jeem/questions-bank.json (527 production-ready questions).
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (or SUPABASE_URL).
 *
 * Usage:
 *   pnpm --filter @workspace/majalis run seed:question-answer
 *   node scripts/seed-question-answer.mjs --dry-run
 *   node scripts/seed-question-answer.mjs --force
 */
import { runSinJeemSeed } from "../lib/sin-jeem-seed.mjs";
import { getBankAudit } from "../lib/question-answer-bank.mjs";

const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");

async function main() {
  const audit = getBankAudit();
  console.log("\n=== سؤال وجواب — Question Seed ===\n");
  console.log("Bank audit:", JSON.stringify(audit, null, 2));
  console.log(`Target table: sin_jeem_questions`);
  console.log(`Mode: ${dryRun ? "dry-run" : "live"}${force ? " (force)" : ""}\n`);

  const result = await runSinJeemSeed({ dryRun, force });
  console.log("\nResult:", JSON.stringify(result, null, 2));

  if (!result.ok) {
    console.error("\n✗ Seed failed:", result.error);
    process.exit(1);
  }

  const seed = result.seed || {};
  if (seed.skipped) {
    console.log(`\n⊘ Skipped: ${seed.reason}`);
    console.log(`  total_in_db: ${seed.totalInDb ?? seed.count ?? "?"}`);
  } else {
    console.log("\n── Summary ──");
    console.log(`  inserted:  ${seed.inserted ?? 0}`);
    console.log(`  updated:   ${seed.updated ?? 0}`);
    console.log(`  skipped:   ${seed.skippedDuplicates ?? seed.skipped ?? 0}`);
    console.log(`  failed:    ${seed.failed ?? 0}`);
    console.log(`  total_in_db (published): ${seed.totalInDb ?? "?"}`);
    console.log(`  categories: ${result.categories ?? "?"}`);
  }

  if (!dryRun && (seed.totalInDb ?? 0) < 500 && !seed.skipped) {
    console.error("\n✗ Published questions in DB < 500 after seed");
    process.exit(1);
  }

  console.log("\n✓ seed:question-answer complete\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
