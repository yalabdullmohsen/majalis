#!/usr/bin/env node
/**
 * Verify Phase 8 AKE monitoring — alerts, cron tracking, pipeline failures, daily reports.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { AKE_MONITORED_CRONS, PIPELINE_STAGES, expectedMaxGapMinutes } from "../lib/auto-knowledge-engine/monitoring/cron-registry.mjs";
import { createAkeAlert, resolveAkeAlert, getOpenAlerts } from "../lib/auto-knowledge-engine/alerts.mjs";
import { recordPipelineFailure } from "../lib/auto-knowledge-engine/monitoring/pipeline-failures.mjs";
import { recordSourceHealthEvent } from "../lib/auto-knowledge-engine/monitoring/source-health-events.mjs";
import { beginCronRun, finishCronRun } from "../lib/auto-knowledge-engine/monitoring/cron-tracker.mjs";
import { getMonitoringDashboard } from "../lib/auto-knowledge-engine/monitoring/dashboard.mjs";
import { sendTestAlert } from "../lib/auto-knowledge-engine/monitoring/rules.mjs";
import { severityMeetsMinimum } from "../lib/auto-knowledge-engine/monitoring/notify.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

let passed = 0;
let failed = 0;

function ok(cond, msg) {
  if (cond) {
    passed += 1;
    console.log(`✓ ${msg}`);
  } else {
    failed += 1;
    console.error(`✗ ${msg}`);
  }
}

// ── Static file checks ──────────────────────────────────────────────────────
const migrationPath = join(root, "supabase/auto_knowledge_engine_v17_monitoring.sql");
ok(existsSync(migrationPath), "Migration auto_knowledge_engine_v17_monitoring.sql exists");
const migrationSql = readFileSync(migrationPath, "utf8");
ok(migrationSql.includes("ake_alerts"), "Migration extends ake_alerts");
ok(migrationSql.includes("ake_daily_reports"), "Migration creates ake_daily_reports");
ok(migrationSql.includes("ake_cron_runs"), "Migration creates ake_cron_runs");
ok(migrationSql.includes("ake_pipeline_failures"), "Migration creates ake_pipeline_failures");
ok(migrationSql.includes("ake_source_health_events"), "Migration creates ake_source_health_events");
ok(migrationSql.includes("ake_notification_preferences"), "Migration creates ake_notification_preferences");

ok(existsSync(join(root, "lib/api-handlers/admin/ake-monitoring.js")), "Admin API handler exists");
ok(existsSync(join(root, "lib/api-handlers/cron/ake-daily-report.js")), "Daily report cron exists");
ok(existsSync(join(root, "lib/api-handlers/cron/ake-monitoring-eval.js")), "Monitoring eval cron exists");
ok(existsSync(join(root, "src/views/admin/PlatformMonitoringPage.tsx")), "Monitoring dashboard page exists");

const vercel = readFileSync(join(root, "vercel.json"), "utf8");
ok(vercel.includes("/api/cron/ake-daily-report"), "Vercel cron: daily report");
ok(vercel.includes("/api/cron/ake-monitoring-eval"), "Vercel cron: monitoring eval");

const appTsx = readFileSync(join(root, "src/App.tsx"), "utf8");
ok(appTsx.includes("/admin/platform/monitoring"), "Route /admin/platform/monitoring registered");

// ── Cron registry ───────────────────────────────────────────────────────────
ok(AKE_MONITORED_CRONS.length >= 10, `${AKE_MONITORED_CRONS.length} monitored crons`);
ok(AKE_MONITORED_CRONS.some((c) => c.name === "auto-knowledge-sync"), "Monitors auto-knowledge-sync");
ok(AKE_MONITORED_CRONS.some((c) => c.name === "content-engines"), "Monitors content-engines");
ok(PIPELINE_STAGES.includes("publish"), "Pipeline stages include publish");
ok(expectedMaxGapMinutes("*/15 * * * *") === 15, "Cron gap parser for */15");

// ── Severity filter ─────────────────────────────────────────────────────────
ok(severityMeetsMinimum("critical", "warning"), "Critical meets warning threshold");
ok(!severityMeetsMinimum("info", "warning"), "Info below warning threshold");

// ── Runtime without DB (console fallback) ───────────────────────────────────
const alert1 = await createAkeAlert({
  type: "verify_test",
  severity: "info",
  title: "Verify test alert",
  message: "Phase 8 verification",
  dedupeKey: `verify_test:${Date.now()}`,
});
ok(alert1.logged || alert1.created || alert1.updated, "createAkeAlert runs without DB");

const pf = await recordPipelineFailure({
  stage: "publish",
  errorMessage: "verify publish failure",
  engineName: "verify",
});
ok(pf === null || typeof pf === "string", "recordPipelineFailure runs");

await recordSourceHealthEvent({
  connectorSlug: "verify-source",
  eventType: "fetch_failed",
  errorMessage: "verify fetch",
  alertOnFailure: false,
});
ok(true, "recordSourceHealthEvent runs");

const cronRef = await beginCronRun("verify-cron", { schedule: "* * * * *" });
await finishCronRun(cronRef, { ok: true, result: { published: 1 } });
ok(true, "Cron tracker begin/finish runs");

const dashboard = await getMonitoringDashboard();
ok(typeof dashboard.systemStatus === "string", "Dashboard aggregator returns systemStatus");
ok(Array.isArray(dashboard.openAlerts), "Dashboard returns openAlerts array");
ok(Array.isArray(dashboard.cronStatus), "Dashboard returns cronStatus");

const testAlert = await sendTestAlert();
ok(testAlert.created || testAlert.logged || testAlert.updated, "sendTestAlert runs");

const alerts = await getOpenAlerts(5);
ok(Array.isArray(alerts), "getOpenAlerts returns array");

// ── Production DB checks ────────────────────────────────────────────────────
const production = process.argv.includes("--production");
if (production && process.env.DATABASE_URL) {
  const { getSupabaseAdmin } = await import("../lib/supabase-admin.mjs");
  const admin = getSupabaseAdmin();
  if (admin) {
    for (const table of [
      "ake_alerts",
      "ake_cron_runs",
      "ake_pipeline_failures",
      "ake_source_health_events",
      "ake_daily_reports",
      "ake_notification_preferences",
    ]) {
      const { error } = await admin.from(table).select("id", { head: true, count: "exact" });
      ok(!error, `Production table ${table} exists`);
    }

    const { generateDailyReport } = await import("../lib/auto-knowledge-engine/monitoring/daily-report.mjs");
    const report = await generateDailyReport({ force: true });
    ok(report.ok, "Daily report generated in production");

    const { evaluateMonitoringRules } = await import("../lib/auto-knowledge-engine/monitoring/rules.mjs");
    const rules = await evaluateMonitoringRules();
    ok(Array.isArray(rules), "Monitoring rules evaluated in production");
  } else {
    console.log("⊘ Supabase admin not configured — production DB checks skipped");
  }
} else if (production) {
  console.log("⊘ DATABASE_URL not set — production checks skipped");
}

console.log(`\nAKE Monitoring Phase 8: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
