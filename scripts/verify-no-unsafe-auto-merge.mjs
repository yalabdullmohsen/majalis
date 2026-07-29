#!/usr/bin/env node
/**
 * Fails CI if GitHub Actions workflows contain unsafe auto-merge / undraft automation.
 * Allowed: comments, labels, reading checks. Forbidden: merge API, undraft, enable auto-merge.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workflowsDir = join(root, ".github", "workflows");

const FORBIDDEN = [
  { re: /gh\s+pr\s+merge\b/i, label: "gh pr merge" },
  { re: /gh\s+["']?\$\{[^}]+\}["']?\s+pr\s+merge\b/i, label: "gh pr merge (dynamic)" },
  { re: /--auto\s+--squash|--squash\s+--auto/i, label: "gh merge --auto --squash" },
  { re: /enablePullRequestAutoMerge/i, label: "enablePullRequestAutoMerge" },
  { re: /enablePullRequestAutoMerge|disablePullRequestAutoMerge/i, label: "PullRequestAutoMerge GraphQL/REST" },
  { re: /mutation\s+[^{]*\{[^}]*enablePullRequestAutoMerge/i, label: "GraphQL enablePullRequestAutoMerge" },
  { re: /gh\s+pr\s+ready\b(?!\s+--undo)/i, label: "gh pr ready (undraft)" },
  { re: /\/repos\/[^/]+\/[^/]+\/pulls\/\d+\/merge/i, label: "REST pulls merge endpoint" },
  { re: /pull_request_target[\s\S]{0,800}permissions:[\s\S]{0,200}(contents:\s*write|pull-requests:\s*write)/i, label: "pull_request_target with write" },
];

/** Files that may mention forbidden strings only in comments documenting the ban. */
const ALLOWLIST_FILES = new Set([
  "pr-status-no-automerge.yml", // policy comments only — still scanned for real commands
]);

let failed = 0;
function bad(msg) {
  console.error(`  ✗ ${msg}`);
  failed++;
}
function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

if (!existsSync(workflowsDir)) {
  console.error("Missing .github/workflows");
  process.exit(1);
}

console.log("=== verify-no-unsafe-auto-merge ===\n");

const files = readdirSync(workflowsDir).filter((f) => /\.ya?ml$/i.test(f));
ok(`${files.length} workflow file(s)`);

for (const file of files) {
  const full = join(workflowsDir, file);
  const body = readFileSync(full, "utf8");
  // Strip YAML comments for detection of active commands
  const active = body
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("#");
      if (idx === -1) return line;
      // keep # inside quotes roughly — simple strip of full-line / trailing comments
      const trimmed = line.trimStart();
      if (trimmed.startsWith("#")) return "";
      return line.slice(0, idx);
    })
    .join("\n");

  for (const { re, label } of FORBIDDEN) {
    if (re.test(active)) {
      bad(`${file}: forbidden pattern «${label}»`);
    }
  }

  // Extra: auto-merge job name leftovers
  if (/auto-merge|Auto-ready and merge/i.test(body) && /gh\s+pr\s+merge/i.test(active)) {
    bad(`${file}: auto-merge workflow still merges`);
  }
}

// Ensure destructive workflow was removed / replaced
if (existsSync(join(workflowsDir, "auto-merge-to-main.yml"))) {
  const body = readFileSync(join(workflowsDir, "auto-merge-to-main.yml"), "utf8");
  const active = body
    .split("\n")
    .map((l) => (l.trimStart().startsWith("#") ? "" : l))
    .join("\n");
  if (/gh\s+pr\s+merge/i.test(active) || /gh\s+pr\s+ready\b(?!\s+--undo)/i.test(active)) {
    bad("auto-merge-to-main.yml still performs merge/undraft");
  }
} else {
  ok("auto-merge-to-main.yml removed");
}

if (existsSync(join(workflowsDir, "pr-status-no-automerge.yml"))) {
  ok("pr-status-no-automerge.yml present (comment-only policy)");
} else {
  bad("missing pr-status-no-automerge.yml replacement");
}

if (failed) {
  console.error(`\n${failed} issue(s)`);
  process.exit(1);
}
console.log("\nAll auto-merge safety checks passed.");
void ALLOWLIST_FILES;
