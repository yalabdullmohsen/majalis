#!/usr/bin/env node
import { generateIslamicIntelligenceReport } from "../lib/islamic-intelligence/report.mjs";
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";

generateIslamicIntelligenceReport(getSupabaseAdmin())
  .then((report) => {
    console.log(`Report generated — ${report.completion_pct}% complete`);
    console.log(`Agents: ${report.ai_agent_count}, Automation: ${report.automation_pct}%`);
    console.log(`Saved to data/islamic-intelligence-report.json`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
