#!/usr/bin/env node
/** Smoke test — GKE Phase 1 architecture wiring */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0;
let fail = 0;

function ok(c, m) {
  if (c) {
    pass++;
    console.log(`PASS  ${m}`);
  } else {
    fail++;
    console.error(`FAIL  ${m}`);
  }
}

const layers = [
  "source-registry",
  "fetch-engine",
  "parser-engine",
  "normalization-engine",
  "ai-classification-engine",
  "deduplication-engine",
  "quality-engine",
  "review-queue",
  "cms-dispatcher",
  "search-index",
];

for (const f of layers) {
  ok(
    readFileSync(resolve(root, `lib/global-knowledge-engine/layers/${f}.mjs`), "utf8").includes("getStatus"),
    `layer ${f} exports getStatus`,
  );
}

ok(readFileSync(resolve(root, "lib/global-knowledge-engine/orchestrator.mjs"), "utf8").includes("runPipelineDryRun"), "orchestrator dry-run");
ok(readFileSync(resolve(root, "lib/global-knowledge-engine/index.mjs"), "utf8").includes("getDashboard"), "public API getDashboard");
ok(readFileSync(resolve(root, "lib/api-handlers/admin/global-knowledge-engine.js"), "utf8").includes("global-knowledge-engine"), "API handler");
ok(readFileSync(resolve(root, "lib/api-dispatch.mjs"), "utf8").includes("/api/admin/global-knowledge-engine"), "API dispatch route");
ok(readFileSync(resolve(root, "src/views/admin/GlobalKnowledgeEngineSection.tsx"), "utf8").includes("GlobalKnowledgeEngineSection"), "admin UI section");
ok(readFileSync(resolve(root, "src/lib/admin-navigation.ts"), "utf8").includes("global-knowledge-engine"), "admin nav slug");
ok(readFileSync(resolve(root, "../../supabase/gke_v1.sql"), "utf8").includes("gke_pipeline_runs"), "SQL audit table");
ok(readFileSync(resolve(root, "lib/global-knowledge-engine/README.md"), "utf8").includes("Architecture First"), "architecture docs");

console.log(`\n=== Summary: ${pass} PASS, ${fail} FAIL ===\n`);
process.exit(fail > 0 ? 1 : 0);
