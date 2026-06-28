#!/usr/bin/env node
/**
 * Phase 13 — Final verification suite.
 */
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const steps = [
  { name: "typecheck", cmd: "pnpm", args: ["run", "typecheck"] },
  { name: "lint", cmd: "pnpm", args: ["run", "lint"] },
  { name: "connector-health", cmd: "node", args: ["scripts/test-connector-health-classifier.mjs"] },
  { name: "vision-fallback", cmd: "node", args: ["scripts/test-vision-provider-fallback.mjs"] },
  { name: "production-audit", cmd: "node", args: ["scripts/production-audit-full.mjs"] },
  { name: "security-audit", cmd: "node", args: ["scripts/security-audit.mjs"] },
  { name: "verify-hardening", cmd: "node", args: ["scripts/verify-production-hardening.mjs"] },
  { name: "verify-features", cmd: "node", args: ["scripts/verify-features.mjs"] },
  { name: "smoke-admin-nav", cmd: "node", args: ["scripts/smoke-admin-nav.mjs"] },
  { name: "smoke-nav", cmd: "node", args: ["scripts/smoke-nav-menu.mjs"] },
];

const report = {
  at: new Date().toISOString(),
  steps: [],
  pass: 0,
  fail: 0,
  ok: false,
};

for (const step of steps) {
  const r = spawnSync(step.cmd, step.args, { cwd: ROOT, encoding: "utf8", timeout: 120_000 });
  const ok = r.status === 0;
  report.steps.push({
    name: step.name,
    ok,
    exitCode: r.status,
    stderr: r.stderr?.slice(0, 300) || null,
  });
  if (ok) report.pass++;
  else report.fail++;
}

report.ok = report.fail === 0;
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
