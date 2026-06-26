import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { applyMigrations, ensureSchemaReady, verifySchema } from "../../../lib/db-migrate.mjs";
import { testDatabaseConnection, resolveDatabaseUrl } from "../../../lib/database.mjs";
import { listAvailableMigrations } from "../../../lib/migration-paths.mjs";
import { runAutoContentSync, getPublishedAutoContentFeed } from "../../../lib/auto-content/auto-content-sync.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import { logBootstrapError, serializeError } from "../../../lib/bootstrap-debug.mjs";
import { runPhase2TrialImport } from "../../../lib/content-import/phase2-trial.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __bootstrapDir = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__bootstrapDir, "../../..");

/** Current pipeline step — updated before each phase for error context. */
let migrationStep = "init";

function debugPayload(error, extra = {}) {
  const dbResolved = resolveDatabaseUrl();
  return {
    ok: false,
    step: migrationStep,
    migrationStep,
    error: serializeError(error),
    message: error?.message || String(error),
    stack: error?.stack || null,
    databaseUrlExists: Boolean(dbResolved.url),
    databaseUrlSource: dbResolved.source,
    ...extra,
  };
}

async function testSupabaseAuth() {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "Supabase admin not configured (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing)" };
  const { error } = await admin.from("auto_imported_content").select("id").limit(1);
  if (error) return { ok: false, error: error.message, code: error.code };
  return { ok: true };
}

export default async function handler(req, res) {
  migrationStep = "auth";

  try {
    if (!validateCronAuth(req)) {
      sendJson(res, 401, { ok: false, error: "Unauthorized" });
      return;
    }

    const action = req.query?.action || req.body?.action || "full";

    if (action === "verify") {
      migrationStep = "verify_schema";
      sendJson(res, 200, await verifySchema());
      return;
    }

    if (action === "connection") {
      migrationStep = "test_connection";
      const conn = await testDatabaseConnection();
      sendJson(res, conn.ok ? 200 : 500, {
        ...conn,
        resolved: {
          urlRedacted: resolveDatabaseUrl().urlRedacted,
          source: resolveDatabaseUrl().source,
          rawConfigured: resolveDatabaseUrl().rawConfigured,
          normalized: resolveDatabaseUrl().normalized,
          normalizeReason: resolveDatabaseUrl().normalizeReason,
        },
      });
      return;
    }

    if (action === "migrate") {
      migrationStep = "apply_migrations";
      const migrations = listAvailableMigrations();
      const result = await applyMigrations({ continueOnError: false });
      sendJson(res, result.ok ? 200 : 500, { migrations, ...result });
      return;
    }

    if (action === "phase2-trial-import") {
      migrationStep = "phase2_trial_import";
      const dryRun = req.query?.dryRun === "1" || req.body?.dryRun === true;
      const result = await runPhase2TrialImport(APP_ROOT, { dryRun });
      sendJson(res, result.ok ? 200 : 422, { ok: result.ok, action, ...result });
      return;
    }

    // Full bootstrap: env → connection → migrations → schema → sync → verify
    const started = Date.now();
    const steps = {};

    migrationStep = "resolve_database_url";
    steps.databaseUrl = {
      exists: Boolean(resolveDatabaseUrl().url),
      source: resolveDatabaseUrl().source,
    };

    migrationStep = "list_migrations";
    steps.migrations = listAvailableMigrations();
    if (!steps.migrations.ok) {
      const err = new Error(
        `Migration files missing: ${steps.migrations.missing?.join(", ") || "unknown"} (dir=${steps.migrations.dir})`,
      );
      logBootstrapError(migrationStep, err, steps);
      sendJson(res, 500, debugPayload(err, { steps, durationMs: Date.now() - started }));
      return;
    }

    migrationStep = "test_postgresql_connection";
    steps.connection = await testDatabaseConnection();
    if (!steps.connection.ok) {
      const err = new Error(steps.connection.error || "PostgreSQL connection failed");
      err.stack = steps.connection.stack || err.stack;
      logBootstrapError(migrationStep, err, { connection: steps.connection, databaseUrlExists: steps.databaseUrl.exists });
      sendJson(res, 500, debugPayload(err, { steps, connectionResult: steps.connection, durationMs: Date.now() - started }));
      return;
    }

    migrationStep = "supabase_auth";
    steps.supabaseAuth = await testSupabaseAuth();
    if (!steps.supabaseAuth.ok) {
      const err = new Error(`Supabase authentication failed: ${steps.supabaseAuth.error}`);
      logBootstrapError(migrationStep, err, steps);
      sendJson(res, 500, debugPayload(err, { steps, durationMs: Date.now() - started }));
      return;
    }

    migrationStep = "ensure_schema_ready";
    steps.schema = await ensureSchemaReady();
    if (!steps.schema.ok) {
      const schemaErr =
        steps.schema.migration?.results?.find((r) => !r.ok)?.error ||
        steps.schema.migration?.error ||
        JSON.stringify(steps.schema.schema?.checks || {});
      const err = new Error(`ensureSchemaReady() failed: ${schemaErr}`);
      logBootstrapError(migrationStep, err, steps);
      sendJson(res, 500, debugPayload(err, { steps, durationMs: Date.now() - started }));
      return;
    }

    migrationStep = "auto_content_sync";
    steps.sync = await runAutoContentSync({ triggerType: "bootstrap", skipSchemaCheck: true });

    migrationStep = "verify_published_content";
    steps.content = await getPublishedAutoContentFeed({ limit: 10 });

    const infrastructureOk =
      steps.connection?.ok &&
      steps.supabaseAuth?.ok &&
      steps.schema?.ok &&
      steps.migrations?.ok;
    const ok = infrastructureOk && steps.sync?.ok !== false;
    migrationStep = "complete";

    sendJson(res, infrastructureOk ? 200 : 500, {
      ok,
      infrastructureOk,
      step: migrationStep,
      steps: {
        databaseUrl: steps.databaseUrl,
        migrations: { ok: steps.migrations.ok, present: steps.migrations.present },
        connection: { ok: steps.connection.ok, source: steps.connection.source },
        supabaseAuth: steps.supabaseAuth,
        schema: { ok: steps.schema.ok, migrated: steps.schema.migrated },
        sync: {
          ok: steps.sync?.ok,
          imported: steps.sync?.imported,
          published: steps.sync?.published,
          failed: steps.sync?.failed,
          error: steps.sync?.error,
        },
        content: { count: steps.content?.items?.length ?? 0 },
      },
      durationMs: Date.now() - started,
    });
  } catch (error) {
    logBootstrapError(migrationStep, error, {
      databaseUrlExists: Boolean(resolveDatabaseUrl().url),
    });
    console.error("[bootstrap-database] unhandled error object:", error);
    console.error("[bootstrap-database] error.message:", error?.message);
    console.error("[bootstrap-database] error.stack:", error?.stack);
    sendJson(res, 500, debugPayload(error, { unhandled: true }));
  }
}
