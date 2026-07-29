#!/usr/bin/env node
/**
 * Verify enterprise_reliability_p0_v1.sql against a real PostgreSQL when DATABASE_URL is set.
 * Without DATABASE_URL: syntax/static checks only (exit 0 with SKIPPED note).
 * Never targets Production automatically — caller must set URL explicitly.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sqlPath = join(root, "artifacts", "majalis", "supabase", "enterprise_reliability_p0_v1.sql");
const mode = process.argv[2] || "verify"; // verify | fresh | upgrade

console.log(`=== db:migration:${mode} ===\n`);

if (!existsSync(sqlPath)) {
  console.error("missing enterprise_reliability_p0_v1.sql");
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
const sqlRequired = [
  "ai_provider_circuit",
  "background_jobs",
  "background_job_dead_letters",
  "sort_order",
  "ENABLE ROW LEVEL SECURITY",
];
let failed = 0;
for (const token of sqlRequired) {
  if (!sql.includes(token)) {
    console.error(`  ✗ SQL missing: ${token}`);
    failed++;
  } else {
    console.log(`  ✓ contains ${token}`);
  }
}

const queueSrc = readFileSync(join(root, "artifacts", "majalis", "lib", "jobs", "queue.mjs"), "utf8");
if (!queueSrc.includes("FOR UPDATE SKIP LOCKED")) {
  console.error("  ✗ queue.mjs missing FOR UPDATE SKIP LOCKED");
  failed++;
} else {
  console.log("  ✓ queue uses FOR UPDATE SKIP LOCKED");
}

const url = process.env.DATABASE_URL || process.env.MIGRATION_TEST_DATABASE_URL || "";
if (!url) {
  console.log("\nSKIPPED live Postgres apply (set MIGRATION_TEST_DATABASE_URL to run).");
  if (failed) process.exit(1);
  process.exit(0);
}

if (/amazonaws\.com|supabase\.co|prod/i.test(url) && process.env.ALLOW_PROD_MIGRATION_TEST !== "1") {
  console.error("Refusing to run migration test against URL that looks like Production.");
  process.exit(1);
}

const require = createRequire(join(root, "artifacts", "majalis", "package.json"));
const pg = require("pg");

const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10_000 });
await client.connect();

try {
  if (mode === "fresh" || mode === "verify" || mode === "upgrade") {
    await client.query(sql);
    console.log("  ✓ applied enterprise_reliability_p0_v1.sql");
  }
  if (mode === "upgrade") {
    await client.query(sql);
    console.log("  ✓ re-applied migration (idempotency)");
  }

  const checks = [
    `SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_provider_circuit'`,
    `SELECT 1 FROM information_schema.tables WHERE table_name = 'background_jobs'`,
    `SELECT 1 FROM information_schema.tables WHERE table_name = 'background_job_dead_letters'`,
  ];
  for (const q of checks) {
    const { rows } = await client.query(q);
    if (!rows.length) {
      console.error(`  ✗ failed check: ${q}`);
      failed++;
    } else {
      console.log(`  ✓ ${q.slice(0, 60)}...`);
    }
  }

  // qa_categories.sort_order only when table exists (expand-only)
  const { rows: qaTable } = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='qa_categories'`,
  );
  if (qaTable.length) {
    const { rows: qaCol } = await client.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'qa_categories' AND column_name = 'sort_order'`,
    );
    if (!qaCol.length) {
      console.error("  ✗ qa_categories exists but sort_order missing");
      failed++;
    } else {
      console.log("  ✓ qa_categories.sort_order present");
    }
  } else {
    console.log("  ~ qa_categories absent (fresh DB) — sort_order expand skipped (expected)");
  }

  const { rows: rls } = await client.query(
    `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('ai_provider_circuit','background_jobs','background_job_dead_letters')`,
  );
  for (const row of rls) {
    if (!row.relrowsecurity) {
      console.error(`  ✗ RLS not enabled on ${row.relname}`);
      failed++;
    } else {
      console.log(`  ✓ RLS on ${row.relname}`);
    }
  }
} finally {
  await client.end();
}

if (failed) process.exit(1);
console.log("\nmigration verify ok");
void pathToFileURL;
