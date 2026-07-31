#!/usr/bin/env node
/**
 * Ensures auto-merge workflow (if present) never undrafts and skips Draft/failed/conflicting PRs.
 * Forbids pull_request_target + write. Allows controlled `gh pr merge --auto` only in allowlisted file.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
  if (!/safe-auto-merge\/cli\.mjs/.test(body)) {
    bad(`${ALLOW_MERGE_FILE}: must invoke safe-auto-merge/cli.mjs for policy`);
  }
  if (!/evaluate\s+--pr/.test(body) && !/evaluate --pr/.test(body)) {
    bad(`${ALLOW_MERGE_FILE}: must run evaluate --pr`);
  }
  if (!/strict-vercel/.test(body)) {
    bad(`${ALLOW_MERGE_FILE}: must use --strict-vercel for merge enable`);
  }
  if (!/content-safe|SAFE_LABELS|safe-auto-merge/.test(body)) {
    // Policy labels live in scripts; workflow must still call the script.
    ok(`${ALLOW_MERGE_FILE}: policy delegated to safe-auto-merge scripts`);
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
} else {
  ok(`${ALLOW_MERGE_FILE} absent (auto-merge disabled)`);
}

const safeMergeDir = join(root, ".github", "scripts", "safe-auto-merge");
if (existsSync(safeMergeDir)) {
  ok("safe-auto-merge scripts present");
  const { SAFE_LABELS, MAX_FILES_FOR_AUTO_MERGE, DANGER_PATH_PATTERNS } = await import(
    pathToFileURL(join(safeMergeDir, "constants.mjs")).href
  );
  const eligibility = readFileSync(join(safeMergeDir, "eligibility.mjs"), "utf8");
  for (const label of [
    "safe:auto-merge",
    "safe:content",
    "safe:ui",
    "safe:test",
    "content-safe",
    "ui-safe",
    "code-safe",
    "tests-safe",
    "maintenance-safe",
  ]) {
    if (!SAFE_LABELS.includes(label)) {
      bad(`safe-auto-merge/constants.mjs: missing SAFE_LABEL ${label}`);
    }
  }
  if (MAX_FILES_FOR_AUTO_MERGE !== 40) {
    bad("safe-auto-merge: MAX_FILES_FOR_AUTO_MERGE must be 40");
  }
  const dangerSrc = DANGER_PATH_PATTERNS.map((r) => r.toString()).join("\n");
  for (const needle of [
    "supabase",
    "workflows",
    "fastlane",
    "ios",
    "capacitor",
    "package",
    "pnpm-lock",
    "vercel",
    "api-handlers",
    "lib\\/security",
    "lib\\/auth",
    "lib\\/jobs",
    "majalis\\/api",
  ]) {
    if (!dangerSrc.includes(needle)) {
      bad(`safe-auto-merge: danger path missing coverage for ${needle}`);
    }
  }
  // Smoke-test a few concrete paths against the live patterns
  const mustMatch = [
    "supabase/migrations/001.sql",
    "artifacts/majalis/supabase/migrations/x.sql",
    ".github/workflows/ci.yml",
    "fastlane/Fastfile",
    "artifacts/majalis/ios/App/App/AppDelegate.swift",
    "artifacts/majalis/capacitor.config.ts",
    "artifacts/majalis/api/index.js",
    "artifacts/majalis/lib/api-handlers/cron/job-worker.js",
    "artifacts/majalis/lib/security/ssrf.mjs",
    "artifacts/majalis/lib/auth/session.js",
    "artifacts/majalis/lib/jobs/queue.mjs",
    "package.json",
    "pnpm-lock.yaml",
    "artifacts/majalis/vercel.json",
  ];
  for (const p of mustMatch) {
    if (!DANGER_PATH_PATTERNS.some((re) => re.test(p))) {
      bad(`safe-auto-merge: pattern failed to match ${p}`);
    }
  }
  if (!/release-train-ready/.test(eligibility) && !/RELEASE_TRAIN_LABEL/.test(eligibility)) {
    bad("safe-auto-merge: must skip release-train-ready");
  }
  if (!/CHANGES_REQUESTED/.test(eligibility)) {
    bad("safe-auto-merge: must skip CHANGES_REQUESTED");
  }
  if (!existsSync(join(workflowsDir, "pr-safe-merge-report.yml"))) {
    bad("pr-safe-merge-report.yml missing (required PR eligibility report)");
  } else {
    const reportWf = readFileSync(join(workflowsDir, "pr-safe-merge-report.yml"), "utf8");
    if (!/safe-auto-merge\/cli\.mjs report/.test(reportWf)) {
      bad("pr-safe-merge-report.yml must post report via cli.mjs");
    }
    if (/gh\s+pr\s+merge|--auto/.test(stripComments(reportWf))) {
      bad("pr-safe-merge-report.yml must not merge");
    }
  }
} else {
  bad("safe-auto-merge scripts directory missing");
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

const supabaseWf = join(workflowsDir, "supabase-migrations.yml");
if (existsSync(supabaseWf)) {
  const sb = readFileSync(supabaseWf, "utf8");
  const sbActive = stripComments(sb);
  ok("supabase-migrations.yml present");
  if (/version:\s*['"]?latest['"]?/.test(sbActive)) {
    bad("supabase-migrations.yml: Supabase CLI must be pinned (not latest)");
  }
  if (!/SUPABASE_CLI_VERSION:\s*"?\d+\.\d+\.\d+"?/.test(sb) && !/version:\s*['"]?\d+\.\d+\.\d+['"]?/.test(sbActive)) {
    bad("supabase-migrations.yml: expected pinned SemVer CLI version");
  }
  if (/ALLOW_SUPABASE_AUTO_MIGRATE/.test(sbActive)) {
    bad("supabase-migrations.yml: ALLOW_SUPABASE_AUTO_MIGRATE must not enable Production push");
  }
  // db push must be gated: only under apply==true paths
  const pushLines = sbActive.split("\n").filter((l) => /supabase\s+db\s+push/.test(l));
  if (pushLines.length === 0) {
    bad("supabase-migrations.yml: expected supabase db push steps for dispatch apply");
  }
  if (!/steps\.gate\.outputs\.apply\s*==\s*'true'/.test(sb) && !/outputs\.apply\s*==\s*'true'/.test(sb)) {
    bad("supabase-migrations.yml: db push must require gate apply=true");
  }
  if (/--include-all/.test(sbActive) && !/confirm_include_all/.test(sb)) {
    bad("supabase-migrations.yml: --include-all requires confirm_include_all input");
  }
  if (/--include-all/.test(sbActive) && !/include_all\s*==\s*'true'/.test(sb)) {
    bad("supabase-migrations.yml: --include-all step must require include_all=true");
  }
} else {
  ok("supabase-migrations.yml absent");
}

if (failed) {
  console.error(`\n${failed} issue(s)`);
  process.exit(1);
}
console.log("\nAll auto-merge safety checks passed.");
