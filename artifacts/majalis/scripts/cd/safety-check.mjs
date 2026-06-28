#!/usr/bin/env node
/**
 * Safety rules check — exit 1 if auto-merge blocked.
 */
import { analyzeChangeRisk } from "../../lib/cd/safety-rules.mjs";

const risk = analyzeChangeRisk();
console.log(JSON.stringify(risk, null, 2));

if (process.argv.includes("--require-auto-merge") && !risk.autoMergeAllowed) {
  console.error(`::error::Auto-merge blocked: ${risk.riskLevel} risk — ${risk.findings.map((f) => f.reason).join(", ")}`);
  process.exit(1);
}

process.exit(0);
