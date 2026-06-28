/**
 * Production migration runner — tracked applies, per-step validation, seed hook.
 */

import { readFileSync } from "node:fs";
import { applyMigrations } from "./db-migrate.mjs";
import {
  ACTIVATION_MIGRATION_FILES,
  ACTIVATION_TABLES_MIGRATION_FILES,
  migrationFilePath,
} from "./migration-paths.mjs";
import { probeTables, ACTIVATION_TABLES, countTableRows } from "./table-probe.mjs";
import { seedRulingsFromFilesystem } from "./rulings-db-seed.mjs";
import { ensureTrackingTable, getAppliedMigrationNames } from "./migration-tracker.mjs";

/** Expected tables after each activation migration file. */
const STEP_TABLE_CHECKS = {
  "sharia_rulings_prereq.sql": ["sharia_rulings"],
  "sharia_rulings_encyclopedia_v1.sql": ["sharia_rulings", "sharia_ruling_categories"],
  "majlis_knowledge_engine_v1.sql": ["mke_source_plugins", "mke_runs", "mke_decisions", "mke_queue_jobs"],
  "majlis_knowledge_engine_v2.sql": ["mke_quality_reports"],
  "autonomous_platform_v1.sql": ["akp_content_sources", "akp_pipeline_runs"],
  "autonomous_platform_v3.sql": [
    "akp_source_health_snapshots",
    "akp_platform_analytics_daily",
    "akp_semantic_index",
    "akp_scheduler_state",
  ],
  "content_production_v1.sql": ["content_scheduler_jobs", "content_scheduler_runs", "content_production_staging"],
};

const ACTIVATION_TABLE_TARGETS = [
  "sharia_rulings",
  "sharia_ruling_categories",
  "mke_runs",
  "mke_queue_jobs",
  "mke_decisions",
  "mke_quality_reports",
  "mke_source_plugins",
  "akp_content_sources",
  "akp_pipeline_runs",
];

function shaShort(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

export async function getAppliedMigrations(client) {
  if (!client?.query) return [];
  try {
    await ensureTrackingTable(client);
    return getAppliedMigrationNames(client);
  } catch {
    return [];
  }
}

export async function runActivationTableMigrations(options = {}) {
  const files = options.files || ACTIVATION_TABLES_MIGRATION_FILES;
  const before = await probeTables(ACTIVATION_TABLE_TARGETS);
  const started = Date.now();

  const migration = await applyMigrations({
    files,
    continueOnError: false,
    trackApplied: true,
  });

  const after = await probeTables(ACTIVATION_TABLE_TARGETS);
  const stepValidation = {};
  for (const file of files) {
    const expected = STEP_TABLE_CHECKS[file] || [];
    stepValidation[file] = {
      expected,
      present: expected.filter((t) => after[t] === true),
      missing: expected.filter((t) => after[t] !== true),
      ok: expected.length === 0 || expected.every((t) => after[t] === true),
    };
  }

  let seed = null;
  if (options.seedRulings !== false && after.sharia_rulings) {
    const count = await countTableRows("sharia_rulings");
    if (count === 0) {
      seed = await seedRulingsFromFilesystem({ dryRun: options.dryRunSeed });
    } else {
      seed = { ok: true, skipped: true, reason: "already_seeded", count };
    }
  }

  const missing = ACTIVATION_TABLE_TARGETS.filter((t) => !after[t]);
  const ok = migration.ok && missing.length === 0;

  return {
    ok,
    durationMs: Date.now() - started,
    migration,
    before,
    after,
    stepValidation,
    seed,
    missing,
    files,
  };
}

const STEP_TABLE_CHECKS_FULL = {
  ...STEP_TABLE_CHECKS,
  "qa_categories_fix_v1.sql": ["qa_categories", "qa_questions"],
};

export async function runActivationMigrations(options = {}) {
  const files = options.files || ACTIVATION_MIGRATION_FILES;
  const before = await probeTables(ACTIVATION_TABLES);
  const started = Date.now();

  const migration = await applyMigrations({
    files,
    continueOnError: false,
    trackApplied: true,
  });

  const after = await probeTables(ACTIVATION_TABLES);
  const stepValidation = {};

  for (const file of files) {
    const expected = STEP_TABLE_CHECKS_FULL[file] || STEP_TABLE_CHECKS[file] || [];
    stepValidation[file] = {
      expected,
      present: expected.filter((t) => after[t] === true),
      missing: expected.filter((t) => after[t] !== true),
      ok: expected.length === 0 || expected.every((t) => after[t] === true),
    };
  }

  let seed = null;
  if (options.seedRulings !== false && after.sharia_rulings) {
    const count = await countTableRows("sharia_rulings");
    if (count === 0) {
      seed = await seedRulingsFromFilesystem({ dryRun: options.dryRunSeed });
    } else {
      seed = { ok: true, skipped: true, reason: "already_seeded", count };
    }
  }

  const missing = ACTIVATION_TABLES.filter((t) => !after[t]);
  const ok = migration.ok && missing.length === 0 && Object.values(stepValidation).every((s) => s.ok);

  return {
    ok,
    durationMs: Date.now() - started,
    migration,
    before,
    after,
    stepValidation,
    seed,
    missing,
  };
}

export function loadMigrationSql(filename) {
  return readFileSync(migrationFilePath(filename), "utf8");
}

export function migrationChecksum(filename) {
  return shaShort(loadMigrationSql(filename));
}

/** Manual rollback SQL — destructive; run only in emergency. */
export const ACTIVATION_ROLLBACK_SQL = `
-- EMERGENCY ROLLBACK — drops activation objects (data loss)
DROP TABLE IF EXISTS mke_quality_reports CASCADE;
DROP TABLE IF EXISTS mke_queue_jobs CASCADE;
DROP TABLE IF EXISTS mke_decisions CASCADE;
DROP TABLE IF EXISTS mke_runs CASCADE;
DROP TABLE IF EXISTS mke_source_plugins CASCADE;
DROP TABLE IF EXISTS sharia_ruling_imports CASCADE;
DROP TABLE IF EXISTS sharia_ruling_categories CASCADE;
-- sharia_rulings: keep if shared with other features
DELETE FROM schema_migrations WHERE migration_name LIKE '%knowledge_engine%' OR migration_name LIKE '%sharia_rulings%' OR migration_name LIKE '%qa_categories_fix%';
`;
