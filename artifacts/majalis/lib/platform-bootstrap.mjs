/**
 * Platform Self-Bootstrap — migrations, seed, production verification.
 * Fail-fast, idempotent, no duplicate data.
 */

import { getEnvStatus } from "./env-config.mjs";
import { resolveDatabaseUrl, testDatabaseConnection } from "./database.mjs";
import { applyMigrations, verifySchema } from "./db-migrate.mjs";
import { MIGRATION_FILES, listAvailableMigrations } from "./migration-paths.mjs";
import { probeTables, ACTIVATION_TABLES, countTableRows } from "./table-probe.mjs";
import { CORE_DB_TABLES, PRODUCTION_APIS, USER_FACING_ROUTES } from "./release-gate.mjs";
import { runPlatformSeed } from "./platform-seed.mjs";
import { getAppliedMigrationNames } from "./migration-tracker.mjs";
import { getPgClient } from "./database.mjs";
import {
  startBootstrapRun,
  updateBootstrapRun,
  finishBootstrapRun,
  getLatestBootstrapRun,
  isBootstrapRunning,
} from "./platform-bootstrap-state.mjs";

const PRODUCTION_BASE = process.env.MAJALIS_PRODUCTION_URL || "https://www.majlisilm.com";

const SECRET_HINTS = {
  VITE_SUPABASE_URL: "Supabase project URL (https://xxx.supabase.co)",
  VITE_SUPABASE_ANON_KEY: "Supabase anon/public key",
  SUPABASE_SERVICE_ROLE_KEY: "Supabase service role key (server only)",
  DATABASE_URL: "Supabase Transaction Pooler URL (port 6543, *.pooler.supabase.com)",
  SUPABASE_ACCESS_TOKEN: "Supabase personal access token (alternative to DATABASE_URL)",
  POSTGRES_PASSWORD: "Database password with POSTGRES_URL for migrations",
  CRON_SECRET: "Random secret for /api/cron/* authentication",
};

const REQUIRED_TABLES = [...new Set([...CORE_DB_TABLES, ...ACTIVATION_TABLES])];

function buildOwnerActions(missingKeys) {
  return missingKeys.map((key) => ({
    secret: key,
    addTo: "Vercel → Project → Settings → Environment Variables (Production)",
    hint: SECRET_HINTS[key] || "Required for self-bootstrap",
  }));
}

function checkBootstrapSecrets() {
  const env = getEnvStatus();
  const missing = [];

  const hasUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const hasAnon = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  const hasServiceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasUrl) missing.push("VITE_SUPABASE_URL");
  if (!hasAnon) missing.push("VITE_SUPABASE_ANON_KEY");
  if (!hasServiceRole) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  const hasMigrationPath =
    env.DATABASE_URL ||
    env.POSTGRES_URL ||
    env.POSTGRES_PASSWORD ||
    env.SUPABASE_ACCESS_TOKEN;

  if (!hasMigrationPath) {
    missing.push("DATABASE_URL");
  }

  return {
    ok: missing.length === 0,
    env,
    missing,
    ownerActions: buildOwnerActions(missing),
    migrationPath: env.DATABASE_URL
      ? "database_url"
      : env.SUPABASE_ACCESS_TOKEN
        ? "management_api"
        : env.POSTGRES_PASSWORD
          ? "postgres_parts"
          : "none",
  };
}

async function probeRequiredTables() {
  const probed = await probeTables(REQUIRED_TABLES);
  const present = REQUIRED_TABLES.filter((t) => probed[t] === true);
  const missing = REQUIRED_TABLES.filter((t) => probed[t] !== true);
  return {
    ok: missing.length === 0,
    present,
    missing,
    detail: probed,
  };
}

