#!/usr/bin/env node
/**
 * verify:data-acquisition — GKE + unified platform smoke tests.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildUnifiedAutonomousPlatform } from "../lib/autonomous-platform/v3/unified-platform.mjs";
import { validatePipelineWiring } from "../lib/global-knowledge-engine/pipeline.mjs";
import { getTrustedSourcesSeed } from "../lib/global-knowledge-engine/trusted-sources/registry.mjs";
import { checkProductionReadiness } from "../lib/global-knowledge-engine/acquisition-orchestrator.mjs";
import { listSources } from "../lib/global-knowledge-engine/layers/source-registry.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const checks = [];
let passed = 0;

function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  if (ok) passed++;
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

console.log("=== verify:data-acquisition ===\n");

const wiring = await validatePipelineWiring();
check("GKE pipeline wiring", wiring.ok, `${wiring.total - (wiring.missing?.length || 0)}/${wiring.total} layers`);

const sources = getTrustedSourcesSeed();
check("Trusted sources registry", sources.length >= 10, `${sources.length} sources`);
check("No example.com fixtures", !sources.some((s) => s.source_url?.includes("example.com")));

const hasFixtures = sources.some((s) => s.source_url?.includes("example.com"));
const readiness = checkProductionReadiness(sources, { success_rate: 0, duplicate_rate: 0, total_imported: 0, total_rejected: 0 });
check("Shadow mode required", readiness.shadow_mode_required === true);
check("Production not ready (expected)", readiness.ready === false);

const listed = await listSources({ activeOnly: false });
check("Source registry list", listed.ok !== false, `${listed.data?.length ?? 0} sources`);

const dashboard = await buildUnifiedAutonomousPlatform();
check("Unified dashboard builds", Boolean(dashboard.at), `health=${dashboard.healthScore}`);
check("Health score computed", dashboard.healthScore >= 0 && dashboard.healthScore <= 100);
check("GKE section present", Boolean(dashboard.gke?.version));
check("Secrets audit", dashboard.secrets.length >= 7, `${dashboard.secrets.length} secrets checked`);
check("Alerts array", Array.isArray(dashboard.alerts));
check("GKE SQL in deploy bundle", existsSync(join(ROOT, "supabase/gke_v1.sql")) && existsSync(join(ROOT, "supabase/gke_phase2_v1.sql")));
check("Import jobs metrics", Boolean(dashboard.import_jobs));

console.log(`\n${passed}/${checks.length} passed`);
process.exit(passed === checks.length ? 0 : 1);
