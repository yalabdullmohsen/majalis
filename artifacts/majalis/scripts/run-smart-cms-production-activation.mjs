#!/usr/bin/env node
/**
 * Smart CMS Production Activation — phases 1–8 orchestrator.
 *
 * Usage:
 *   node scripts/run-smart-cms-production-activation.mjs
 *   CRON_SECRET=... node scripts/run-smart-cms-production-activation.mjs --production --apply
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { getEnvStatus } from "../lib/env-config.mjs";
import {
  runSmartCmsMigrations,
  probeSmartCmsTables,
  checkSmartCmsDataIntegrity,
  SMART_CMS_CRON_PATHS,
} from "../lib/smart-cms-production.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PRODUCTION_BASE = process.env.MAJALIS_PRODUCTION_URL || "https://www.majlisilm.com";

const args = process.argv.slice(2);
const productionMode = args.includes("--production");
const shouldApply = args.includes("--apply");
const cronSecret = process.env.CRON_SECRET || "";

const report = {
  timestamp: new Date().toISOString(),
  mode: productionMode ? "production" : "local",
  phases: {},
  readinessPct: 0,
  blockers: [],
};

async function step(name, fn) {
  try {
    const result = await fn();
    report.phases[name] = result;
    return result;
  } catch (err) {
    const result = { ok: false, error: err.message };
    report.phases[name] = result;
    report.blockers.push(`${name}: ${err.message}`);
    return result;
  }
}

async function triggerProduction(path) {
  const started = Date.now();
  const res = await fetch(`${PRODUCTION_BASE}${path}`, {
    method: "POST",
    headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
    signal: AbortSignal.timeout(120000),
  });
  const json = await res.json().catch(() => ({}));
  return { path, status: res.status, ok: res.ok && json.ok !== false, durationMs: Date.now() - started, summary: json.scope || json.error || "done" };
}

console.log("=== Smart CMS Production Activation ===\n");

await step("secrets", async () => {
  const env = getEnvStatus();
  const missing = [];
  if (productionMode && shouldApply && !cronSecret) missing.push("CRON_SECRET");
  if (shouldApply && !productionMode && !env.DATABASE_URL) missing.push("DATABASE_URL");
  if (shouldApply && !env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return { ok: missing.length === 0, missing, env: Object.fromEntries(Object.entries(env).map(([k, v]) => [k, Boolean(v)])) };
});

await step("tablesBefore", probeSmartCmsTables);

await step("migrations", async () => {
  if (!shouldApply) return { ok: false, skipped: true, reason: "pass --apply" };
  if (productionMode) {
    return triggerProduction("/api/cron/apply-migrations?scope=smart-cms");
  }
  return runSmartCmsMigrations();
});

await step("integrityBefore", checkSmartCmsDataIntegrity);

await step("productionCrons", async () => {
  if (!shouldApply || !productionMode || !cronSecret) return { ok: false, skipped: true };
  const results = [];
  for (const path of SMART_CMS_CRON_PATHS.slice(0, 6)) {
    results.push(await triggerProduction(path));
  }
  return { ok: results.every((r) => r.ok), results };
});

await step("platformVerify", async () => {
  try {
    execSync("node scripts/verify-smart-cms-platform.mjs", { cwd: ROOT, stdio: "pipe", encoding: "utf8" });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err.stderr || err.message).slice(0, 500) };
  }
});

await step("productionAudit", async () => {
  try {
    execSync(`node scripts/audit-smart-cms-production.mjs --base=${PRODUCTION_BASE}`, {
      cwd: ROOT,
      stdio: "pipe",
      encoding: "utf8",
      env: process.env,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err.stderr || err.message).slice(0, 500) };
  }
});

await step("tablesAfter", probeSmartCmsTables);
await step("integrityAfter", checkSmartCmsDataIntegrity);

const after = report.phases.tablesAfter || {};
const verify = report.phases.platformVerify;
const migrations = report.phases.migrations;
const audit = report.phases.productionAudit;

let score = 0;
if (after.ok) score += 35;
else if (after.missing?.length <= 3) score += 20;
if (verify?.ok) score += 25;
if (migrations?.ok) score += 20;
if (audit?.ok) score += 10;
if (report.phases.secrets?.ok) score += 10;

report.readinessPct = Math.min(100, score);
report.tablesActivated = after.counts || {};
report.missingTables = after.missing || [];

const outDir = join(ROOT, "reports");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "smart-cms-production-activation-report.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log("\n--- Summary ---");
console.log(`Readiness: ${report.readinessPct}%`);
console.log(`Tables missing: ${(after.missing || []).join(", ") || "none"}`);
console.log(`Blockers: ${report.blockers.length ? report.blockers.join("; ") : "none"}`);
console.log(`Report: ${outPath}`);

process.exit(report.readinessPct >= 100 ? 0 : report.readinessPct >= 80 ? 0 : 1);
