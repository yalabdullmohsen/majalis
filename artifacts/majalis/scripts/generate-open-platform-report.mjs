#!/usr/bin/env node
import { generateOpenPlatformReport } from "../lib/open-platform/report.mjs";
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";

generateOpenPlatformReport(getSupabaseAdmin())
  .then((report) => {
    console.log(`Report generated — ${report.completion_pct}% complete`);
    console.log(`Endpoints: ${report.api_endpoints}, Resources: ${report.resources_covered}`);
    console.log(`Saved to data/open-platform-report.json`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
