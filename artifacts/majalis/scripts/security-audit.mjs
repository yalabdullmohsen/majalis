#!/usr/bin/env node
/**
 * Phase 11 — Security audit (static checks).
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const issues = [];

function scanDir(dir, patterns) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory() && f.name !== "node_modules") scanDir(p, patterns);
    else if (/\.(js|mjs|ts|tsx)$/.test(f.name)) {
      const content = readFileSync(p, "utf8");
      for (const { id, re, severity } of patterns) {
        if (re.test(content)) issues.push({ id, severity, file: p.replace(ROOT + "/", ""), pattern: re.source });
      }
    }
  }
}

const patterns = [
  { id: "hardcoded_secret", re: /(?:api[_-]?key|secret|password)\s*[:=]\s*['"][^'"]{8,}['"]/i, severity: "critical" },
  { id: "eval_usage", re: /\beval\s*\(/, severity: "high" },
  { id: "innerHTML", re: /dangerouslySetInnerHTML/, severity: "medium" },
  { id: "missing_cron_auth", re: /export default async function handler[\s\S]{0,200}(?!validateCronAuth)/, severity: "info" },
];

scanDir(join(ROOT, "lib/api-handlers"), patterns);
scanDir(join(ROOT, "src"), [{ id: "innerHTML", re: /dangerouslySetInnerHTML/, severity: "medium" }]);

const cronHandlers = existsSync(join(ROOT, "lib/api-handlers/cron"))
  ? readdirSync(join(ROOT, "lib/api-handlers/cron")).filter((f) => f.endsWith(".js"))
  : [];

let cronWithoutAuth = 0;
for (const f of cronHandlers) {
  const c = readFileSync(join(ROOT, "lib/api-handlers/cron", f), "utf8");
  if (!c.includes("validateCronAuth")) cronWithoutAuth++;
}

const report = {
  at: new Date().toISOString(),
  issues: issues.slice(0, 50),
  issueCount: issues.length,
  cronHandlers: cronHandlers.length,
  cronWithoutAuth,
  checks: {
    xss: issues.filter((i) => i.id === "innerHTML").length,
    secrets: issues.filter((i) => i.id === "hardcoded_secret").length,
    eval: issues.filter((i) => i.id === "eval_usage").length,
    cronAuth: cronWithoutAuth === 0 ? "PASS" : "WARN",
  },
  ok: issues.filter((i) => i.severity === "critical").length === 0,
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
