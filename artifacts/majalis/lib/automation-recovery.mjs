/**
 * Production automation recovery — migration bundle + table probes.
 */
import { applyMigrations } from "./db-migrate.mjs";
import {
  AUTOMATION_RECOVERY_MIGRATION_FILES,
  AUTOMATION_RECOVERY_TABLES,
  AKP_V3_MIGRATION_FILES,
} from "./migration-paths.mjs";
import { probeTables, countTableRows } from "./table-probe.mjs";
import { ensureContentImportSchema } from "./content-import/ensure-schema.mjs";
import { ensureAkeRpcFunctions } from "./auto-knowledge-engine/rpc-probe.mjs";
import { applySinJeemMigration } from "./sin-jeem-migration.mjs";

export async function probeAutomationRecoveryTables() {
  const tables = await probeTables(AUTOMATION_RECOVERY_TABLES);
  const counts = {};
  for (const table of AUTOMATION_RECOVERY_TABLES) {
    counts[table] = await countTableRows(table);
  }
  const missing = AUTOMATION_RECOVERY_TABLES.filter((t) => tables[t] !== true);
  return { ok: missing.length === 0, tables, counts, missing };
}

export async function runAutomationRecoveryMigrations(options = {}) {
  const started = Date.now();
  const before = await probeAutomationRecoveryTables();

  const migration = await applyMigrations({
    files: options.files || AUTOMATION_RECOVERY_MIGRATION_FILES,
    continueOnError: false,
    trackApplied: true,
    force: options.force === true,
  });

  const importSchema = await ensureContentImportSchema().catch((err) => ({
    ok: false,
    error: String(err.message || err),
  }));

  let sinJeem = { ok: true, skipped: true };
  if (options.includeSinJeem !== false) {
    sinJeem = await applySinJeemMigration({ force: options.force === true });
  }

  let akeRpc = { ok: true, skipped: true };
  if (options.includeAkeRpc !== false) {
    akeRpc = await ensureAkeRpcFunctions({ force: options.force === true });
  }

  const after = await probeAutomationRecoveryTables();
  const ok =
    migration.ok &&
    after.ok &&
    importSchema.ok !== false &&
    sinJeem.ok !== false &&
    akeRpc.ok !== false;

  return {
    ok,
    durationMs: Date.now() - started,
    before,
    after,
    migration,
    importSchema,
    sinJeem,
    akeRpc,
  };
}

export async function runAkpV3Migrations(options = {}) {
  const migration = await applyMigrations({
    files: options.files || AKP_V3_MIGRATION_FILES,
    continueOnError: false,
    trackApplied: true,
    force: options.force === true,
  });
  const tables = await probeTables([
    "akp_content_sources",
    "akp_pipeline_runs",
    "akp_source_health_snapshots",
    "akp_scheduler_state",
  ]);
  const counts = {
    akp_content_sources: await countTableRows("akp_content_sources"),
    akp_pipeline_runs: await countTableRows("akp_pipeline_runs"),
  };
  const missing = Object.entries(tables).filter(([, v]) => v !== true).map(([k]) => k);
  return { ok: migration.ok && missing.length === 0, migration, tables, counts, missing };
}
