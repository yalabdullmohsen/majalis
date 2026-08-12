#!/usr/bin/env node
/**
 * Emit path-lane classification to GITHUB_OUTPUT (or stdout).
 * Usage:
 *   node .github/scripts/ci/emit-path-lane.mjs [--base SHA] [--head SHA] [--full]
 */
import { execSync } from "node:child_process";
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { classifyChangedPaths } from "../safe-auto-merge/path-classifier.mjs";

function arg(name, fallback = "") {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const forceFull =
  process.argv.includes("--full") ||
  process.env.CI_FORCE_FULL === "1" ||
  (process.env.GITHUB_EVENT_NAME === "push" &&
    (process.env.GITHUB_REF === "refs/heads/main" || process.env.GITHUB_REF_NAME === "main"));

function listChangedFiles() {
  const fromEnv = (process.env.CI_CHANGED_FILES || "").trim();
  if (fromEnv) {
    return fromEnv.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  }
  const base = arg("--base", process.env.CI_BASE_SHA || "");
  const head = arg("--head", process.env.CI_HEAD_SHA || "HEAD");
  try {
    if (base) {
      return execSync(`git diff --name-only ${base}...${head}`, { encoding: "utf8" })
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // PR fallback: merge-base with origin/main
    try {
      const mb = execSync("git merge-base HEAD origin/main", { encoding: "utf8" }).trim();
      return execSync(`git diff --name-only ${mb}...HEAD`, { encoding: "utf8" })
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    } catch {
      return execSync("git diff --name-only HEAD~1...HEAD", { encoding: "utf8" })
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  } catch (e) {
    console.error("emit-path-lane: failed to list files", e);
    return [];
  }
}

const paths = listChangedFiles();
const result =
  forceFull || paths.length === 0
    ? classifyChangedPaths(paths, { forceFull: true })
    : classifyChangedPaths(paths);

const lines = Object.entries(result.outputs).map(([k, v]) => `${k}=${v}`);
const block = lines.join("\n");
console.log("path-lane classification:");
console.log(JSON.stringify({ lane: result.lane, paths: paths.slice(0, 40), outputs: result.outputs }, null, 2));

const out = process.env.GITHUB_OUTPUT;
if (out) {
  appendFileSync(out, `${block}\n`);
} else {
  writeFileSync("/dev/stdout", `${block}\n`);
}

const summary = process.env.GITHUB_STEP_SUMMARY;
if (summary && existsSync(summary) || process.env.GITHUB_STEP_SUMMARY) {
  try {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      [
        "## Path lane",
        "",
        `| Key | Value |`,
        `|-----|-------|`,
        ...lines.map((l) => {
          const [k, v] = l.split("=");
          return `| ${k} | \`${v}\` |`;
        }),
        "",
        `Files (${paths.length}):`,
        "",
        ...paths.slice(0, 50).map((p) => `- \`${p}\``),
        paths.length > 50 ? `\n… +${paths.length - 50} more` : "",
        "",
      ].join("\n"),
    );
  } catch {
    /* ignore summary errors */
  }
}

process.exit(0);
