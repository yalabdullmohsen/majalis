#!/usr/bin/env node
/**
 * audit:autonomous-production — unified production readiness audit.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildUnifiedAutonomousPlatform } from "../lib/autonomous-platform/v3/unified-platform.mjs";
import { getEnvStatus } from "../lib/env-config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const production = process.argv.includes("--production");

console.log("=== audit:autonomous-production ===\n");

const env = getEnvStatus();
const required = [
  "DATABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

const secretsReport = required.map((key) => ({
  key,
  present: Boolean(env[key] || (key.startsWith("UPSTASH") && env[key])),
}));

const dashboard = await buildUnifiedAutonomousPlatform();
const report = {
  at: new Date().toISOString(),
  production,
  healthScoreBefore: null,
  healthScoreAfter: dashboard.healthScore,
  healthScoreTarget: dashboard.healthScoreTarget,
  operational: dashboard.operational,
  secrets: secretsReport,
  missingSecrets: dashboard.missingSecrets,
  criticalSecretsMissing: dashboard.criticalSecretsMissing,
  trustedSources: dashboard.import_jobs.gke_trusted_sources,
  importedToday: dashboard.import_jobs.imported_today,
  autoPublishedToday: dashboard.import_jobs.auto_published_today,
  reviewQueue: dashboard.import_jobs.review_queue,
  duplicateRate: dashboard.import_jobs.duplicate_rate,
  qualityAverage: dashboard.import_jobs.quality_average,
  cronsWorking: dashboard.crons?.crons?.filter((c) => c.lastRun).length ?? 0,
  cronsTotal: dashboard.crons?.crons?.length ?? 0,
  gkeTables: dashboard.gke.tables,
  shadowMode: dashboard.shadow_mode,
  alerts: dashboard.alerts,
  blockers: dashboard.akp.blockers,
  note: dashboard.note,
};

mkdirSync(join(ROOT, "reports"), { recursive: true });
const outPath = join(ROOT, "reports/autonomous-production-audit.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(`Health Score: ${report.healthScoreAfter}/${report.healthScoreTarget}`);
console.log(`Operational: ${report.operational ? "yes" : "no"}`);
console.log(`Trusted sources: ${report.trustedSources}`);
console.log(`Missing secrets: ${report.missingSecrets.join(", ") || "none"}`);
console.log(`Crons: ${report.cronsWorking}/${report.cronsTotal}`);
console.log(`GKE tables: ${report.gkeTables.present}/${report.gkeTables.expected}`);
console.log(`Shadow mode: ${report.shadowMode ? "ON" : "OFF"}`);
console.log(`\nReport: ${outPath}`);

const exitCode = report.healthScoreAfter >= 90 && report.criticalSecretsMissing.length === 0 ? 0 : 1;
process.exit(exitCode);
