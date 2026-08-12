#!/usr/bin/env node
import { generateGovernanceReport } from "../lib/governance/report.mjs";
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";

generateGovernanceReport(getSupabaseAdmin())
  .then((report) => {
    console.log(`Report generated — ${report.production_readiness_pct}% production ready`);
    console.log(`Completion: ${report.completion_pct}%, Roles: ${report.roles_count}`);
    console.log(`Risks: ${report.risks?.length || 0} identified`);
    console.log(`Saved to data/governance-report.json`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
