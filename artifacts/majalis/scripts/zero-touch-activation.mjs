#!/usr/bin/env node
/**
 * Zero-Touch Production Activation — CLI runner.
 *
 * Usage:
 *   node scripts/zero-touch-activation.mjs
 *   node scripts/zero-touch-activation.mjs --production --self-heal
 *   node scripts/zero-touch-activation.mjs --production --activate
 *   CRON_SECRET=... DATABASE_URL=... node scripts/zero-touch-activation.mjs --production --self-heal
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runZeroTouchActivation } from "../lib/zero-touch/index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const production = process.argv.includes("--production");
const selfHeal = process.argv.includes("--self-heal") || process.argv.includes("--activate");
const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || (production ? "https://www.majlisilm.com" : "https://majlisilm.com");

console.log("=== Zero-Touch Production Activation ===\n");
console.log(`Base: ${base}`);
console.log(`Self-heal: ${selfHeal ? "yes" : "no"}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? "set" : "missing"}`);
console.log(`CRON_SECRET: ${process.env.CRON_SECRET ? "set" : "missing"}\n`);

const activation = await runZeroTouchActivation({
  base,
  selfHeal,
  skipLocal: production || process.argv.includes("--skip-local"),
  verifyCrons: process.argv.includes("--verify-crons"),
});

const outDir = join(ROOT, "reports");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "zero-touch-activation-report.json");
writeFileSync(outPath, JSON.stringify(activation, null, 2));

const audit = activation.audit;
console.log(`\nHealth Score: ${activation.healthScore}/100`);
console.log(`Readiness: ${activation.readinessPct}%`);
console.log(`Tables: ${audit.tablesEnabled}`);
console.log(`Migrations applied: ${audit.migrationsApplied} | pending: ${audit.migrationsPending} | failed: ${audit.migrationsFailed}`);
console.log(`Cron jobs: ${audit.cronJobsWorking}`);
console.log(`Queue: ${audit.queueStatus} | Workers: ${audit.workersStatus}`);
console.log(`Deploy verified: ${audit.deployVerified ? "yes" : "no"}`);
console.log(`Critical errors: ${audit.criticalErrors}`);

if (activation.manualIntervention?.length) {
  console.log("\nManual intervention required:");
  for (const m of activation.manualIntervention.slice(0, 10)) {
    console.log(`  ○ ${m.type}: ${m.name} — ${m.reason}`);
  }
}

if (activation.alerts?.length) {
  console.log("\nAlerts:");
  for (const a of activation.alerts.slice(0, 8)) {
    console.log(`  [${a.severity}] ${a.message}`);
  }
}

console.log(`\nReport: ${outPath}`);
console.log(`Duration: ${Math.round(activation.durationMs / 1000)}s`);

process.exit(activation.ok ? 0 : 1);
