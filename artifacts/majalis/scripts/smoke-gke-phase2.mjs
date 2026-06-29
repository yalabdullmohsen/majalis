#!/usr/bin/env node
/** Smoke — GKE Phase 2 data acquisition wiring */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getTrustedSourcesSeed } from "../lib/global-knowledge-engine/trusted-sources/registry.mjs";

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

const registry = readFileSync(resolve(root, "lib/global-knowledge-engine/trusted-sources/registry.mjs"), "utf8");
const reputation = readFileSync(resolve(root, "lib/global-knowledge-engine/reputation-engine.mjs"), "utf8");
const shadow = readFileSync(resolve(root, "lib/global-knowledge-engine/shadow-mode.mjs"), "utf8");
const acquisition = readFileSync(resolve(root, "lib/global-knowledge-engine/acquisition-orchestrator.mjs"), "utf8");
const sourceLayer = readFileSync(resolve(root, "lib/global-knowledge-engine/layers/source-registry.mjs"), "utf8");
const config = readFileSync(resolve(root, "lib/global-knowledge-engine/config.mjs"), "utf8");
const api = readFileSync(resolve(root, "lib/api-handlers/admin/global-knowledge-engine.js"), "utf8");
const dash = readFileSync(resolve(root, "src/views/admin/DataAcquisitionDashboardPage.tsx"), "utf8");
const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
const sql = readFileSync(resolve(root, "../../supabase/gke_phase2_v1.sql"), "utf8");
const fatwaSeed = readFileSync(resolve(root, "src/lib/fatwa-seed.ts"), "utf8");

ok(registry.includes("GKE_TRUSTED_SOURCES"), "trusted sources registry");
ok(getTrustedSourcesSeed().every((s) => !s.source_url?.includes("example.com")), "registry seed URLs clean");
ok(reputation.includes("computeReputation"), "reputation engine");
ok(shadow.includes("GKE_SHADOW_MODE"), "shadow mode module");
ok(acquisition.includes("getAcquisitionDashboard"), "acquisition orchestrator");
ok(sourceLayer.includes("syncSourcesToDatabase"), "source registry Phase 2");
ok(config.includes("GKE_SHADOW_MODE = true"), "shadow mode config");
ok(config.includes("GKE_INTEGRATION_PHASES"), "integration phases");
ok(api.includes("action === \"acquisition\""), "acquisition API action");
ok(dash.includes("DataAcquisitionDashboardPage"), "dashboard page");
ok(app.includes("/admin/data-acquisition"), "App route");
ok(sql.includes("gke_trusted_sources"), "SQL trusted sources table");
ok(sql.includes("gke_shadow_items"), "SQL shadow items");
ok(!fatwaSeed.includes("example.com"), "fatwa seed cleaned");

console.log(`\n=== Summary: ${pass} PASS, ${fail} FAIL ===\n`);
process.exit(fail > 0 ? 1 : 0);
