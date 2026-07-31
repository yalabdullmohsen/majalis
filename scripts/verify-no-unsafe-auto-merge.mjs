#!/usr/bin/env node
/**
 * Ensures auto-merge workflow (if present) never undrafts and skips Draft/failed/conflicting PRs.
 * Forbids pull_request_target + write. Allows controlled `gh pr merge --auto` only in allowlisted file.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workflowsDir = join(root, ".github", "workflows");
const ALLOW_MERGE_FILE = "auto-merge-to-main.yml";

let failed = 0;
function bad(msg) {
  console.error(`  ✗ ${msg}`);
  failed++;
}
function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

function stripComments(body) {
  return body
    .split("\n")
    .map((line) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("#")) return "";
      const idx = line.indexOf("#");
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join("\n");
}

console.log("=== verify-no-unsafe-auto-merge ===\n");
const files = readdirSync(workflowsDir).filter((f) => /\.ya?ml$/i.test(f));
ok(`${files.length} workflow file(s)`);

for (const file of files) {
  const body = readFileSync(join(workflowsDir, file), "utf8");
  const active = stripComments(body);

  if (/pull_request_target/.test(active) && /permissions:[\s\S]{0,200}(contents:\s*write|pull-requests:\s*write)/.test(active)) {
    bad(`${file}: pull_request_target with write`);
  }

  // Undraft is always forbidden
  if (/gh\s+pr\s+ready\b(?!\s+--undo)/.test(active)) {
    bad(`${file}: gh pr ready (undraft) is forbidden`);
  }

  const merges = /gh\s+pr\s+merge\b/.test(active) || /enablePullRequestAutoMerge/.test(active);
  if (merges && file !== ALLOW_MERGE_FILE) {
    bad(`${file}: gh pr merge only allowed in ${ALLOW_MERGE_FILE}`);
  }
}

const autoPath = join(workflowsDir, ALLOW_MERGE_FILE);
if (existsSync(autoPath)) {
  const body = readFileSync(autoPath, "utf8");
  const active = stripComments(body);
  ok(`${ALLOW_MERGE_FILE} present`);
  if (!/isDraft/.test(body) || !/Draft/.test(body)) {
    bad(`${ALLOW_MERGE_FILE}: must skip Draft PRs`);
  }
  if (/gh\s+pr\s+ready\b(?!\s+--undo)/.test(active)) {
    bad(`${ALLOW_MERGE_FILE}: must not undraft`);
  }
  if (!/--auto/.test(active)) {
    bad(`${ALLOW_MERGE_FILE}: expected --auto squash path`);
  }
  if (!/CONFLICTING|conflicting/.test(body)) {
    bad(`${ALLOW_MERGE_FILE}: must skip conflicting PRs`);
  }
  if (!/MERGEABLE/.test(body)) {
    bad(`${ALLOW_MERGE_FILE}: must require mergeable=MERGEABLE`);
  }
  if (!/CHANGES_REQUESTED/.test(body)) {
    bad(`${ALLOW_MERGE_FILE}: must skip Changes Requested`);
  }
  if (!/headRefOid|head_sha/.test(body)) {
    bad(`${ALLOW_MERGE_FILE}: must compare head SHA before/after checks`);
  }
  if (!/quality_ok|quality\\b|Verify build/.test(body)) {
    bad(`${ALLOW_MERGE_FILE}: must require CI/quality success`);
  }
  if (!/postgres-integration/.test(body)) {
    bad(`${ALLOW_MERGE_FILE}: must gate on postgres-integration when present`);
  }
  if (!/xcodebuild-simulator|has_ios/.test(body)) {
    bad(`${ALLOW_MERGE_FILE}: must gate iOS path changes on xcodebuild-simulator`);
  }
  if (!/has_sql|supabase|migration/.test(body)) {
    bad(`${ALLOW_MERGE_FILE}: must detect SQL/migration path changes`);
  }
  if (/PROD_DEPLOY_TOKEN/.test(active) && /GH_TOKEN:\s*\$\{\{\s*secrets\.PROD_DEPLOY_TOKEN/.test(active)) {
    bad(`${ALLOW_MERGE_FILE}: prefer GITHUB_TOKEN; do not default GH_TOKEN to wide PAT`);
  }
  if (!/secrets\.GITHUB_TOKEN|github\.token/.test(body)) {
    bad(`${ALLOW_MERGE_FILE}: expected GITHUB_TOKEN for merge API`);
  }
  if (/gh\s+pr\s+ready\b(?!\s+--undo)/.test(active)) {
    bad(`${ALLOW_MERGE_FILE}: must not undraft`);
  }
  if (!/release-train-ready/.test(body)) {
    bad(`${ALLOW_MERGE_FILE}: must skip release-train-ready PRs (owned by scheduled train)`);
  }
  if (!/human review|مراجعة بشرية/i.test(body)) {
    bad(`${ALLOW_MERGE_FILE}: must gate Auth/SQL/iOS/Cron for human review`);
  }
} else {
  ok(`${ALLOW_MERGE_FILE} absent (auto-merge disabled)`);
}

const trainWf = join(workflowsDir, "scheduled-release-train.yml");
if (existsSync(trainWf)) {
  const trainBody = readFileSync(trainWf, "utf8");
  const trainActive = stripComments(trainBody);
  ok("scheduled-release-train.yml present");
  if (!/cron:\s*"0 3 \* \* \*"/.test(trainBody) || !/cron:\s*"0 15 \* \* \*"/.test(trainBody)) {
    bad("scheduled-release-train.yml: expected Kuwait 06:00/18:00 crons (UTC 03:00/15:00)");
  }
  if (!/group:\s*release-train/.test(trainBody)) {
    bad("scheduled-release-train.yml: concurrency group release-train required");
  }
  if (!/cancel-in-progress:\s*false/.test(trainBody)) {
    bad("scheduled-release-train.yml: cancel-in-progress must be false");
  }
  if (/gh\s+pr\s+merge\b/.test(trainActive) || /enablePullRequestAutoMerge/.test(trainActive)) {
    bad("scheduled-release-train.yml: merge must live in .github/scripts/release-train (not workflow YAML)");
  }
  if (!/release-train\/run-train\.mjs/.test(trainBody)) {
    bad("scheduled-release-train.yml: must invoke run-train.mjs");
  }
} else {
  ok("scheduled-release-train.yml absent");
}

if (failed) {
  console.error(`\n${failed} issue(s)`);
  process.exit(1);
}
console.log("\nAll auto-merge safety checks passed.");
