#!/usr/bin/env node
/**
 * Production Automation Recovery — orchestrated phases 2–10.
 *
 * Usage:
 *   node scripts/run-production-automation-recovery.mjs
 *   CRON_SECRET=... node scripts/run-production-automation-recovery.mjs --production --apply
 *
 * Local (--apply): requires DATABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * Production (--production): triggers live crons on majlisilm.com with CRON_SECRET
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { getEnvStatus } from "../lib/env-config.mjs";
import {
  probeAutomationRecoveryTables,
  runAutomationRecoveryMigrations,
  runAkpV3Migrations,
} from "../lib/automation-recovery.mjs";
import { countTableRows } from "../lib/table-probe.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PRODUCTION_BASE = process.env.MAJALIS_PRODUCTION_URL || "https://www.majlisilm.com";

const args = process.argv.slice(2);
const productionMode = args.includes("--production");
const shouldApply = args.includes("--apply");
const jsonOut = args.includes("--json");
const cronSecret = process.env.CRON_SECRET || "";

const report = {
  timestamp: new Date().toISOString(),
  mode: productionMode ? "production" : "local",
  phases: {},
  before: {},
  after: {},
  blockers: [],
  ownerActions: [],
  readinessPct: 0,
};

function step(name, fn) {
  return fn()
    .then((result) => {
      report.phases[name] = result;
      return result;
    })
    .catch((err) => {
      const result = { ok: false, error: err.message };
      report.phases[name] = result;
      report.blockers.push(`${name}: ${err.message}`);
      return result;
    });
}

async function checkSecrets() {
  const env = getEnvStatus();
  const missing = [];
  if (productionMode && !cronSecret) missing.push("CRON_SECRET");
  if (shouldApply && !productionMode) {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!env.DATABASE_URL && !env.POSTGRES_URL) missing.push("DATABASE_URL");
  }
  if (missing.length) {
    report.ownerActions = missing.map((s) => ({ secret: s, addTo: "Vercel / GitHub Actions / local .env" }));
  }
  return { ok: missing.length === 0, missing, env: Object.fromEntries(Object.entries(env).map(([k, v]) => [k, Boolean(v)])) };
}

async function snapshotTables(label) {
  const probe = await probeAutomationRecoveryTables();
  report[label] = probe;
  return probe;
}

async function triggerProduction(path, { method = "GET", timeoutMs = 120000 } = {}) {
  const started = Date.now();
  const res = await fetch(`${PRODUCTION_BASE}${path}`, {
    method,
    headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
    signal: AbortSignal.timeout(timeoutMs),
  });
  const json = await res.json().catch(() => ({}));
  return {
    path,
    status: res.status,
    ok: res.ok && json.ok !== false,
    durationMs: Date.now() - started,
    summary: json.scope || json.mode || json.error || "done",
    json,
  };
}

async function phaseMigrations() {
  if (productionMode && shouldApply) {
    const steps = [
      "/api/cron/apply-migrations?scope=automation-recovery",
      "/api/cron/apply-migrations?scope=question-generation",
      "/api/cron/apply-migrations?scope=akp-v3",
      "/api/cron/apply-migrations?scope=fiqh-council",
      "/api/cron/apply-migrations?scope=question-answer",
      "/api/cron/apply-migrations?scope=ake-rpc",
      "/api/cron/apply-migrations?scope=content-import-schema",
    ];
    const results = [];
    for (const path of steps) {
      results.push(await triggerProduction(path));
    }
    return { ok: results.every((r) => r.ok), results };
  }
  if (!shouldApply) return { ok: false, skipped: true, reason: "pass --apply" };
  const recovery = await runAutomationRecoveryMigrations();
  const akp = await runAkpV3Migrations();
  return { ok: recovery.ok && akp.ok, recovery, akp };
}

async function phaseBootstrap() {
  if (!shouldApply) return { ok: false, skipped: true };
  if (productionMode) {
    const bootstrap = await triggerProduction("/api/cron/autonomous-platform-bootstrap");
    const akpV3 = await triggerProduction("/api/cron/autonomous-platform-v3?mode=seed");
    const akpFull = await triggerProduction("/api/cron/autonomous-platform-v3?mode=full");
    return { ok: bootstrap.ok && akpV3.ok, bootstrap, akpV3, akpFull };
  }
  return { ok: true, skipped: true, reason: "local_bootstrap_use_activate_script" };
}

async function phaseQuestionGeneration() {
  if (!shouldApply) return { ok: false, skipped: true };
  if (productionMode) {
    const daily = await triggerProduction("/api/cron/question-answer-daily");
    const drain = await triggerProduction("/api/cron/question-answer-generation-drain");
    return { ok: daily.ok, daily, drain };
  }
  return { ok: true, skipped: true };
}

async function phaseImportQueue() {
  if (!shouldApply) return { ok: false, skipped: true };
  if (productionMode) {
    return triggerProduction("/api/cron/process-import-jobs?limit=3", { method: "POST" });
  }
  return { ok: true, skipped: true };
}

async function phaseMke() {
  if (!shouldApply) return { ok: false, skipped: true };
  if (productionMode) {
    return triggerProduction("/api/cron/majlis-knowledge-engine");
  }
  return { ok: true, skipped: true };
}

async function phaseFiqhCouncil() {
  if (!shouldApply) return { ok: false, skipped: true };
  if (productionMode) {
    return triggerProduction("/api/cron/sync-fiqh-council", { method: "POST" });
  }
  return { ok: true, skipped: true };
}

async function phaseAkeOrchestrator() {
  if (!shouldApply) return { ok: false, skipped: true };
  if (productionMode) {
    return triggerProduction("/api/cron/auto-knowledge-sync", { method: "POST" });
  }
  return { ok: true, skipped: true };
}

async function phaseAudit() {
  const cmd = productionMode
    ? "node scripts/audit-production-automation.mjs"
    : "node scripts/audit-production-automation.mjs";
  try {
    execSync(cmd, { cwd: ROOT, stdio: "pipe", encoding: "utf8", env: process.env });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err.stderr || err.message).slice(0, 800) };
  }
}

console.log("=== Production Automation Recovery ===\n");

await step("secrets", checkSecrets);
await step("tablesBefore", () => snapshotTables("before"));
await step("migrations", phaseMigrations);
await step("bootstrap", phaseBootstrap);
await step("questionGeneration", phaseQuestionGeneration);
await step("importQueue", phaseImportQueue);
await step("mke", phaseMke);
await step("fiqhCouncil", phaseFiqhCouncil);
await step("akeOrchestrator", phaseAkeOrchestrator);
await step("tablesAfter", () => snapshotTables("after"));
await step("auditAutomation", phaseAudit);
await step("auditInfrastructure", async () => {
  try {
    execSync("node scripts/audit-infrastructure.mjs", { cwd: ROOT, stdio: "pipe", encoding: "utf8" });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err.stderr || err.message).slice(0, 500) };
  }
});

const after = report.after || {};
const counts = after.counts || {};
let score = 0;
const checks = [
  { key: "question_generation_jobs", weight: 10, min: 1 },
  { key: "daily_generation_reports", weight: 5, min: 1 },
  { key: "ake_engine_runs", weight: 10, min: 1 },
  { key: "mke_runs", weight: 8, min: 1 },
  { key: "akp_content_sources", weight: 8, min: 1 },
  { key: "akp_pipeline_runs", weight: 8, min: 1 },
  { key: "fiqh_council_items", weight: 5, min: 0 },
  { key: "content_import_jobs", weight: 5, min: 1 },
];

for (const c of checks) {
  const n = counts[c.key];
  if (n == null && after.missing?.includes(c.key)) continue;
  if (typeof n === "number" && n >= c.min) score += c.weight;
  else if (c.min === 0 && !after.missing?.includes(c.key)) score += c.weight * 0.5;
}

if (report.phases.migrations?.ok) score += 15;
if (report.phases.bootstrap?.ok) score += 10;
if (report.phases.auditAutomation?.ok) score += 10;
if (report.phases.secrets?.ok) score += 6;

report.readinessPct = Math.min(100, Math.round(score));
report.countsAfter = counts;
report.missingTablesAfter = after.missing || [];

const outDir = join(ROOT, "reports");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "automation-production-recovery-report.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));

if (jsonOut) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("\n--- Recovery Summary ---");
  console.log(`Readiness estimate: ${report.readinessPct}% (target ≥80%)`);
  console.log(`Missing tables after: ${(after.missing || []).join(", ") || "none"}`);
  console.log(`Blockers: ${report.blockers.length ? report.blockers.join("; ") : "none"}`);
  if (report.ownerActions.length) {
    console.log("\nOwner actions:");
    for (const a of report.ownerActions) console.log(`  - ${a.secret}`);
  }
  console.log(`\nReport: ${outPath}`);
}

process.exit(report.readinessPct >= 80 ? 0 : 1);
