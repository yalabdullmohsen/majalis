#!/usr/bin/env node
/**
 * Interactive Elements — PR-0 static audit (لا يغني عن الاختبار الفعلي).
 * Usage: node scripts/interactive-elements-static-audit.mjs
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(majalisRoot, "../..");
const srcRoot = join(majalisRoot, "src");

function walk(dir, out = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", "__tests__"].includes(ent.name)) continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|jsx|js)$/.test(ent.name) && !/\.test\.|\.spec\./.test(ent.name)) out.push(p);
  }
  return out;
}

function countRoutes() {
  const routes = readFileSync(join(majalisRoot, "src/app/router/routes.ts"), "utf8");
  const paths = [...routes.matchAll(/^\s*"(\/[^"]*)",?\s*$/gm)].map((m) => m[1]);
  return [...new Set(paths)];
}

const files = walk(srcRoot);
const findings = {
  hrefHash: [],
  emptyOnClick: [],
  javascriptHref: [],
  notImplemented: [],
};
const counts = {
  buttonOpenTags: 0,
  anchorOpenTags: 0,
  roleButton: 0,
  onClickAttrs: 0,
};

const emptyClickRe = /onClick=\{\(\)\s*=>\s*\{\s*\}\}/g;
const hrefHashRe = /href=["']#["']/g;
const jsHrefRe = /href=["']javascript:/gi;
const notImplRe = /Not Implemented|TODO:\s*(?:implement|wire|handler|action)/gi;

for (const file of files) {
  const rel = relative(majalisRoot, file);
  const text = readFileSync(file, "utf8");
  counts.buttonOpenTags += (text.match(/<button\b/g) || []).length;
  counts.anchorOpenTags += (text.match(/<a\b/g) || []).length;
  counts.roleButton += (text.match(/role=["']button["']/g) || []).length;
  counts.onClickAttrs += (text.match(/\bonClick=/g) || []).length;

  const lines = text.split(/\n/);
  lines.forEach((line, i) => {
    const n = i + 1;
    if (hrefHashRe.test(line)) findings.hrefHash.push({ file: rel, line: n, snippet: line.trim().slice(0, 140) });
    hrefHashRe.lastIndex = 0;
    if (emptyClickRe.test(line)) findings.emptyOnClick.push({ file: rel, line: n, snippet: line.trim().slice(0, 140) });
    emptyClickRe.lastIndex = 0;
    if (jsHrefRe.test(line)) findings.javascriptHref.push({ file: rel, line: n, snippet: line.trim().slice(0, 140) });
    jsHrefRe.lastIndex = 0;
    if (notImplRe.test(line)) findings.notImplemented.push({ file: rel, line: n, snippet: line.trim().slice(0, 140) });
    notImplRe.lastIndex = 0;
  });
}

let commit = "UNKNOWN";
try {
  commit = execSync("git rev-parse --short HEAD", { cwd: repoRoot, encoding: "utf8" }).trim();
} catch {
  /* ignore */
}

const routePaths = countRoutes();
const report = {
  schemaVersion: 1,
  pr: "PR-0",
  measuredAt: new Date().toISOString(),
  commit,
  routesFromRegistry: routePaths.length,
  sourceFilesScanned: files.length,
  tagCounts: counts,
  staticFindings: {
    hrefHash: findings.hrefHash.length,
    emptyOnClick: findings.emptyOnClick.length,
    javascriptHref: findings.javascriptHref.length,
    notImplementedOrTodoAction: findings.notImplemented.length,
  },
  samples: {
    hrefHash: findings.hrefHash.slice(0, 40),
    emptyOnClick: findings.emptyOnClick.slice(0, 40),
    javascriptHref: findings.javascriptHref.slice(0, 20),
    notImplemented: findings.notImplemented.slice(0, 40),
  },
  runtimeStatus: "NOT_MEASURED",
  note: "Static scan only. PASS/BROKEN/NO_OP runtime counts require Playwright matrix (PR-2+).",
};

const outDir = join(repoRoot, "docs/qa");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "interactive-static-findings.json"), JSON.stringify(report, null, 2));
writeFileSync(join(outDir, "interactive-routes-registry.json"), JSON.stringify({ commit, count: routePaths.length, paths: routePaths }, null, 2));
console.log(JSON.stringify({ commit, routes: routePaths.length, staticFindings: report.staticFindings, tagCounts: counts }, null, 2));
