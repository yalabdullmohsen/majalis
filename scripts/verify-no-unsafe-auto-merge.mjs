#!/usr/bin/env node
/**
 * Fails if workflows contain unsafe auto-merge / undraft automation.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workflowsDir = join(root, ".github", "workflows");

const FORBIDDEN = [
  { re: /gh\s+pr\s+merge\b/i, label: "gh pr merge" },
  { re: /--auto\s+--squash|--squash\s+--auto/i, label: "gh merge --auto --squash" },
  { re: /enablePullRequestAutoMerge/i, label: "enablePullRequestAutoMerge" },
  { re: /gh\s+pr\s+ready\b(?!\s+--undo)/i, label: "gh pr ready (undraft)" },
  { re: /\/repos\/[^/]+\/[^/]+\/pulls\/\d+\/merge/i, label: "REST pulls merge endpoint" },
  {
    re: /pull_request_target[\s\S]{0,800}permissions:[\s\S]{0,200}(contents:\s*write|pull-requests:\s*write)/i,
    label: "pull_request_target with write",
  },
];

let failed = 0;
function bad(msg) {
  console.error(`  ✗ ${msg}`);
  failed++;
}
function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

console.log("=== verify-no-unsafe-auto-merge ===\n");
const files = readdirSync(workflowsDir).filter((f) => /\.ya?ml$/i.test(f));
ok(`${files.length} workflow file(s)`);

for (const file of files) {
  const body = readFileSync(join(workflowsDir, file), "utf8");
  const active = body
    .split("\n")
    .map((line) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("#")) return "";
      const idx = line.indexOf("#");
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join("\n");
  for (const { re, label } of FORBIDDEN) {
    if (re.test(active)) bad(`${file}: forbidden «${label}»`);
  }
}

if (existsSync(join(workflowsDir, "auto-merge-to-main.yml"))) {
  bad("auto-merge-to-main.yml must not exist");
} else {
  ok("auto-merge-to-main.yml removed");
}

if (failed) {
  console.error(`\n${failed} issue(s)`);
  process.exit(1);
}
console.log("\nAll auto-merge safety checks passed.");
