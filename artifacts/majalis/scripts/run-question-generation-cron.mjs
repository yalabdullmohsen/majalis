#!/usr/bin/env node
/** Local dry-run of daily generation cron (requires secrets for live AI). */
import { runDailyGeneration } from "../lib/question-generation/pipeline.mjs";

const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry-run");

if (dryRun) {
  console.log("Dry-run: pipeline module loaded OK");
  process.exit(0);
}

const result = await runDailyGeneration({ force });
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
