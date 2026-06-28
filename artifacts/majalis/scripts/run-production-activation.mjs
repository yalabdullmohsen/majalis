#!/usr/bin/env node
/**
 * AKP v3 — Final Production Activation
 *
 * Usage:
 *   node scripts/run-production-activation.mjs
 *   node scripts/run-production-activation.mjs --apply
 *   node scripts/run-production-activation.mjs --production --json
 *
 * Requires for --apply:
 *   DATABASE_URL or SUPABASE_ACCESS_TOKEN + SUPABASE_SERVICE_ROLE_KEY
 * Optional:
 *   CRON_SECRET (trigger production crons)
 *   OPENAI_API_KEY (semantic embeddings)
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { getEnvStatus } from "../lib/env-config.mjs";
import { runActivationTableMigrations } from "../lib/migration-runner.mjs";
import { probeTables, countTableRows } from "../lib/table-probe.mjs";
import { runAutonomousPlatformV3 } from "../lib/autonomous-platform/v3/index.mjs";
import { seedContentSourcesFromJson } from "../lib/autonomous-platform/sources.mjs";
import { listManagedSources } from "../lib/autonomous-platform/v3/source-manager.mjs";
import { loadSourcesFromJson } from "../lib/autonomous-platform/sources.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PRODUCTION_BASE = process.env.MAJALIS_PRODUCTION_URL || "https://www.majlisilm.com";

const AKP_V3_TABLES = [
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
];

const args = process.argv.slice(2);
const shouldApply = args.includes("--apply");
const productionMode = args.includes("--production");
const jsonOut = args.includes("--json");

const report = {
  timestamp: new Date().toISOString(),
  platformVersion: "3.0.0",
  phases: {},
  readinessPct: 0,
  blockers: [],
  ownerActions: [],
};

function step(name, fn) {
  return fn().then((result) => {
    report.phases[name] = result;
    return result;
  }).catch((err) => {
    const result = { ok: false, error: err.message };
    report.phases[name] = result;
    report.blockers.push(`${name}: ${err.message}`);
    return result;
  });
}

function runTest(cmd) {
  try {
    execSync(cmd, { cwd: ROOT, stdio: "pipe", encoding: "utf8" });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err.stderr || err.message).slice(0, 500) };
  }
}

async function probeV3Tables() {
  const probed = await probeTables(AKP_V3_TABLES);
  const present = AKP_V3_TABLES.filter((t) => probed[t] === true);
  const missing = AKP_V3_TABLES.filter((t) => probed[t] !== true);
  return { ok: missing.length === 0, present, missing, detail: probed };
}

async function checkSecrets() {
  const env = getEnvStatus();
  const missing = [];
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!env.DATABASE_URL && !env.SUPABASE_ACCESS_TOKEN && !env.POSTGRES_URL) {
    missing.push("DATABASE_URL");
  }
  if (!env.OPENAI_API_KEY) {
    report.phases.aiMode = { mode: "keyword_fallback", reason: "OPENAI_API_KEY not set" };
  } else {
    report.phases.aiMode = { mode: "semantic_embeddings", ok: true };
  }
  if (missing.length) {
    report.ownerActions = missing.map((s) => ({
      secret: s,
      addTo: "Vercel + GitHub Actions secrets",
    }));
  }
  return { ok: missing.length === 0, missing, env: { ...env, keysOnly: true } };
}

async function applyMigrationsIfRequested() {
  if (!shouldApply) return { ok: false, skipped: true, reason: "pass --apply to run migrations" };
  const secrets = await checkSecrets();
  if (!secrets.ok) return { ok: false, error: "missing_secrets", missing: secrets.missing };

  const result = await runActivationTableMigrations({ seedRulings: false });
  return result;
}

async function bootstrapSourcesIfEmpty() {
  const count = await countTableRows("akp_content_sources");
  if (count === null) return { ok: false, error: "cannot_count_sources" };
  if (count > 0) {
    const managed = await listManagedSources();
    return { ok: true, skipped: true, count, sources: managed.sources?.length || count };
  }
  if (!shouldApply) {
    return { ok: false, skipped: true, reason: "empty_db_pass_--apply_to_seed", jsonSeedCount: loadSourcesFromJson().length };
  }
  const seeded = await seedContentSourcesFromJson();
  return { ok: seeded.ok, seeded, countAfter: await countTableRows("akp_content_sources") };
}

async function runPipelineCycle() {
  if (!shouldApply) return { ok: false, skipped: true };
  const health = await runAutonomousPlatformV3({ mode: "health", triggerType: "activation" });
  const full = await runAutonomousPlatformV3({ mode: "full", triggerType: "activation", healthLimit: 5, reindexLimit: 10 });
  return { ok: health.ok !== false && full.ok !== false, health, full };
}

async function verifyProductionEndpoints() {
  const endpoints = [
    { path: "/api/cron/autonomous-platform-v3-health", expectAuth: true },
    { path: "/", expectAuth: false },
  ];
  const results = [];
  for (const ep of endpoints) {
    try {
      const res = await fetch(`${PRODUCTION_BASE}${ep.path}`);
      const body = ep.expectAuth ? await res.json().catch(() => ({})) : null;
      results.push({
        path: ep.path,
        status: res.status,
        ok: ep.expectAuth ? res.status === 401 : res.ok,
        note: ep.expectAuth ? "cron_auth_required" : "public",
        body: ep.expectAuth ? body : undefined,
      });
    } catch (err) {
      results.push({ path: ep.path, ok: false, error: err.message });
    }
  }
  return { ok: results.every((r) => r.ok), results, base: PRODUCTION_BASE };
}

async function runTestSuite() {
  const tests = {
    v3Unit: runTest("node scripts/test-autonomous-platform-v3.mjs"),
    verifyPlatform: runTest("node scripts/verify-autonomous-platform.mjs"),
    cronAuth: runTest("node scripts/test-cron-auth.mjs"),
    typecheck: runTest("pnpm run typecheck"),
  };
  if (productionMode) {
    tests.productionComplete = runTest("node scripts/verify-production-complete.mjs --production --skip-build");
  }
  const failed = Object.entries(tests).filter(([, r]) => !r.ok);
  return { ok: failed.length === 0, tests, failed: failed.map(([k]) => k) };
}

async function triggerProductionCrons() {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return { ok: false, skipped: true, reason: "CRON_SECRET not set" };
  }
  const crons = [
    "/api/cron/apply-migrations?scope=activation-tables",
    "/api/cron/autonomous-platform-v3?mode=seed",
    "/api/cron/autonomous-platform-v3?mode=full",
    "/api/cron/autonomous-platform-v3-health",
    "/api/cron/autonomous-platform-v3-analytics",
  ];
  const results = [];
  for (const path of crons) {
    const started = Date.now();
    try {
      const res = await fetch(`${PRODUCTION_BASE}${path}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const json = await res.json().catch(() => ({}));
      results.push({
        path,
        status: res.status,
        ok: res.ok && json.ok !== false,
        durationMs: Date.now() - started,
        summary: json.mode || json.scope || json.error || "done",
      });
    } catch (err) {
      results.push({ path, ok: false, error: err.message });
    }
  }
  return { ok: results.every((r) => r.ok), results };
}

console.log("=== AKP v3 Production Activation ===\n");

await step("secrets", checkSecrets);
await step("tablesBefore", probeV3Tables);
await step("migrations", applyMigrationsIfRequested);
await step("tablesAfter", probeV3Tables);
await step("bootstrap", bootstrapSourcesIfEmpty);
await step("pipeline", runPipelineCycle);
await step("productionEndpoints", verifyProductionEndpoints);
await step("tests", runTestSuite);

if (args.includes("--trigger-crons")) {
  await step("productionCrons", triggerProductionCrons);
}

const tablesAfter = report.phases.tablesAfter;
const tests = report.phases.tests;
const bootstrap = report.phases.bootstrap;
const migrations = report.phases.migrations;

let score = 0;
const weights = {
  tests: 25,
  tables: 30,
  bootstrap: 15,
  migrations: 15,
  production: 10,
  secrets: 5,
};

if (tests?.ok) score += weights.tests;
if (tablesAfter?.ok) score += weights.tables;
else if (tablesAfter?.present?.length >= 2) score += weights.tables * 0.4;
if (bootstrap?.ok || bootstrap?.skipped) score += bootstrap?.ok ? weights.bootstrap : weights.bootstrap * 0.3;
if (migrations?.ok) score += weights.migrations;
else if (migrations?.skipped) score += weights.migrations * 0.2;
if (report.phases.productionEndpoints?.ok) score += weights.production;
if (report.phases.secrets?.ok) score += weights.secrets;

report.readinessPct = Math.round(score);
report.mergedPr = 110;
report.latestCommit = execSync("git rev-parse HEAD", { cwd: join(ROOT, "../.."), encoding: "utf8" }).trim();

const outDir = join(ROOT, "data");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "production-activation-report.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));

if (jsonOut) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("\n--- Summary ---");
  console.log(`Readiness: ${report.readinessPct}%`);
  console.log(`Tables: ${tablesAfter?.present?.length || 0}/${AKP_V3_TABLES.length}`);
  console.log(`Sources: ${bootstrap?.count ?? bootstrap?.countAfter ?? "unknown"}`);
  console.log(`Tests: ${tests?.ok ? "pass" : "fail"}`);
  if (report.blockers.length) console.log("Blockers:", report.blockers.join("; "));
  if (report.ownerActions.length) {
    console.log("\nOwner actions required:");
    for (const a of report.ownerActions) console.log(`  - ${a.secret} → ${a.addTo}`);
  }
  console.log(`\nReport: ${outPath}`);
}

process.exit(report.readinessPct >= 100 ? 0 : report.readinessPct >= 70 ? 0 : 1);
