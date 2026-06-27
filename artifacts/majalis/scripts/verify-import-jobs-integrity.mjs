#!/usr/bin/env node
/**
 * Verify content_import_jobs / content_import_staging schema, FK, and integrity recovery.
 *
 * Usage:
 *   node scripts/verify-import-jobs-integrity.mjs
 *   node scripts/verify-import-jobs-integrity.mjs --production
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { listAvailableMigrations } from "../lib/migration-paths.mjs";
import {
  ensureImportTables,
  recoverImportJobIntegrity,
  createImportJob,
  stageImportRows,
  getImportJob,
  clearStaging,
} from "../lib/content-import/import-jobs.mjs";
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";
import { resolveDatabaseUrl } from "../lib/database.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const production = process.argv.includes("--production");
const PRODUCTION = process.env.MAJALIS_PRODUCTION_URL || "https://www.majlisilm.com";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    return;
  }
  failed++;
  console.error(`✗ ${msg}`);
}

function ok(msg) {
  console.log(`✓ ${msg}`);
}

async function verifyMigrationFile() {
  const available = listAvailableMigrations();
  assert(available.present?.includes("content_import_jobs_v1.sql"), "content_import_jobs_v1.sql in migration list");
  const sql = readFileSync(join(available.dir, "content_import_jobs_v1.sql"), "utf8");
  assert(sql.includes("content_import_jobs"), "migration creates content_import_jobs");
  assert(sql.includes("content_import_staging"), "migration creates content_import_staging");
  assert(sql.includes("ON DELETE CASCADE"), "staging FK uses ON DELETE CASCADE");
  assert(sql.includes("REFERENCES content_import_jobs"), "staging references jobs table");
  ok("migration file structure verified");
}

async function verifyDatabaseIntegrity() {
  const admin = getSupabaseAdmin();
  const db = resolveDatabaseUrl();
  assert(!!admin, "Supabase admin configured");
  assert(db.rawConfigured, "DATABASE_URL configured");

  const ensured = await ensureImportTables(admin);
  assert(ensured.ok, `ensureImportTables: ${ensured.error || "ok"}`);
  ok(`schema ensured via ${ensured.via || "unknown"}`);

  const { getPgClient } = await import("../lib/database.mjs");
  const { client } = await getPgClient();
  try {
    const fk = await client.query(`
      SELECT conname, confdeltype
      FROM pg_constraint
      WHERE conname = 'content_import_staging_job_id_fkey'
    `);
    assert(fk.rows.length === 1, "FK constraint content_import_staging_job_id_fkey exists");
    assert(fk.rows[0].confdeltype === "c", "FK cascade delete enabled");

    const orphans = await client.query(`
      SELECT count(*)::int AS n
      FROM content_import_staging s
      WHERE NOT EXISTS (SELECT 1 FROM content_import_jobs j WHERE j.id = s.job_id)
    `);
    assert(orphans.rows[0].n === 0, `no orphan staging rows (found ${orphans.rows[0].n})`);
    ok("database FK + orphan check passed");
  } finally {
    await client.end().catch(() => {});
  }

  const recovered = await recoverImportJobIntegrity();
  assert(recovered.ok, `recoverImportJobIntegrity: ${recovered.error || "ok"}`);
  ok("integrity recovery completed");
}

async function verifyJobStagingFlow() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.log("⊘ skipping live job/staging flow — no Supabase admin");
    return;
  }

  const created = await createImportJob({
    type: "adhkar",
    filename: "integrity-test.csv",
    totalRows: 3,
    createdBy: "service",
  });
  assert(created.ok, `createImportJob: ${created.error || "ok"}`);
  assert(created.persisted, "job persisted to database");
  ok(`job created ${created.id}`);

  const staged = await stageImportRows(created.id, [
    { text: "سبحان الله", category: "صباح", count: 1, source: "مسلم" },
    { text: "الحمد لله", category: "مساء", count: 3, source: "مسلم" },
  ], 0);
  assert(staged.ok, `stageImportRows: ${staged.error || "ok"}`);
  ok(`staged ${staged.staged} rows via ${staged.via}`);

  const job = await getImportJob(created.id);
  assert(job?.id === created.id, "getImportJob returns persisted job");

  await clearStaging(created.id);
  const { getPgClient } = await import("../lib/database.mjs");
  const { client } = await getPgClient();
  try {
    await client.query("DELETE FROM content_import_jobs WHERE id = $1", [created.id]);
  } finally {
    await client.end().catch(() => {});
  }
  ok("job/staging round-trip cleaned up");
}

async function verifyProductionCron() {
  const cronSecret = process.env.CRON_SECRET || process.env.VITE_CRON_SECRET;
  if (!cronSecret) {
    console.log("⊘ skipping production cron — CRON_SECRET not set");
    return;
  }
  const res = await fetch(`${PRODUCTION}/api/cron/apply-migrations?action=content-import-schema`, {
    headers: { Authorization: `Bearer ${cronSecret}` },
  });
  const body = await res.json().catch(() => ({}));
  assert(res.ok && body.ok !== false, `production content-import-schema: ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
  ok("production content-import-schema endpoint OK");
}

async function main() {
  console.log("Import jobs integrity verification\n");
  await verifyMigrationFile();

  const admin = getSupabaseAdmin();
  if (admin && resolveDatabaseUrl().rawConfigured) {
    await verifyDatabaseIntegrity();
    await verifyJobStagingFlow();
  } else {
    console.log("⊘ DATABASE_URL / service role not configured — schema + DB checks skipped locally");
  }

  if (production) {
    await verifyProductionCron();
  }

  console.log(`\nImport jobs integrity: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
