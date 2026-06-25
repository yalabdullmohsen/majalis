/**
 * Apply SQL migrations to Supabase Postgres.
 * Resolves DATABASE_URL automatically from all env sources.
 * Falls back to Supabase Management API when access token available.
 */

import { readFileSync } from "node:fs";
import { getPgClient, getProjectRef, resolveDatabaseUrl } from "./database.mjs";
import {
  MIGRATION_FILES,
  listAvailableMigrations,
  migrationFilePath,
} from "./migration-paths.mjs";

function pick(...keys) {
  for (const k of keys) {
    const v = String(process.env[k] || "").trim();
    if (v) return v;
  }
  return "";
}

function loadSql(filename) {
  return readFileSync(migrationFilePath(filename), "utf8");
}

async function applyViaManagementApiMigrations(sql, projectRef, accessToken, name) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/migrations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql, name }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Management API migrations ${res.status}: ${text.slice(0, 300)}`);
  return { ok: true, via: "management_api_migrations" };
}

async function applyViaManagementApiQuery(sql, projectRef, accessToken) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Management API query ${res.status}: ${text.slice(0, 300)}`);
  return { ok: true, via: "management_api_query" };
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
    .select("seo_title, source_verified, pipeline_stage, ai_analysis")
    .limit(0);
  checks.auto_imported_content_v2_columns = colErr ? colErr.message : "ok";

  const ok = Object.values(checks).every((v) => v === "ok");
  return { ok, checks };
}

export async function isSchemaReady() {
  const result = await verifySchema();
  return result.ok === true;
}

export async function ensureSchemaReady() {
  const ready = await isSchemaReady();
  if (ready) return { ok: true, alreadyReady: true };

  const available = listAvailableMigrations();
  if (!available.ok) {
    return {
      ok: false,
      error: `Migration files missing: ${available.missing.join(", ")}`,
      migrationsDir: available.dir,
      tried: available.tried,
    };
  }

  const migration = await applyMigrations({ continueOnError: false });
  const verify = await verifySchema();
  return { ok: verify.ok, migrated: true, migration, schema: verify };
}

export async function applyMigrations(options = {}) {
  const files = options.files || MIGRATION_FILES;
  const results = [];
  const accessToken = pick("SUPABASE_ACCESS_TOKEN", "SUPABASE_MANAGEMENT_TOKEN", "SUPABASE_PAT");
  const projectRef = getProjectRef();
  const dbResolved = resolveDatabaseUrl();
  const available = listAvailableMigrations();

  if (!available.ok) {
    return {
      ok: false,
      error: `Migration files missing: ${available.missing.join(", ")}`,
      migrationsDir: available.dir,
      tried: available.tried,
      databaseUrl: { source: dbResolved.source, configured: Boolean(dbResolved.rawConfigured), urlRedacted: dbResolved.urlRedacted },
    };
  }

  // Management API path (no DATABASE_URL needed)
  if (accessToken && projectRef) {
    for (const file of files) {
      const started = Date.now();
      const sql = loadSql(file);
      const name = file.replace(/\.sql$/, "");
      try {
        await applyViaManagementApiMigrations(sql, projectRef, accessToken, name);
        results.push({ file, ok: true, via: "management_api_migrations", durationMs: Date.now() - started });
      } catch (err) {
        try {
          await applyViaManagementApiQuery(sql, projectRef, accessToken);
          results.push({ file, ok: true, via: "management_api_query", durationMs: Date.now() - started });
        } catch (err2) {
          results.push({ file, ok: false, error: err2.message, durationMs: Date.now() - started });
          if (!options.continueOnError) break;
        }
      }
    }
    if (results.length > 0 && results.every((r) => r.ok)) {
      const verify = await verifySchema();
      return { ok: verify.ok, results, schema: verify, via: "management_api", databaseUrl: { source: dbResolved.source, urlRedacted: dbResolved.urlRedacted } };
    }
  }

  // pg direct path
  let clientInfo;
  try {
    clientInfo = await getPgClient();
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      stack: err.stack,
      results,
      databaseUrl: { source: dbResolved.source, configured: Boolean(dbResolved.rawConfigured), urlRedacted: dbResolved.urlRedacted },
      hint: "Set DATABASE_URL to Supavisor pooler URL (IPv4) or SUPABASE_ACCESS_TOKEN on Vercel",
      projectRef,
      migrationsDir: available.dir,
    };
  }

  const { client, source } = clientInfo;
  try {
    for (const file of files) {
      const started = Date.now();
      const sql = loadSql(file);
      try {
        await client.query(sql);
        results.push({ file, ok: true, via: source, durationMs: Date.now() - started });
      } catch (err) {
        results.push({ file, ok: false, error: err.message, stack: err.stack, via: source, durationMs: Date.now() - started });
        if (!options.continueOnError) throw err;
      }
    }

    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'auto_import_runs','auto_imported_content','schema_migrations',
          'ai_generation_jobs','verification_logs','ake_connectors','ake_job_queue'
        )
      ORDER BY table_name
    `);

    const { rows: cols } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'auto_imported_content'
        AND column_name IN ('seo_title','source_verified','pipeline_stage','ai_analysis')
    `);

    const verify = await verifySchema();
    return {
      ok: results.every((r) => r.ok) && verify.ok,
      results,
      tablesFound: tables.map((t) => t.table_name),
      requiredColumns: cols.map((c) => c.column_name),
      schema: verify,
      via: source,
      migrationsDir: available.dir,
      databaseUrl: { source: dbResolved.source, configured: Boolean(dbResolved.rawConfigured), urlRedacted: dbResolved.urlRedacted },
    };
  } finally {
    await client.end().catch(() => {});
  }
}

export async function listMigrationFiles() {
  return listAvailableMigrations().allSqlInDir || [];
}