async function getMigrationStatus() {
  let applied = [];
  try {
    const clientInfo = await getPgClient();
    const { client } = clientInfo;
    try {
      applied = await getAppliedMigrationNames(client);
    } finally {
      await client.end().catch(() => {});
    }
  } catch {
    /* no pg — rely on table probe */
  }

  const available = listAvailableMigrations();
  const pending = (available.present || MIGRATION_FILES).filter((f) => !applied.includes(f));

  return {
    available: available.ok,
    appliedCount: applied.length,
    pendingCount: pending.length,
    applied,
    pending: pending.slice(0, 20),
    migrationsDir: available.dir,
    filesMissing: available.missing || [],
  };
}

async function runProductionSmokeTests(base = PRODUCTION_BASE) {
  const checks = [];

  for (const api of PRODUCTION_APIS) {
    const started = Date.now();
    try {
      const res = await fetch(`${base}${api.path}`, {
        method: api.method || "GET",
        headers: api.method === "POST" ? { "Content-Type": "application/json" } : {},
        body: api.method === "POST" ? JSON.stringify({ message: "ما حكم الوضوء؟" }) : undefined,
      });
      let json = null;
      try {
        json = await res.json();
      } catch {
        /* ignore */
      }
      const ok = api.expectOk ? res.ok && json?.ok !== false : res.status < 500;
      checks.push({
        name: `api:${api.path}`,
        ok,
        status: res.status,
        ms: Date.now() - started,
      });
    } catch (err) {
      checks.push({ name: `api:${api.path}`, ok: false, error: err.message });
    }
  }

  for (const route of USER_FACING_ROUTES.slice(0, 8)) {
    try {
      const res = await fetch(`${base}${route}`, { redirect: "follow" });
      const text = await res.text();
      checks.push({
        name: `route:${route}`,
        ok: res.status === 200 && !text.includes("تعذر عرض هذه الصفحة"),
        status: res.status,
      });
    } catch (err) {
      checks.push({ name: `route:${route}`, ok: false, error: err.message });
    }
  }

  const tableChecks = await probeRequiredTables();
  checks.push({
    name: "tables:core",
    ok: tableChecks.ok,
    missing: tableChecks.missing,
  });

  const rulingsCount = await countTableRows("sharia_rulings");
  checks.push({
    name: "seed:sharia_rulings",
    ok: (rulingsCount ?? 0) > 0,
    count: rulingsCount,
  });

  const qaCatCount = await countTableRows("qa_categories");
  checks.push({
    name: "seed:qa_categories",
    ok: (qaCatCount ?? 0) >= 10,
    count: qaCatCount,
  });

  return {
    ok: checks.every((c) => c.ok),
    checks,
    failed: checks.filter((c) => !c.ok),
  };
}

function stepResult(name, ok, detail = {}) {
  return { step: name, ok, at: new Date().toISOString(), ...detail };
}

async function failRun(runId, steps, step, error, ownerActions = []) {
  await finishBootstrapRun(runId, {
    ok: false,
    error,
    steps,
    ownerActions,
    productionReady: false,
  });
  return {
    ok: false,
    stoppedAt: step,
    error,
    steps,
    ownerActions,
    bootstrap: buildBootstrapFlags(steps, false),
  };
}

function buildBootstrapFlags(steps, productionReady) {
  const byStep = Object.fromEntries(steps.map((s) => [s.step, s.ok]));
  const dbConnected = byStep.database_connection === true;
  const schemaVerified = byStep.verify_schema === true;
  return {
    databaseReady: dbConnected && schemaVerified,
    migrationsApplied: byStep.apply_migrations === true && schemaVerified,
    seedCompleted:
      byStep.seed_categories === true &&
      byStep.seed_rulings === true &&
      (byStep.seed_owners === true || byStep.seed_owners === undefined),
    productionReady: Boolean(productionReady),
  };
}

/**
 * Full self-bootstrap pipeline — stops on first failure.
 */
