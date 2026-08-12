#!/usr/bin/env node
import { generateScholarlyIntelligenceReport } from "../lib/scholarly-intelligence/report.mjs";

generateScholarlyIntelligenceReport()
  .then((report) => {
    console.log(`Report generated — ${report.completion_pct}% complete`);
    console.log(`Topics: ${report.metrics.topics_count}, Avg search: ${report.metrics.avg_search_ms}ms`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
