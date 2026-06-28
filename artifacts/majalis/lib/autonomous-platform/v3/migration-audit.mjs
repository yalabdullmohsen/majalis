/**
 * Expected vs Actual migration audit for autonomous_platform_v3.sql
 */
import { existsSync } from "node:fs";
import { probeTables } from "../../table-probe.mjs";
import { migrationFilePath } from "../../migration-paths.mjs";
import { getEnvStatus } from "../../env-config.mjs";
import { getPgClient } from "../../database.mjs";

export const V3_EXPECTED = {
  migrationFile: "autonomous_platform_v3.sql",
  prerequisite: "autonomous_platform_v1.sql",
  tables: [
    "akp_content_sources",
    "akp_pipeline_runs",
    "akp_source_health_snapshots",
    "akp_source_discoveries",
    "akp_platform_analytics_daily",
    "akp_daily_goal_progress",
    "akp_self_healing_events",
    "akp_audit_log",
    "akp_backup_snapshots",
    "akp_semantic_index",
    "akp_scheduler_state",
  ],
  indexes: [
    "akp_sources_health_idx",
    "akp_health_snapshots_source_idx",
    "akp_discoveries_status_idx",
    "akp_self_healing_created_idx",
    "akp_audit_log_created_idx",
    "akp_semantic_index_type_idx",
  ],
  policies: [
    "akp_v3_admin_health",
    "akp_v3_admin_discoveries",
    "akp_v3_admin_analytics",
    "akp_v3_admin_goals",
    "akp_v3_admin_healing",
    "akp_v3_admin_audit",
    "akp_v3_admin_backup",
    "akp_v3_admin_semantic",
    "akp_v3_admin_scheduler",
  ],
  columnExtensions: [
    "akp_content_sources.health_score",
    "akp_content_sources.items_extracted_total",
    "akp_content_sources.avg_fetch_ms",
    "akp_content_sources.fallback_source_id",
  ],
};

async function probePgObjects(names, sql) {
  const env = getEnvStatus();
  if (!env.DATABASE_URL) {
    return {
      ok: false,
      skipped: true,
      reason: "Missing DATABASE_URL — cannot verify indexes/policies via pg_catalog",
      present: [],
      missing: names,
    };
  }

  try {
    const { client } = await getPgClient();
    try {
      const { rows } = await client.query(sql, [names]);
      const found = new Set(rows.map((r) => r.name));
      const present = names.filter((n) => found.has(n));
      const missing = names.filter((n) => !found.has(n));
      return { ok: missing.length === 0, present, missing, skipped: false };
    } finally {
      await client.end().catch(() => {});
    }
  } catch (err) {
    return { ok: false, skipped: true, reason: err.message, present: [], missing: names };
  }
}

export async function auditV3Migration() {
  const probed = await probeTables(V3_EXPECTED.tables);
  const tablesActual = {
    present: V3_EXPECTED.tables.filter((t) => probed[t] === true),
    missing: V3_EXPECTED.tables.filter((t) => probed[t] !== true),
  };

  const indexesActual = await probePgObjects(
    V3_EXPECTED.indexes,
    `SELECT indexname AS name FROM pg_indexes WHERE indexname = ANY($1::text[])`,
  );

  const policiesActual = await probePgObjects(
    V3_EXPECTED.policies,
    `SELECT policyname AS name FROM pg_policies WHERE policyname = ANY($1::text[])`,
  );

  let sqlFileExists = false;
  try {
    sqlFileExists = existsSync(migrationFilePath(V3_EXPECTED.migrationFile));
  } catch {
    sqlFileExists = false;
  }

  const tableOk = tablesActual.missing.length === 0;
  const indexOk = indexesActual.skipped ? null : indexesActual.ok;
  const policyOk = policiesActual.skipped ? null : policiesActual.ok;

  const parts = [tableOk];
  if (indexOk !== null) parts.push(indexOk);
  if (policyOk !== null) parts.push(policyOk);
  const ok = parts.every(Boolean);

  return {
    ok,
    migrationFile: V3_EXPECTED.migrationFile,
    sqlFileExists,
    expected: V3_EXPECTED,
    actual: {
      tables: tablesActual,
      indexes: indexesActual,
      policies: policiesActual,
    },
    appliedPct: Math.round((tablesActual.present.length / V3_EXPECTED.tables.length) * 100),
    blockers: [
      ...tablesActual.missing.map((t) => ({ type: "table", name: t, fix: "Run apply-migrations cron" })),
      ...(indexesActual.missing || []).map((i) => ({ type: "index", name: i, fix: "Re-apply autonomous_platform_v3.sql" })),
      ...(policiesActual.missing || []).map((p) => ({ type: "policy", name: p, fix: "Re-apply autonomous_platform_v3.sql" })),
    ],
  };
}
