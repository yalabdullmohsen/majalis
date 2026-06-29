/**
 * Phase 2 — Smart migration detection (actual DB state vs project).
 */
import { readFileSync } from "node:fs";
import { getPgClient } from "../database.mjs";
import {
  listAvailableMigrations,
  AUTOMATION_RECOVERY_MIGRATION_FILES,
  SMART_CMS_MIGRATION_FILES,
  ACTIVATION_TABLES_MIGRATION_FILES,
  migrationFilePath,
} from "../migration-paths.mjs";
import { getAppliedMigrationNames, migrationChecksum } from "../migration-tracker.mjs";
import { probeTables } from "../table-probe.mjs";
import { AUTOMATION_RECOVERY_TABLES, SMART_CMS_TABLES } from "../migration-paths.mjs";

const SCOPE_DEFINITIONS = [
  {
    scope: "automation-recovery",
    files: AUTOMATION_RECOVERY_MIGRATION_FILES,
    tables: AUTOMATION_RECOVERY_TABLES,
  },
  {
    scope: "smart-cms",
    files: SMART_CMS_MIGRATION_FILES,
    tables: SMART_CMS_TABLES,
  },
  {
    scope: "activation-tables",
    files: ACTIVATION_TABLES_MIGRATION_FILES,
    tables: ["sharia_rulings", "mke_runs", "akp_content_sources", "akp_pipeline_runs"],
  },
  {
    scope: "cd-pipeline",
    files: ["cd_pipeline_v1.sql"],
    tables: ["cd_deployments", "cd_pipeline_runs", "cd_self_heal_events"],
  },
];

async function tableExistsViaPg(client, table) {
  const { rows } = await client.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS ok`,
    [table],
  );
  return rows[0]?.ok === true;
}

export async function detectMigrationState() {
  const started = Date.now();
  const available = listAvailableMigrations();
  const allFiles = available.allSqlInDir || available.present || [];

  let applied = [];
  let appliedDetails = [];
  let client = null;

  try {
    client = await getPgClient();
  } catch {
    /* rest-only mode */
  }

  if (client) {
    try {
      applied = await getAppliedMigrationNames(client);
      for (const name of applied) {
        let checksumMatch = null;
        try {
          const sql = readFileSync(migrationFilePath(name), "utf8");
          const { rows } = await client.query(
            "SELECT checksum FROM schema_migrations WHERE migration_name = $1",
            [name],
          );
          const stored = rows[0]?.checksum;
          checksumMatch = stored ? stored === migrationChecksum(sql) : null;
        } catch {
          checksumMatch = null;
        }
        appliedDetails.push({ name, checksumMatch });
      }
    } finally {
      await client.end().catch(() => {});
    }
  }

  const appliedSet = new Set(applied);
  const pending = allFiles.filter((f) => !appliedSet.has(f));
  const failed = [];
  const scopeStatus = [];

  for (const def of SCOPE_DEFINITIONS) {
    const tablesProbe = await probeTables(def.tables);
    const missingTables = def.tables.filter((t) => tablesProbe[t] !== true);
    const scopeApplied = def.files.filter((f) => appliedSet.has(f));
    const scopePending = def.files.filter((f) => !appliedSet.has(f) && allFiles.includes(f));

    let status = "ok";
    if (missingTables.length > 0 && scopeApplied.length > 0) {
      status = "failed";
      for (const f of scopeApplied) {
        if (missingTables.length) {
          failed.push({ migration: f, scope: def.scope, reason: `tables_missing: ${missingTables.slice(0, 3).join(", ")}` });
        }
      }
    } else if (missingTables.length > 0) {
      status = "pending";
    } else if (scopePending.length > 0) {
      status = "partial";
    }

    scopeStatus.push({
      scope: def.scope,
      status,
      applied: scopeApplied.length,
      pending: scopePending.length,
      total: def.files.length,
      missingTables,
      filesApplied: scopeApplied,
      filesPending: scopePending,
    });
  }

  const checksumDrift = appliedDetails.filter((d) => d.checksumMatch === false).map((d) => d.name);

  return {
    ok: failed.length === 0 && pending.filter((f) => !appliedSet.has(f)).length === 0,
    applied: { count: applied.length, names: applied.slice(-20), details: appliedDetails.slice(-30) },
    pending: { count: pending.length, names: pending.slice(0, 30) },
    failed: { count: failed.length, items: failed },
    scopes: scopeStatus,
    checksumDrift,
    dir: available.dir,
    totalSqlFiles: allFiles.length,
    durationMs: Date.now() - started,
  };
}
