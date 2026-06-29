#!/usr/bin/env node
/**
 * Production Lockdown — master stabilization audit.
 *
 * Usage:
 *   node scripts/production-lockdown-audit.mjs
 *   node scripts/production-lockdown-audit.mjs --production
 *   CRON_SECRET=... node scripts/production-lockdown-audit.mjs --verify-crons
 *   node scripts/production-lockdown-audit.mjs --apply-recovery   # needs DATABASE_URL
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildProductionLockdownReport, runAutomationRecoveryMigrations } from "../lib/production-lockdown/report.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const production = process.argv.includes("--production");
const verifyCrons = process.argv.includes("--verify-crons") || Boolean(process.env.CRON_SECRET);
const applyRecovery = process.argv.includes("--apply-recovery");
const skipLocal = process.argv.includes("--skip-local") || production;
const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || (production ? "https://www.majlisilm.com" : "https://majlisilm.com");

console.log("=== Production Lockdown Audit ===\n");
console.log(`Base: ${base}`);
console.log(`Verify crons: ${verifyCrons ? "yes" : "no (pass CRON_SECRET + --verify-crons)"}`);
console.log(`Local gates: ${skipLocal ? "skipped" : "enabled"}\n`);

let recovery = null;
if (applyRecovery) {
  console.log("Applying automation recovery migrations…");
  recovery = await runAutomationRecoveryMigrations({ force: false });
  console.log(recovery.ok ? "Recovery migrations OK" : "Recovery migrations FAILED");
}

const report = await buildProductionLockdownReport({
  base,
  verifyCrons,
  skipLocal,
  cronSecret: process.env.CRON_SECRET,
});

if (recovery) report.recovery = recovery;

const outDir = join(ROOT, "reports");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "production-lockdown-report.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(`\nHealth Score: ${report.healthScore}/100`);
console.log(`Readiness: ${report.readinessPct}%`);
console.log(`Systems operational: ${report.scores.systemsOperational}`);
console.log(`Routes OK: ${report.scores.routesOk}`);
console.log(`APIs OK: ${report.scores.apisOk}`);
console.log(`Crons reachable: ${report.scores.cronsReachable}`);
console.log(`Data integrity issues: ${report.scores.integrityIssues}`);

console.log("\nSystems:");
for (const s of report.systems) {
  console.log(`  ${s.status === "operational" ? "✓" : "○"} ${s.name}: ${s.status} — ${s.evidence}`);
}

if (report.localGates.length) {
  console.log("\nLocal gates:");
  for (const g of report.localGates) {
    console.log(`  ${g.ok ? "✓" : "✗"} ${g.name} (${g.ms}ms)${g.error ? ` — ${g.error.slice(0, 80)}` : ""}`);
  }
}

console.log(`\nReport: ${outPath}`);

const pass = report.healthScore >= 60 && report.localGates.every((g) => g.ok || skipLocal);
process.exit(pass ? 0 : 1);
