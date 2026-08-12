#!/usr/bin/env node
/**
 * Bootstrap verified knowledge content locally or against production DB.
 * Usage: node scripts/bootstrap-verified-knowledge.mjs [--dry-run]
 */

import { runVerifiedKnowledgeCycle } from "../lib/verified-knowledge/orchestrator.mjs";

const dryRun = process.argv.includes("--dry-run");

const result = await runVerifiedKnowledgeCycle({
  dryRun,
  trigger: "cli",
  persistVerification: !dryRun,
});

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