export async function runPlatformBootstrap(options = {}) {
  if (!options.force && (await isBootstrapRunning())) {
    return {
      ok: false,
      stoppedAt: "concurrent_run",
      error: "Bootstrap already running — wait for the current run to finish",
      steps: [],
      ownerActions: [],
      bootstrap: {
        databaseReady: false,
        migrationsApplied: false,
        seedCompleted: false,
        productionReady: false,
      },
    };
  }

  const steps = [];
  const run = await startBootstrapRun("precheck_secrets");
  const runId = run?.id;

  try {
    // 1. Secrets
    const precheck = checkBootstrapSecrets();
    steps.push(stepResult("precheck_secrets", precheck.ok, { missing: precheck.missing }));
    await updateBootstrapRun(runId, { current_step: "precheck_secrets", steps });
    if (!precheck.ok) {
      return failRun(
        runId,
        steps,
        "precheck_secrets",
        `Missing secrets: ${precheck.missing.join(", ")}`,
        precheck.ownerActions,
      );
    }

    // 2. DB connection
    const conn = await testDatabaseConnection();
    steps.push(stepResult("database_connection", conn.ok, { source: conn.source }));
    await updateBootstrapRun(runId, { current_step: "database_connection", steps });
    if (!conn.ok && precheck.migrationPath === "database_url") {
      return failRun(
        runId,
        steps,
        "database_connection",
        conn.error || "Database connection failed",
        buildOwnerActions(["DATABASE_URL"]),
      );
    }

    // 3. Probe tables (before migrations)
    const beforeProbe = await probeRequiredTables();
    steps.push(
      stepResult("probe_tables", true, {
        missingBefore: beforeProbe.missing,
        presentCount: beforeProbe.present.length,
      }),
    );
    await updateBootstrapRun(runId, { current_step: "probe_tables", steps });

    // 4. Apply migrations (tracked, ordered — skips already-applied files only)
    const migration = await applyMigrations({
      continueOnError: false,
      trackApplied: true,
    });
    steps.push(
      stepResult("apply_migrations", migration.ok, {
        applied: migration.results?.filter((r) => r.ok && !r.skipped)?.length ?? 0,
        skipped: migration.results?.filter((r) => r.skipped)?.length ?? 0,
        failed: migration.results?.find((r) => !r.ok),
        error: migration.error,
        missingTablesBefore: beforeProbe.missing,
      }),
    );
    await updateBootstrapRun(runId, { current_step: "apply_migrations", steps });
    if (!migration.ok) {
      return failRun(
        runId,
        steps,
        "apply_migrations",
        migration.error ||
          migration.results?.find((r) => !r.ok)?.error ||
          "Migration apply failed",
        buildOwnerActions(["DATABASE_URL", "SUPABASE_ACCESS_TOKEN"]),
      );
    }

    // 5. Verify schema + activation tables
    const afterProbe = await probeRequiredTables();
    const schema = await verifySchema();
    let activation = null;
    if (afterProbe.missing.length > 0) {
      const { runActivationMigrations } = await import("./migration-runner.mjs");
      activation = await runActivationMigrations({ seedRulings: true });
      const afterActivation = await probeRequiredTables();
      afterProbe.missing = afterActivation.missing;
      afterProbe.present = afterActivation.present;
    }
    const migrationsOk = afterProbe.missing.length === 0;
    steps.push(
      stepResult("verify_schema", migrationsOk && schema.ok !== false, {
        missing: afterProbe.missing,
        schemaOk: schema.ok,
        activation,
      }),
    );
    await updateBootstrapRun(runId, { current_step: "verify_schema", steps });
    if (!migrationsOk) {
      return failRun(
        runId,
        steps,
        "verify_schema",
        `Missing tables after migration: ${afterProbe.missing.join(", ")}`,
        buildOwnerActions(["DATABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]),
      );
    }

    // 6–9. Seed (idempotent upsert)
    const seed = await runPlatformSeed({ seedOwners: options.seedOwners !== false });
    steps.push(stepResult("seed_categories", seed.results?.qaCategories?.ok !== false, seed.results?.qaCategories));
    steps.push(stepResult("seed_rulings", seed.results?.rulings?.ok !== false, seed.results?.rulings));
    steps.push(
      stepResult("seed_ruling_categories", seed.results?.rulingCategories?.ok !== false, seed.results?.rulingCategories),
    );
    steps.push(stepResult("seed_owners", seed.results?.owners?.ok !== false, seed.results?.owners));
    await updateBootstrapRun(runId, { current_step: "seed", steps });
    if (!seed.ok) {
      return failRun(
        runId,
        steps,
        seed.step || "seed",
        seed.results?.[seed.step?.replace("seed_", "")]?.error || "Seed failed",
        buildOwnerActions(["SUPABASE_SERVICE_ROLE_KEY"]),
      );
    }

    // 10. Production smoke tests
    const tests = await runProductionSmokeTests(options.productionBase || PRODUCTION_BASE);
    steps.push(stepResult("production_tests", tests.ok, { failed: tests.failed, total: tests.checks.length }));
    await updateBootstrapRun(runId, { current_step: "production_tests", steps });
    if (!tests.ok && !options.skipProductionTests) {
      return failRun(
        runId,
        steps,
        "production_tests",
        `Production tests failed: ${tests.failed.map((f) => f.name).join(", ")}`,
        [],
      );
    }

    const bootstrap = buildBootstrapFlags(steps, tests.ok);
    bootstrap.databaseReady = true;
    bootstrap.migrationsApplied = true;
    bootstrap.seedCompleted = true;
    bootstrap.productionReady = tests.ok;

    await finishBootstrapRun(runId, {
      ok: true,
      steps,
      productionReady: tests.ok,
      ownerActions: [],
    });

    return {
      ok: tests.ok,
      steps,
      bootstrap,
      seed,
      migrationStatus: await getMigrationStatus(),
      databaseUrl: resolveDatabaseUrl().urlRedacted,
      durationMs: Date.now() - new Date(run.started_at).getTime(),
    };
  } catch (err) {
    steps.push(stepResult("unhandled", false, { error: err.message }));
    return failRun(runId, steps, "unhandled", err.message, []);
  }
}

/** Read-only bootstrap status for admin dashboard */
export async function getPlatformBootstrapStatus() {
  const precheck = checkBootstrapSecrets();
  const probe = await probeRequiredTables();
  const migrationStatus = await getMigrationStatus();
  const latestRun = await getLatestBootstrapRun();

  const qaCount = await countTableRows("qa_categories");
  const rulingsCount = await countTableRows("sharia_rulings");

  const seedCompleted =
    (qaCount ?? 0) >= 10 && (rulingsCount ?? 0) > 0;

  const databaseReady = precheck.ok && (probe.ok || migrationStatus.appliedCount > 0);
  const migrationsApplied = probe.ok && migrationStatus.pendingCount === 0;

  let productionReady = latestRun?.production_ready === true;
  if (!productionReady && databaseReady && migrationsApplied && seedCompleted) {
    const tests = await runProductionSmokeTests();
    productionReady = tests.ok;
  }

  const bootstrap = {
    databaseReady,
    migrationsApplied,
    seedCompleted,
    productionReady,
    lastRun: latestRun?.completed_at || latestRun?.started_at || null,
    lastStatus: latestRun?.status || null,
    lastError: latestRun?.error || null,
    ownerActions: latestRun?.owner_actions || precheck.ownerActions,
  };

  return {
    ok: bootstrap.productionReady,
    bootstrap,
    precheck,
    probe: { ok: probe.ok, missing: probe.missing, presentCount: probe.present.length },
    migrationStatus,
    counts: { qa_categories: qaCount, sharia_rulings: rulingsCount },
    canRunBootstrap: precheck.ok,
    ownerActions: precheck.ok ? [] : precheck.ownerActions,
  };
}

export { checkBootstrapSecrets, runProductionSmokeTests, getMigrationStatus };
