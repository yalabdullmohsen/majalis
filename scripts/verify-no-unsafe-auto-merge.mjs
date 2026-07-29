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
  if (!/quality_ok|quality\\b|Verify build/.test(body)) {
    bad(`${ALLOW_MERGE_FILE}: must require CI/quality success`);
  }
} else {
  ok(`${ALLOW_MERGE_FILE} absent (auto-merge disabled)`);
}

if (failed) {
  console.error(`\n${failed} issue(s)`);
  process.exit(1);
}
console.log("\nAll auto-merge safety checks passed.");
