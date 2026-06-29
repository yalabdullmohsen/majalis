#!/usr/bin/env node
/**
 * Smart CMS data integrity check — orphans, duplicates, broken relations.
 * Run: pnpm --filter @workspace/majalis run verify:smart-cms-integrity
 */
import { checkSmartCmsDataIntegrity, probeSmartCmsTables } from "../lib/smart-cms-production.mjs";

console.log("\n=== Smart CMS Data Integrity ===\n");

const tables = await probeSmartCmsTables();
console.log(`Tables present: ${tables.ok ? "all" : tables.missing.join(", ")}`);

const integrity = await checkSmartCmsDataIntegrity();

if (integrity.importJobsByStatus) {
  console.log("\nImport jobs by status:");
  for (const [status, n] of Object.entries(integrity.importJobsByStatus)) {
    console.log(`  ${status}: ${n}`);
  }
}

if (!integrity.issues?.length) {
  console.log("\n✓ No integrity issues found");
} else {
  console.log(`\nIssues (${integrity.issues.length}):`);
  for (const issue of integrity.issues) {
    console.log(`  [${issue.severity}] ${issue.code}${issue.count != null ? `: ${issue.count}` : ""}${issue.message ? ` — ${issue.message}` : ""}`);
  }
}

console.log(`\nResult: ${integrity.ok ? "PASS" : "WARNINGS"}\n`);
process.exit(integrity.ok ? 0 : 1);
