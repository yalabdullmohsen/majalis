#!/usr/bin/env node
/**
 * Audit DATABASE_URL and related env vars — local or CI.
 * Usage: node scripts/audit-database-connection.mjs [--json]
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { auditDatabaseConnection } from "../lib/audit-database-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonOut = process.argv.includes("--json");

const report = await auditDatabaseConnection();

console.log("=== Database Connection Audit ===\n");
console.log(`Active env var: ${report.activeEnvVar || "NONE"}`);
console.log(`Project ref:    ${report.projectRef || "unknown"}`);
console.log(`Resolved URL:   ${report.resolved.urlRedacted}`);
console.log(`Source:         ${report.resolved.source}`);
console.log(`Expected user:  ${report.expectedUser}`);
console.log(`Pooler:         ${report.expectedPoolerHost}:${report.expectedPoolerPort}\n`);

console.log("## URL variables\n");
for (const v of report.urlVariables) {
  console.log(`  ${v.key}: ${v.set ? v.redacted : "(not set)"}${v.set ? ` [user=${v.user}, host=${v.host}, port=${v.port}]` : ""}`);
}

if (report.conflicts.length) {
  console.log("\n## Conflicts\n");
  for (const c of report.conflicts) {
    console.log(`  ⚠ ${c.message}`);
    console.log(`    Fix: ${c.fix}`);
  }
}

if (report.connection) {
  console.log(`\n## Connection test: ${report.connection.ok ? "PASS" : "FAIL"}`);
  if (!report.connection.ok) console.log(`  Error: ${report.connection.error}`);
  else console.log(`  Tables: ${report.connection.publicTables}, duration: ${report.connection.durationMs}ms`);
}

console.log("\n## Auto Knowledge Engine\n");
console.log(`  Uses: ${report.autoKnowledgeEngine.activeEnvVar} (${report.autoKnowledgeEngine.connectionSource})`);

if (report.recommendations.length) {
  console.log("\n## Recommendations\n");
  for (const r of report.recommendations) {
    console.log(`  [${r.priority}] ${r.action}`);
    console.log(`         ${r.detail}`);
  }
}

const outPath = join(__dirname, "../data/database-connection-audit.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`\nReport: ${outPath}`);

if (jsonOut) console.log(JSON.stringify(report, null, 2));

process.exit(report.connection?.ok === false ? 1 : 0);
