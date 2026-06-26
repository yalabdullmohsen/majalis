#!/usr/bin/env node
import { generateGlobalReferenceReport } from "../lib/global-reference/report.mjs";
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";

generateGlobalReferenceReport(getSupabaseAdmin())
  .then((report) => {
    console.log(`Report generated — ${report.completion_pct}% complete`);
    console.log(`Refs: ${report.metrics?.refs || 0}, Relations: ${report.metrics?.relations || 0}`);
    console.log(`Roadmap: 3-year plan saved to data/global-reference-roadmap.json`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
