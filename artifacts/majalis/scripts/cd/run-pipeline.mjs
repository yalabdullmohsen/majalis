#!/usr/bin/env node
/**
 * Autonomous CD Pipeline Runner — executes all pre-merge stages.
 *
 * Usage:
 *   node scripts/cd/run-pipeline.mjs
 *   node scripts/cd/run-pipeline.mjs --json
 *   node scripts/cd/run-pipeline.mjs --stage=build
 */
import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PIPELINE_STAGES } from "../../lib/cd/pipeline-stages.mjs";
import { analyzeChangeRisk } from "../../lib/cd/safety-rules.mjs";
import { recordPipelineRun } from "../../lib/cd/deploy-state.mjs";

const args = process.argv.slice(2);
const jsonOut = args.includes("--json");
const singleStage = args.find((a) => a.startsWith("--stage="))?.slice(8);

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

const started = Date.now();
const risk = analyzeChangeRisk();
const stages = singleStage
  ? PIPELINE_STAGES.filter((s) => s.id === singleStage)
  : PIPELINE_STAGES;

const results = [];
let failed = null;

for (const stage of stages) {
  const t0 = Date.now();
  try {
    execSync(stage.cmd, { stdio: "inherit", cwd: REPO_ROOT });
    results.push({ id: stage.id, label: stage.label, ok: true, ms: Date.now() - t0 });
  } catch (err) {
    const result = {
      id: stage.id,
      label: stage.label,
      ok: false,
      ms: Date.now() - t0,
      error: String(err.message || err).slice(0, 500),
    };
    results.push(result);
    if (!stage.optional) {
      failed = result;
      break;
    }
  }
}

const report = {
  ok: !failed,
  risk,
  autoMergeAllowed: risk.autoMergeAllowed && !failed,
  previewRequired: risk.previewRequired,
  stages: results,
  failedStage: failed?.id || null,
  failureReason: failed?.error || null,
  fixSuggestion: failed ? suggestFix(failed.id, failed.error) : null,
  durationMs: Date.now() - started,
};

await recordPipelineRun({
  pipelineType: "autonomous-cd",
  status: report.ok ? "success" : "failed",
  branch: process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME,
  commitSha: process.env.GITHUB_SHA,
  prNumber: process.env.GITHUB_EVENT_PULL_REQUEST_NUMBER,
  riskLevel: risk.riskLevel,
  autoMerge: false,
  stages: results,
  failureReason: report.failureReason,
  fixSuggestion: report.fixSuggestion,
  durationMs: report.durationMs,
  finishedAt: new Date().toISOString(),
});

if (jsonOut) console.log(JSON.stringify(report, null, 2));
else {
  console.log("\n=== Autonomous CD Pipeline ===");
  console.log(`Risk: ${risk.riskLevel} | Auto-merge: ${report.autoMergeAllowed ? "YES" : "NO"}`);
  for (const s of results) console.log(`  ${s.ok ? "✓" : "✗"} ${s.label} (${s.ms}ms)`);
  if (failed) console.error(`\nFAILED at ${failed.label}: ${failed.error}`);
}

process.exit(report.ok ? 0 : 1);

function suggestFix(stageId, error) {
  const hints = {
    typecheck: "Run pnpm run typecheck locally and fix TypeScript errors.",
    build: "Run pnpm --filter @workspace/majalis run build and fix build errors.",
    ake_tests: "Run pnpm run verify:ake-backfill and verify:ake-pipeline.",
    deploy_output: "Ensure dist/ builds correctly with verify:deploy.",
  };
  return hints[stageId] || `Fix errors in stage ${stageId}: ${(error || "").slice(0, 200)}`;
}
