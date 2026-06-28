#!/usr/bin/env node
/**
 * Infrastructure audit — secrets, tables, bootstrap blockers.
 * Usage: node scripts/audit-infrastructure.mjs [--json]
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildAkpProductionHealth, INFRASTRUCTURE_REQUIREMENTS } from "../lib/autonomous-platform/v3/production-health.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const jsonOut = process.argv.includes("--json");

console.log("=== Infrastructure Audit — AKP v3 ===\n");

const health = await buildAkpProductionHealth();

console.log("## Secrets & Environment\n");
console.log("| Secret | Priority | Status | Impact |");
console.log("|--------|----------|--------|--------|");
for (const item of health.infrastructure) {
  const status = item.present ? "✅ Present" : "❌ Missing";
  console.log(`| ${item.key} | ${item.priority} | ${status} | ${item.impact.slice(0, 50)}... |`);
}

console.log("\n## Migration (autonomous_platform_v3.sql)\n");
console.log(`Applied: ${health.migration.appliedPct}% (${health.migration.present.length}/${health.migration.present.length + health.migration.missing.length})`);
if (health.migration.missing.length) {
  console.log("\nMissing tables:");
  for (const t of health.migration.missing) console.log(`  - ${t}`);
}

console.log("\n## Database Counts\n");
for (const [table, count] of Object.entries(health.database.counts)) {
  const reason = health.database.emptyReasons[table];
  const label = count === null ? "N/A" : count;
  console.log(`  ${table}: ${label}${reason ? ` (${reason})` : ""}`);
}

console.log(`\nSources in DB: ${health.database.sources.db} | JSON seed: ${health.database.sources.jsonSeed}`);

console.log("\n## Bootstrap Status\n");
if (health.bootstrap.blockedReason) {
  console.log(`⚠ Blocked: ${health.bootstrap.blockedReason}`);
} else {
  console.log("Bootstrap precheck passed (or partial)");
}

console.log(`\n## Readiness: ${health.readinessPct}%`);
if (health.blockers.length) {
  console.log("\nBlockers:");
  for (const b of health.blockers) console.log(`  - [${b.type}] ${b.impact}`);
}

if (health.ownerActions.length) {
  console.log("\n## Owner Actions Required\n");
  for (const a of health.ownerActions) {
    console.log(`  ${a.secret} → ${a.addTo}`);
  }
}

const outPath = join(ROOT, "data/infrastructure-audit-report.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(health, null, 2));
console.log(`\nReport saved: ${outPath}`);

if (jsonOut) console.log(JSON.stringify(health, null, 2));

process.exit(health.readinessPct >= 100 ? 0 : 1);
