#!/usr/bin/env node
/**
 * Import all Phase 2 trial JSON files into Supabase.
 * Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPhase2TrialImport } from "../lib/content-import/phase2-trial.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");

const result = await runPhase2TrialImport(root, { dryRun });

console.log("\n══════════════════════════════════════════");
console.log(`  Phase 2 Trial Import${dryRun ? " (dry-run)" : ""}`);
console.log("══════════════════════════════════════════");
console.log(
  `قرئ: ${result.totals.read} · استورد: ${result.totals.imported} · تخطى: ${result.totals.skipped} · فشل: ${result.totals.failed}`,
);

for (const row of result.reports) {
  const s = row.report.stats || {};
  console.log(`\n• ${row.label} (${row.type})`);
  console.log(`  استورد: ${s.imported ?? 0} · تخطى: ${s.skipped ?? 0} · فشل: ${s.failed ?? 0}`);
  for (const err of [...(row.report.validationErrors || []), ...(row.report.importErrors || [])]) {
    console.log(`  ⚠ ${err}`);
  }
}

console.log(`\n${result.ok ? "✓ نجح الاستيراد" : "✗ اكتمل مع أخطاء"}\n`);
process.exit(result.ok ? 0 : 1);
