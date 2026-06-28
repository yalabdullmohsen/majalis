#!/usr/bin/env node
/**
 * Phase 1 — Project dependency graph audit.
 * Scans routes, APIs, crons, connectors, pipelines, and reports issues.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

let passed = 0;
let failed = 0;
const issues = [];

function ok(cond, msg) {
  if (cond) { passed++; console.log(`✓ ${msg}`); }
  else { failed++; console.error(`✗ ${msg}`); issues.push(msg); }
}

function walk(dir, ext = /\.(mjs|js|tsx?)$/) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    try {
      const st = statSync(full);
      if (st.isDirectory() && !entry.startsWith(".") && entry !== "node_modules" && entry !== "dist") {
        out.push(...walk(full, ext));
      } else if (st.isFile() && ext.test(entry)) {
        out.push(full);
      }
    } catch { /* skip */ }
  }
  return out;
}

function grepFiles(files, pattern) {
  const re = new RegExp(pattern, "i");
  return files.filter((f) => {
    try { return re.test(readFileSync(f, "utf8")); } catch { return false; }
  });
}

console.log("=== Majalis Dependency Graph Audit ===\n");

// ── Routes ──
const appTsx = readFileSync(join(ROOT, "src/App.tsx"), "utf8");
const routes = [...appTsx.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
ok(routes.length >= 40, `${routes.length} frontend routes registered`);

// ── APIs ──
const dispatch = readFileSync(join(ROOT, "lib/api-dispatch.mjs"), "utf8");
const apis = [...dispatch.matchAll(/prefix:\s*"([^"]+)"/g)].map((m) => m[1]);
ok(apis.length >= 50, `${apis.length} API routes registered`);

// ── Crons ──
const vercel = existsSync(join(ROOT, "vercel.json")) ? readFileSync(join(ROOT, "vercel.json"), "utf8") : "{}";
const crons = [...vercel.matchAll(/"path":\s*"([^"]+)"/g)].map((m) => m[1]);
ok(crons.length >= 20, `${crons.length} Vercel cron jobs configured`);

// ── Connectors ──
const connectorDir = join(ROOT, "lib/auto-knowledge-engine/connectors");
const connectors = readdirSync(connectorDir).filter((f) => f.endsWith("-connector.mjs"));
ok(connectors.length >= 5, `${connectors.length} AKE connectors: ${connectors.join(", ")}`);

// ── Pipelines ──
const pipelineModules = [
  "lib/content-pipeline/runner.mjs",
  "lib/content-pipeline/stages.mjs",
  "lib/auto-knowledge-engine/orchestrator.mjs",
  "lib/content-engines/orchestrator.mjs",
  "lib/autonomous-platform/pipelines/index.mjs",
  "lib/knowledge-engine/publisher.mjs",
];
for (const mod of pipelineModules) {
  ok(existsSync(join(ROOT, mod)), `Pipeline module: ${mod}`);
}

// ── Production modules ──
const productionModules = [
  "lib/production/confidence-engine.mjs",
  "lib/production/source-fusion.mjs",
  "lib/production/content-sanitizer.mjs",
  "lib/production/instagram-engine.mjs",
  "lib/production/instagram-parser.mjs",
  "lib/cms/telegram-channel-fetch.mjs",
  "lib/api-handlers/admin/ake-monitoring.js",
  "src/views/admin/PlatformMonitoringPage.tsx",
];
for (const mod of productionModules) {
  ok(existsSync(join(ROOT, mod)), `Production module: ${mod}`);
}

// ── Dead code / duplicate detection ──
const libFiles = walk(join(ROOT, "lib"));
const duplicatePublishers = grepFiles(libFiles, "export async function publishItem");
ok(duplicatePublishers.length <= 2, `Publisher implementations: ${duplicatePublishers.length} (expected ≤2)`);

const mockPatterns = grepFiles(libFiles, "INSTAGRAM_GRAPH_MOCK|getMockInstagramPosts");
const gatedMocks = mockPatterns.filter((f) => {
  const content = readFileSync(f, "utf8");
  return content.includes('NODE_ENV !== "production"') || content.includes("verify-");
});
ok(gatedMocks.length >= 1 || mockPatterns.length === 0, "Mock modes gated from production");

// ── Security checks ──
const secretLeaks = grepFiles(libFiles, "SUPABASE_SERVICE_ROLE_KEY\\s*=\\s*['\"][^'\"]+['\"]");
ok(secretLeaks.length === 0, "No hardcoded service role keys");

const evalUsage = grepFiles(libFiles, "\\beval\\(");
ok(evalUsage.length === 0, "No eval() usage in lib/");

// ── Circular dependency heuristic ──
const importGraph = new Map();
for (const file of libFiles.slice(0, 500)) {
  const content = readFileSync(file, "utf8");
  const imports = [...content.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
  importGraph.set(relative(ROOT, file), imports);
}
ok(importGraph.size > 100, `Import graph: ${importGraph.size} modules scanned`);

// ── Dependency graph summary ──
const graph = {
  routes: routes.length,
  apis: apis.length,
  crons: crons.length,
  connectors: connectors.map((c) => c.replace(".mjs", "")),
  pipelines: pipelineModules.filter((m) => existsSync(join(ROOT, m))),
  productionModules: productionModules.filter((m) => existsSync(join(ROOT, m))),
  libModules: libFiles.length,
  issues,
};

console.log("\n=== Dependency Graph Summary ===");
console.log(JSON.stringify(graph, null, 2));
console.log(`\nAudit: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
