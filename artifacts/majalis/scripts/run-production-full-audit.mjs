#!/usr/bin/env node
/**
 * run-production-full-audit — generates 12 subsystem reports + master summary.
 *
 * Usage:
 *   node scripts/run-production-full-audit.mjs
 *   node scripts/run-production-full-audit.mjs --production
 *   CRON_SECRET=... node scripts/run-production-full-audit.mjs --production --verify-crons
 */
import { writeProductionFullAuditReports } from "../lib/production-audit/full-audit.mjs";

const production = process.argv.includes("--production");
const verifyCrons = process.argv.includes("--verify-crons") || Boolean(process.env.CRON_SECRET);
const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || (production ? "https://www.majlisilm.com" : "https://majlisilm.com");

console.log("=== Production Full Audit (12 Reports) ===\n");
console.log(`Base: ${base}`);
console.log(`Verify crons: ${verifyCrons ? "yes" : "no"}\n`);

const result = await writeProductionFullAuditReports({ base, verifyCrons, cronSecret: process.env.CRON_SECRET });

const m = result.master;
console.log(`Health Score: ${m.healthScore}/100 (target ≥95)`);
console.log(`Readiness: ${m.readinessPct}%`);
console.log(`Autonomy: ${m.autonomyPct}% (${m.passedCriteria}/${m.totalCriteria})`);
console.log(`Fully Autonomous: ${m.fullyAutonomous ? "YES" : "NO"}`);
console.log(`\nClosure criteria:`);
for (const [k, v] of Object.entries(m.closureCriteria)) {
  console.log(`  ${v ? "✓" : "✗"} ${k}`);
}
if (m.missingSecrets.length) {
  console.log(`\nMissing secrets: ${m.missingSecrets.join(", ")}`);
}
console.log(`\nReports: ${result.outDir}/`);
console.log(`Duration: ${Math.round(m.durationMs / 1000)}s`);
console.log(`\n${m.note}`);

process.exit(m.fullyAutonomous ? 0 : 1);
