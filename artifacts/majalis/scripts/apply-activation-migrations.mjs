#!/usr/bin/env node
/**
 * Apply Production Activation migrations (tracked runner + seed hook).
 *
 * Usage:
 *   DATABASE_URL=postgresql://... node scripts/apply-activation-migrations.mjs
 *   pnpm --filter @workspace/majalis run apply:activation-migrations
 *   pnpm --filter @workspace/majalis run apply:activation-migrations -- --dry-run-seed
 */
import { runActivationMigrations } from "../lib/migration-runner.mjs";
import { ACTIVATION_MIGRATION_FILES } from "../lib/migration-paths.mjs";

const dryRunSeed = process.argv.includes("--dry-run-seed");
const skipSeed = process.argv.includes("--no-seed");

async function main() {
  console.log("Applying activation migrations:", ACTIVATION_MIGRATION_FILES.join(" → "));

  const result = await runActivationMigrations({
    seedRulings: !skipSeed,
    dryRunSeed,
  });

  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    console.error("Activation incomplete.");
    if (result.missing?.length) console.error("Missing tables:", result.missing.join(", "));
    process.exit(1);
  }

  console.log("Activation migrations applied successfully.");
  if (result.seed?.inserted) {
    console.log(`Rulings seeded: ${result.seed.inserted} rows`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
