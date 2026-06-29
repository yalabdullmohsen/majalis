/**
 * Smart CMS — production activation helpers (migrations, probes, integrity).
 */
import { applyMigrations } from "./db-migrate.mjs";
import { ensureContentImportSchema } from "./content-import/ensure-schema.mjs";
import { SMART_CMS_MIGRATION_FILES, SMART_CMS_TABLES } from "./migration-paths.mjs";
import { probeTables, countTableRows } from "./table-probe.mjs";
import { getPgClient } from "./database.mjs";

export { SMART_CMS_MIGRATION_FILES, SMART_CMS_TABLES };

export async function probeSmartCmsTables() {
  const tables = await probeTables(SMART_CMS_TABLES);
  const counts = {};
  for (const table of SMART_CMS_TABLES) {
    counts[table] = await countTableRows(table);
  }
  const missing = SMART_CMS_TABLES.filter((t) => tables[t] !== true);
  return { ok: missing.length === 0, tables, counts, missing };
}

export async function runSmartCmsMigrations(options = {}) {
  const started = Date.now();
  const before = await probeSmartCmsTables();

  const migration = await applyMigrations({
    files: options.files || SMART_CMS_MIGRATION_FILES,
    continueOnError: false,
    trackApplied: true,
    force: options.force === true,
  });

  const importSchema = await ensureContentImportSchema().catch((err) => ({
    ok: false,
    error: String(err.message || err),
  }));

  const after = await probeSmartCmsTables();
  const ok = migration.ok && after.ok && importSchema.ok !== false;

  return {
    ok,
    durationMs: Date.now() - started,
    before,
    after,
    migration,
    importSchema,
  };
}

export async function checkSmartCmsDataIntegrity() {
  const issues = [];
  let client;
  try {
    ({ client } = await getPgClient());
  } catch (err) {
    return { ok: false, error: String(err.message || err), issues: [{ code: "no_database", message: err.message }] };
  }

  try {
    const checks = [
      {
        code: "orphan_import_staging",
        sql: `SELECT COUNT(*)::int AS n FROM content_import_staging s
              WHERE NOT EXISTS (SELECT 1 FROM content_import_jobs j WHERE j.id = s.job_id)`,
      },
      {
        code: "orphan_dedup_keys",
        sql: `SELECT COUNT(*)::int AS n FROM content_dedup_keys d
              WHERE d.record_id IS NOT NULL AND NOT EXISTS (
                SELECT 1 FROM information_schema.tables t WHERE t.table_name = d.record_table
              )`,
      },
      {
        code: "duplicate_lesson_slugs",
        sql: `SELECT COUNT(*)::int AS n FROM (
                SELECT slug FROM lessons WHERE slug IS NOT NULL GROUP BY slug HAVING COUNT(*) > 1
              ) dup`,
      },
      {
        code: "drafts_missing_kind",
        sql: `SELECT COUNT(*)::int AS n FROM content_drafts WHERE content_kind IS NULL OR content_kind = ''`,
      },
      {
        code: "published_drafts_without_target",
        sql: `SELECT COUNT(*)::int AS n FROM content_drafts
              WHERE workflow_status = 'published' AND target_record_id IS NULL`,
      },
    ];

    for (const check of checks) {
      try {
        const { rows } = await client.query(check.sql);
        const n = rows[0]?.n ?? 0;
        if (n > 0) issues.push({ code: check.code, count: n, severity: "warning" });
      } catch (err) {
        if (/does not exist|relation/i.test(String(err.message))) {
          issues.push({ code: check.code, severity: "skipped", message: "table_missing" });
        } else {
          issues.push({ code: check.code, severity: "error", message: String(err.message) });
        }
      }
    }

    const importStats = await client.query(`
      SELECT status, COUNT(*)::int AS n
      FROM content_import_jobs
      GROUP BY status
    `).catch(() => ({ rows: [] }));

    return {
      ok: issues.filter((i) => i.severity === "error").length === 0,
      issues,
      importJobsByStatus: Object.fromEntries(importStats.rows.map((r) => [r.status, r.n])),
    };
  } finally {
    await client?.end().catch(() => {});
  }
}

export const SMART_CMS_CRON_PATHS = [
  "/api/cron/process-import-jobs",
  "/api/cron/source-monitor",
  "/api/cron/lesson-intelligence",
  "/api/cron/lesson-source-monitor",
  "/api/cron/monitor-sources",
  "/api/cron/content-scheduler",
  "/api/cron/content-engines",
  "/api/cron/content-engines-drain",
  "/api/cron/sync-data",
  "/api/cron/question-answer-daily",
  "/api/cron/apply-migrations?scope=smart-cms",
];

export const SMART_CMS_ADMIN_ROUTES = [
  "/admin/cms",
  "/admin/collector",
  "/admin/automation/review",
  "/admin/automation/sources",
  "/admin/content-import/url",
  "/admin/content-import/image",
  "/contribute",
];

export const SMART_CMS_API_ROUTES = [
  "/api/admin/smart-cms",
  "/api/admin/content-import",
  "/api/admin/lesson-from-image",
  "/api/admin/lesson-from-url",
  "/api/admin/source-monitor",
];
