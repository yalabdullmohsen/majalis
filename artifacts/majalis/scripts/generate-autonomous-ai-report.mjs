#!/usr/bin/env node
import { generateAutonomousPlatformReport } from "../lib/autonomous-ai/reports.mjs";
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";

const admin = getSupabaseAdmin();

generateAutonomousPlatformReport(admin)
  .then((report) => {
    console.log(`Report generated — automation ${report.automation_pct}%`);
    console.log(`Security: ${report.security_score}, Performance: ${report.performance_score}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
