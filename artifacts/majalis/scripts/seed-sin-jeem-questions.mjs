#!/usr/bin/env node
/**
 * Seed Sin Jeem categories + question bank into Supabase Production.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (or SUPABASE_URL).
 *
 * Usage:
 *   pnpm --filter @workspace/majalis run seed:sin-jeem
 *   node scripts/seed-sin-jeem-questions.mjs --dry-run
 *   node scripts/seed-sin-jeem-questions.mjs --force
 */
import { runSinJeemSeed } from "../lib/sin-jeem-seed.mjs";

const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");

async function main() {
  console.log(`Seeding Sin Jeem (${dryRun ? "dry-run" : "live"})...`);
  const result = await runSinJeemSeed({ dryRun, force });
  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    console.error("Seed failed:", result.error);
    process.exit(1);
  }

  if (result.seed?.skipped) {
    console.log(`Skipped: ${result.seed.reason} (${result.seed.count} existing)`);
  } else {
    console.log(`Inserted ${result.seed?.inserted || 0}, skipped ${result.seed?.skipped || 0} duplicates`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
