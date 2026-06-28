#!/usr/bin/env node
/**
 * Apply sin_jeem_v1.sql + verify schema (idempotent).
 *
 * Usage:
 *   DATABASE_URL=postgresql://... node scripts/apply-sin-jeem-migration.mjs
 *   SUPABASE_ACCESS_TOKEN=... node scripts/apply-sin-jeem-migration.mjs
 *   pnpm --filter @workspace/majalis run apply:sin-jeem-migration
 */
import {
  applySinJeemMigration,
  verifySinJeemSchema,
  verifySinJeemIdempotent,
} from "../lib/sin-jeem-migration.mjs";

const idempotent = process.argv.includes("--idempotent-test");
const verifyOnly = process.argv.includes("--verify");

async function main() {
  if (verifyOnly) {
    const verify = await verifySinJeemSchema();
    console.log(JSON.stringify(verify, null, 2));
    process.exit(verify.ok ? 0 : 1);
  }

  if (idempotent) {
    console.log("Running idempotency test (apply twice)...");
    const result = await verifySinJeemIdempotent();
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  console.log("Applying sin_jeem_v1.sql...");
  const result = await applySinJeemMigration();
  console.log(JSON.stringify(result, null, 2));

  if (!result.ok || !result.verify?.ok) {
    console.error("Sin Jeem migration failed or schema incomplete.");
    if (result.verify?.missing?.length) {
      console.error("Missing tables:", result.verify.missing.join(", "));
    }
    if (result.verify?.missingFks?.length) {
      console.error("Missing FKs:", result.verify.missingFks.join(", "));
    }
    process.exit(1);
  }

  console.log(`OK: ${result.verify.tableCount} tables, ${result.verify.indexes?.length || 0} indexes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
