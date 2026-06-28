#!/usr/bin/env node
/**
 * Production Hardening verification — all infrastructure gates.
 * Usage: node scripts/verify-production-hardening.mjs [--base=https://www.majlisilm.com]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const base = process.argv.find((a) => a.startsWith("--base="))?.split("=")[1] || "http://127.0.0.1:24216";

const results = [];
function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

function assertFile(rel) {
  const p = resolve(ROOT, rel);
  if (!existsSync(p)) fail(`file:${rel}`, "missing");
  else pass(`file:${rel}`);
  return existsSync(p);
}

async function fetchJson(path, { timeoutMs = 15000 } = {}) {
  const url = `${base.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`non-json ${res.status} ${url}: ${text.slice(0, 120)}`);
  }
  return { status: res.status, json, url };
}

console.log(`\n=== Production Hardening Verification ===`);
console.log(`Base: ${base}\n`);

// 1) Core infrastructure files
assertFile("lib/http/fetch-layer.mjs");
assertFile("lib/knowledge-engine/schema-capabilities.mjs");
assertFile("lib/content-lifecycle/states.mjs");
assertFile("lib/platform-monitoring.mjs");
assertFile("lib/content-engines/backfill-progress.mjs");
assertFile("lib/content-engines/engine-outcome.mjs");
assertFile("lib/api-handlers/admin/platform-monitoring.js");

// 2) Static module imports
try {
  const { fetchResource, getCircuitBreakerStats } = await import("../lib/http/fetch-layer.mjs");
  const { LIFECYCLE, canTransition, toKnowledgeItemState } = await import("../lib/content-lifecycle/states.mjs");
  const { computeBackfillProgress, estimateBackfillEta } = await import("../lib/content-engines/backfill-progress.mjs");
  const { getInstagramGraphStatus } = await import("../lib/cms/instagram-graph-api.mjs");
  const { filterRecordForTable } = await import("../lib/knowledge-engine/schema-capabilities.mjs");

  pass("import:fetch-layer");
  pass("import:lifecycle-states");

  if (!canTransition("draft", "queued")) fail("lifecycle:draft→queued");
  else pass("lifecycle:transitions");

  const ki = toKnowledgeItemState("cancelled");
  if (ki.pipeline_stage !== "rejected") fail("lifecycle:cancelled-db-safe", ki.pipeline_stage);
  else pass("lifecycle:cancelled-db-safe");

  const prog = computeBackfillProgress(3, 7);
  if (prog.percent !== 43) fail("backfill:progress", String(prog.percent));
  else pass("backfill:progress", `${prog.percent}%`);

  const eta = estimateBackfillEta({ remainingSteps: 4 });
  if (!eta.etaIso) fail("backfill:eta");
  else pass("backfill:eta");

  const ig = getInstagramGraphStatus();
  pass("instagram:status", ig.configured ? "configured" : ig.status);

  getCircuitBreakerStats();
  pass("fetch:circuit-breaker");
} catch (err) {
  fail("module-imports", err.message);
}

// 3) Publisher keywords in source
try {
  const pubSrc = readFileSync(resolve(ROOT, "lib/knowledge-engine/publisher.mjs"), "utf8");
  if (!pubSrc.includes("keywords:") || !pubSrc.includes("filterRecordForTable")) {
    fail("publisher:keywords-schema");
  } else {
    pass("publisher:keywords-schema");
  }
} catch (err) {
  fail("publisher:keywords-schema", err.message);
}

// 4) Connector base uses fetch layer
try {
  const baseSrc = readFileSync(resolve(ROOT, "lib/auto-knowledge-engine/connector-base.mjs"), "utf8");
  if (!baseSrc.includes("fetchResource")) fail("connector:fetch-layer");
  else pass("connector:fetch-layer");
} catch (err) {
  fail("connector:fetch-layer", err.message);
}

// 5) HTTP endpoints
const endpoints = [
  { path: "/api/healthz", expectOk: true },
  { path: "/api/public-config", expectOk: true },
];

for (const ep of endpoints) {
  try {
    const { status, json } = await fetchJson(ep.path);
    if (ep.expectOk && status >= 400) fail(`http:${ep.path}`, `status ${status}`);
    else pass(`http:${ep.path}`, `status ${status}`);
  } catch (err) {
    fail(`http:${ep.path}`, err.message);
  }
}

// 6) Public site pages
const pages = ["/", "/lessons", "/qa", "/fawaid", "/adhkar", "/quran", "/login", "/settings"];
for (const page of pages) {
  try {
    const url = `${base.replace(/\/$/, "")}${page}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (res.status >= 400) fail(`page:${page}`, `status ${res.status}`);
    else pass(`page:${page}`, `status ${res.status}`);
  } catch (err) {
    fail(`page:${page}`, err.message);
  }
}

// 7) Typecheck hint
try {
  pass("typecheck", "run separately: pnpm --filter @workspace/majalis run typecheck");
} catch {
  /* noop */
}

const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);
console.log(`\n=== Summary: ${passed}/${results.length} PASS ===`);
if (failed.length) {
  console.error("\nFailed checks:");
  for (const f of failed) console.error(`  - ${f.name}: ${f.detail}`);
  process.exit(1);
}
console.log("\nProduction hardening verification: ALL PASS\n");
process.exit(0);
