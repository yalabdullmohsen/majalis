#!/usr/bin/env node
/** GKE Phase 2 — trusted sources, reputation, shadow mode */
import {
  GKE_PHASE,
  GKE_SHADOW_MODE,
  getTrustedSourcesSeed,
  computeReputation,
  canAutoPublish,
  isShadowMode,
  processShadowItem,
  listSources,
  checkProductionReadiness,
} from "../lib/global-knowledge-engine/index.mjs";
import { syncSourcesToDatabase } from "../lib/global-knowledge-engine/layers/source-registry.mjs";
import { runShadowAcquisitionForSource } from "../lib/global-knowledge-engine/acquisition-orchestrator.mjs";

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

ok(GKE_PHASE === 2, "GKE_PHASE is 2");
ok(GKE_SHADOW_MODE === true, "Shadow mode enabled");
ok(isShadowMode() === true, "isShadowMode() true");

const seed = getTrustedSourcesSeed();
ok(seed.length >= 8, "trusted sources seed count");
ok(!seed.some((s) => s.source_url?.includes("example.com")), "no example.com in seed");

const rep = computeReputation({ trust_score: 90, items_imported: 100, items_accepted: 90, items_duplicate: 2 });
ok(rep >= 90, "reputation computation");

ok(canAutoPublish({ trust_score: 95, publish_policy: "shadow" }) === false, "shadow blocks auto-publish");

const { data } = await listSources();
ok(data.length >= seed.length, "listSources returns merged registry");

const shadow = await processShadowItem(
  { external_key: "test:shadow:1", title: "اختبار", body: "نص", content_kind: "lesson", source_id: "test" },
  { source_id: "kuwait-mosques-lessons" },
);
ok(shadow.mode === "shadow" && shadow.published === false, "shadow item not published");

const sync = await runShadowAcquisitionForSource("kuwait-mosques-lessons");
ok(sync.ok === true && sync.mode === "shadow", "shadow acquisition for lessons source");

const readiness = checkProductionReadiness(data, {
  total_imported: 10,
  total_accepted: 8,
  total_rejected: 1,
  total_duplicate: 1,
  success_rate: 80,
  duplicate_rate: 10,
});
ok(readiness.ready === false, "production not ready until shadow testing complete");
ok(readiness.shadow_mode_required === true, "shadow required flag");

console.log(`\n=== Summary: ${pass} PASS, ${fail} FAIL ===\n`);
process.exit(fail > 0 ? 1 : 0);
