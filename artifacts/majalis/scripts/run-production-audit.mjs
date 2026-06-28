#!/usr/bin/env node
/**
 * Production Audit — Phase 1 comprehensive static checks.
 * Usage: node scripts/run-production-audit.mjs
 */
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const findings = { critical: [], warning: [], ok: [] };
let score = 100;

function add(level, msg) {
  findings[level].push(msg);
  if (level === "critical") score -= 8;
  if (level === "warning") score -= 2;
}

function read(path) {
  try {
    return readFileSync(join(ROOT, path), "utf8");
  } catch {
    return "";
  }
}

console.log("\n═══ Majalis Production Audit ═══\n");

const vercel = JSON.parse(read("vercel.json") || "{}");
const crons = vercel.crons || [];
add("ok", `Vercel crons registered: ${crons.length}`);

if (crons.some((c) => c.path === "/api/cron/import-phase2-trial")) {
  add("warning", "Phase2 trial cron still listed (handler blocks in production mode)");
} else {
  add("ok", "Phase2 trial cron removed from schedule");
}

if (existsSync(join(ROOT, "lib/production-guard.mjs"))) {
  add("ok", "Production Guard module present");
} else {
  add("critical", "Missing lib/production-guard.mjs");
}

for (const page of ["src/views/FawaidPage.tsx", "src/views/QaPage.tsx", "src/views/QuizPage.tsx", "src/views/SearchPage.tsx"]) {
  const src = read(page);
  if (src.includes("DEMO_FAWAID") || src.includes("DEMO_QA") || src.includes("DEMO_QUIZ") || src.includes("searchDemoContent")) {
    add("critical", `${page} still references DEMO_* fallbacks`);
  } else if (src) {
    add("ok", `${page} — no DEMO_* page fallbacks`);
  }
}

const importCron = read("lib/api-handlers/cron/process-import-jobs.js");
if (importCron.includes("validateCronAuth")) {
  add("ok", "process-import-jobs cron requires auth");
} else {
  add("critical", "process-import-jobs cron has NO auth");
}

const cpAdmin = read("lib/api-handlers/admin/content-production.js");
if (cpAdmin.includes("requireAdminAccess")) {
  add("ok", "content-production admin requires auth");
} else {
  add("critical", "content-production admin has NO auth gate");
}

const trialDir = join(ROOT, "data/imports/trial");
if (existsSync(trialDir)) {
  const trialFiles = readdirSync(trialDir).filter((f) => f.includes("phase2"));
  if (trialFiles.length) {
    add("warning", `Trial import files in repo (${trialFiles.length}) — import blocked in production`);
  }
}

const fawaidCsv = read("data/imports/fawaid_500.csv");
if (fawaidCsv.includes("[import-")) {
  add("critical", "fawaid_500.csv still contains [import-N] markers");
} else if (fawaidCsv) {
  add("ok", "fawaid_500.csv markers stripped");
}

try {
  execSync("pnpm run typecheck", { cwd: ROOT, stdio: "pipe" });
  add("ok", "TypeScript typecheck passes");
} catch (e) {
  add("critical", `TypeScript typecheck failed`);
}

try {
  execSync("node scripts/test-public-no-demo-content.mjs", { cwd: ROOT, stdio: "pipe" });
  add("ok", "test-public-no-demo-content passes");
} catch {
  add("warning", "test-public-no-demo-content failed");
}

const devPage = read("src/views/DeveloperPage.tsx");
if (devPage.includes("apiBase}/api/v1/docs")) {
  add("ok", "DeveloperPage uses absolute API links");
} else if (devPage.includes('Link href="/api/v1/docs')) {
  add("warning", "DeveloperPage uses wouter Link for API docs");
}

const serverData = read("lib/supabase/server-data.ts");
if (serverData.includes("allowSeedFallback()") && serverData.includes("filterPublicRecords")) {
  add("ok", "server-data.ts uses production gating");
} else {
  add("warning", "server-data.ts may lack full production gating");
}

score = Math.max(0, Math.min(100, score));

console.log("CRITICAL:", findings.critical.length);
findings.critical.forEach((f) => console.log("  ✗", f));
console.log("\nWARNINGS:", findings.warning.length);
findings.warning.forEach((f) => console.log("  ⚠", f));
console.log("\nOK:", findings.ok.length);
findings.ok.forEach((f) => console.log("  ✓", f));

console.log(`\n═══ Production Readiness Score: ${score}% ═══\n`);

const report = { timestamp: new Date().toISOString(), score, findings, crons: crons.length };
mkdirSync(join(ROOT, "data"), { recursive: true });
writeFileSync(join(ROOT, "data/production-audit-report.json"), JSON.stringify(report, null, 2));
console.log("Report: data/production-audit-report.json\n");

process.exit(findings.critical.length > 0 ? 1 : 0);
