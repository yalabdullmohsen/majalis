#!/usr/bin/env node
/**
 * Static expectations: code/SQL require certain objects.
 * Does NOT connect to Production. With MIGRATION_TEST_DATABASE_URL, verifies presence.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sql = join(root, "artifacts/majalis/supabase/enterprise_reliability_p0_v1.sql");
const expectedInRepo = ["ai_provider_circuit", "background_jobs", "background_job_dead_letters"];

console.log("=== schema-drift expectations (repo) ===\n");
if (!existsSync(sql)) {
  console.error("missing enterprise_reliability_p0_v1.sql");
  process.exit(1);
}
const body = readFileSync(sql, "utf8");
let failed = 0;
for (const name of expectedInRepo) {
  if (!body.includes(name)) {
    console.error(`  ✗ SQL missing ${name}`);
    failed++;
  } else console.log(`  ✓ repo SQL defines ${name}`);
}

const url = process.env.MIGRATION_TEST_DATABASE_URL || "";
if (!url) {
  console.log("\nLive DB check SKIPPED (set MIGRATION_TEST_DATABASE_URL for Staging only).");
  console.log("Production apply REQUIRES_EXPLICIT_APPROVAL — see docs/security/SUPABASE_RLS_MATRIX.md");
  process.exit(failed ? 1 : 0);
}
if (/supabase\.co/i.test(url) && process.env.ALLOW_PROD_MIGRATION_TEST !== "1") {
  console.error("Refusing Production-looking URL");
  process.exit(1);
}

const require = createRequire(join(root, "artifacts/majalis/package.json"));
const pg = require("pg");
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  for (const name of expectedInRepo) {
    const { rows } = await client.query(`SELECT to_regclass('public.${name}') AS r`);
    if (!rows[0]?.r) {
      console.error(`  ✗ DB missing ${name}`);
      failed++;
    } else console.log(`  ✓ DB has ${name}`);
  }
} finally {
  await client.end();
}
process.exit(failed ? 1 : 0);
