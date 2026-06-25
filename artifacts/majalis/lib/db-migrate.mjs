/**
 * Apply SQL migrations to Supabase Postgres.
 * Requires DATABASE_URL (or SUPABASE_DB_URL / POSTGRES_URL).
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getEnvConfig } from "./env-config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../../..");

const MIGRATION_FILES = [
  "supabase/auto_content_pipeline.sql",
  "supabase/auto_content_pipeline_v2.sql",
  "supabase/auto_engine_production_complete.sql",
  "supabase/knowledge_engine_v12.sql",
  "supabase/auto_knowledge_engine_v13.sql",
];

async function getPgClient() {
  const { databaseUrl } = getEnvConfig();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not configured — cannot apply SQL migrations");
  }
  const pg = await import("pg");
  const client = new pg.default.Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();
  return client;
}

function loadSql(relativePath) {
  const full = join(REPO_ROOT, relativePath);
  return readFileSync(full, "utf8");
}

export async function applyMigrations(options = {}) {
  const files = options.files || MIGRATION_FILES;
  const results = [];
  let client;

  try {
    client = await getPgClient();

    for (const file of files) {
      const started = Date.now();
      const sql = loadSql(file);
      try {
        await client.query(sql);
        results.push({ file, ok: true, durationMs: Date.now() - started });
      } catch (err) {
        results.push({ file, ok: false, error: err.message, durationMs: Date.now() - started });
        if (!options.continueOnError) throw err;
      }
    }

    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'auto_import_runs','auto_imported_content','auto_import_logs','trusted_sources',
          'ai_generation_jobs','verification_logs','duplicate_cache','publishing_history',
          'source_health','source_statistics','auto_publish_queue',
          'ake_connectors','ake_job_queue','ake_engine_runs','schema_migrations'
        )
      ORDER BY table_name
    `);

    const { rows: cols } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'auto_imported_content'
        AND column_name IN ('seo_title','source_verified','pipeline_stage')
    `);

    return {
      ok: results.every((r) => r.ok),
      results,
      tablesFound: tables.map((t) => t.table_name),
      requiredColumns: cols.map((c) => c.column_name),
    };
  } finally {
    if (client) await client.end().catch(() => {});
  }
}

export async function verifySchema() {
  const { getSupabaseAdmin } = await import("./supabase-admin.mjs");
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "Supabase admin not configured" };

  const checks = {};
  const tables = [
    "auto_import_runs", "auto_imported_content", "auto_import_logs", "trusted_sources",
    "ai_generation_jobs", "verification_logs", "duplicate_cache", "publishing_history",
    "source_health", "source_statistics", "auto_publish_queue",
    "ake_connectors", "ake_job_queue",
  ];

  for (const table of tables) {
    const { error } = await admin.from(table).select("*").limit(0);
    checks[table] = error ? error.message : "ok";
  }

  const { error: colErr } = await admin
    .from("auto_imported_content")
    .select("seo_title, source_verified, pipeline_stage")
    .limit(0);
  checks.auto_imported_content_v2_columns = colErr ? colErr.message : "ok";

  const ok = Object.values(checks).every((v) => v === "ok");
  return { ok, checks };
}

export async function listMigrationFiles() {
  const supabaseDir = join(REPO_ROOT, "supabase");
  return readdirSync(supabaseDir).filter((f) => f.endsWith(".sql")).sort();
}
