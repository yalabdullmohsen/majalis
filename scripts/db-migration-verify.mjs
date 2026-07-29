#!/usr/bin/env node
/**
 * Verify migration chain using the project migration runner (db-migrate.applyMigrations).
 * Modes:
 *   verify  — static checks + apply full chain (continueOnError) then assert required objects
 *   fresh   — DROP/CREATE public schema, then full chain; REQUIRED objects must exist
 *   upgrade — baseline through pre-P0, then P0 twice (idempotent)
 *
 * Never targets Production automatically.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.argv[2] || "verify"; // verify | fresh | upgrade
const sqlPath = join(root, "artifacts", "majalis", "supabase", "enterprise_reliability_p0_v1.sql");
const qaBaseline = join(root, "artifacts", "majalis", "supabase", "qa_phase4_seed.sql");

console.log(`=== db:migration:${mode} ===\n`);

let failed = 0;
if (!existsSync(sqlPath)) {
  console.error("missing enterprise_reliability_p0_v1.sql");
  process.exit(1);
}
if (!existsSync(qaBaseline)) {
  console.error("missing qa_phase4_seed.sql (baseline for qa_categories)");
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
const qaSql = readFileSync(qaBaseline, "utf8");
for (const [label, body, token] of [
  ["enterprise", sql, "ai_provider_circuit"],
  ["enterprise", sql, "background_jobs"],
  ["enterprise", sql, "sort_order"],
  ["qa_phase4_seed", qaSql, "CREATE TABLE IF NOT EXISTS qa_categories"],
]) {
  if (!body.includes(token)) {
    console.error(`  ✗ ${label} missing: ${token}`);
    failed++;
  } else {
    console.log(`  ✓ ${label} contains ${token}`);
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
  process.exit(failed ? 1 : 0);
}
if (/amazonaws\.com|supabase\.co/i.test(url) && process.env.ALLOW_PROD_MIGRATION_TEST !== "1") {
  console.error("Refusing Production-looking DATABASE_URL");
  process.exit(1);
}

process.env.DATABASE_URL = url;
process.env.MIGRATION_TEST_DATABASE_URL = url;
process.env.NODE_ENV = process.env.NODE_ENV || "test";
for (const k of [
  "SUPABASE_DB_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_MANAGEMENT_TOKEN",
  "SUPABASE_PAT",
]) {
  delete process.env[k];
}

const require = createRequire(join(root, "artifacts", "majalis", "package.json"));
const pg = require("pg");
function pathToMajalis(rel) {
  return join(root, "artifacts", "majalis", rel);
}
const { applyMigrations } = await import(pathToMajalis("lib/db-migrate.mjs"));
const { MIGRATION_FILES } = await import(pathToMajalis("lib/migration-paths.mjs"));

async function assertRequired(client, requiredStrict) {
  const need = [
    ["qa_categories", `SELECT to_regclass('public.qa_categories') AS r`],
    ["ai_provider_circuit", `SELECT to_regclass('public.ai_provider_circuit') AS r`],
    ["background_jobs", `SELECT to_regclass('public.background_jobs') AS r`],
    [
      "qa_categories.sort_order",
      `SELECT 1 AS r FROM information_schema.columns
       WHERE table_schema='public' AND table_name='qa_categories' AND column_name='sort_order'`,
    ],
  ];
  for (const [name, q] of need) {
    const { rows } = await client.query(q);
    const ok = Boolean(rows[0]?.r);
    if (!ok) {
      console.error(`  ✗ missing required: ${name}`);
      failed++;
      if (requiredStrict) {
        throw new Error(`required object missing after migrations: ${name}`);
      }
    } else {
      console.log(`  ✓ present: ${name}`);
    }
  }
}

const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 15_000 });
await client.connect();

try {
  if (mode === "fresh") {
    console.log("  … resetting public schema for fresh chain");
    await client.query("DROP SCHEMA IF EXISTS public CASCADE");
    await client.query("CREATE SCHEMA public");
    await client.query("GRANT ALL ON SCHEMA public TO public");
  }

  if (mode === "upgrade") {
    // Baseline: everything before enterprise_reliability_p0_v1.sql
    const idx = MIGRATION_FILES.indexOf("enterprise_reliability_p0_v1.sql");
    if (idx < 0) throw new Error("enterprise_reliability_p0_v1.sql not in MIGRATION_FILES");
    const baseline = MIGRATION_FILES.slice(0, idx);
    console.log(`  … applying baseline (${baseline.length} files) before P0`);
    const baseResult = await applyMigrations({
      files: baseline,
      continueOnError: true,
      trackApplied: false,
    });
    console.log(
      `  ~ baseline applied ok=${baseResult.ok} results=${(baseResult.results || []).length}`,
    );
    // Ensure qa baseline even if earlier files failed
    if (!(await client.query(`SELECT to_regclass('public.qa_categories') AS r`)).rows[0]?.r) {
      console.error("  ✗ qa_categories missing after baseline — qa_phase4_seed did not apply");
      failed++;
      throw new Error("qa_categories baseline missing");
    }
    console.log("  … applying enterprise_reliability_p0_v1.sql (upgrade)");
    await client.query(sql);
    console.log("  ✓ P0 applied");
    await client.query(sql);
    console.log("  ✓ P0 re-applied (idempotent)");
  } else {
    // verify + fresh: full ordered chain via project runner
    console.log(`  … applying full MIGRATION_FILES (${MIGRATION_FILES.length}) via applyMigrations`);
    const result = await applyMigrations({
      files: MIGRATION_FILES,
      continueOnError: true,
      trackApplied: false,
    });
    const results = result.results || [];
    const okCount = results.filter((r) => r.ok).length;
    const failCount = results.filter((r) => !r.ok).length;
    console.log(`  ~ chain results: ok=${okCount} failed=${failCount} runner_ok=${result.ok}`);
    for (const r of results.filter((x) => !x.ok).slice(0, 12)) {
      console.log(`    · failed ${r.file}: ${String(r.error || "").slice(0, 120)}`);
    }
    // Critical: qa_phase4_seed and enterprise must succeed
    const critical = ["qa_phase4_seed.sql", "enterprise_reliability_p0_v1.sql"];
    for (const file of critical) {
      const row = results.find((r) => r.file === file);
      if (!row?.ok) {
        console.error(`  ✗ critical migration failed/missing: ${file}`, row?.error || "");
        failed++;
        // Try direct apply of critical files so we still surface schema truth
        try {
          const body = readFileSync(join(root, "artifacts/majalis/supabase", file), "utf8");
          await client.query(body);
          console.log(`  ~ recovered by direct apply: ${file}`);
        } catch (err) {
          console.error(`  ✗ direct apply failed ${file}:`, err.message);
        }
      } else {
        console.log(`  ✓ critical migration ok: ${file}`);
      }
    }
  }

  await assertRequired(client, mode === "fresh" || mode === "upgrade" || mode === "verify");

  const { rows: rls } = await client.query(
    `SELECT relname, relrowsecurity FROM pg_class
     WHERE relname IN ('ai_provider_circuit','background_jobs','background_job_dead_letters')`,
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
