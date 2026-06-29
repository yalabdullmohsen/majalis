#!/usr/bin/env node
/** Unit tests — GKE Phase 1 pipeline and orchestrator */
import {
  validateArchitecture,
  runPipelineDryRun,
  validatePipelineWiring,
  GKE_VERSION,
  GKE_PHASE,
  PIPELINE_FLOW,
  GKE_LAYERS,
  resetEventBus,
} from "../lib/global-knowledge-engine/index.mjs";

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

ok(GKE_VERSION === "1.0.0", "GKE_VERSION");
ok(GKE_PHASE === 1, "GKE_PHASE is 1");
ok(PIPELINE_FLOW.length === 10, "10 pipeline layers");
ok(GKE_LAYERS.length === 10, "10 layer definitions");

const wiring = await validatePipelineWiring();
ok(wiring.ok === true, "pipeline wiring valid");
ok(wiring.missing.length === 0, "no missing layers");

const arch = await validateArchitecture();
ok(arch.ok === true, "validateArchitecture ok");
ok(arch.layers.length === 10, "architecture reports 10 layers");

resetEventBus();
const dry = await runPipelineDryRun({
  title: "اختبار GKE",
  body: "نص تجريبي",
  content_kind: "lesson",
});
ok(dry.ok === true, "dry-run pipeline ok");
ok(Array.isArray(dry.stages) && dry.stages.length >= 4, "dry-run has stages");
ok(dry.mode === "dry_run", "dry-run mode flag");

console.log(`\n=== Summary: ${pass} PASS, ${fail} FAIL ===\n`);
process.exit(fail > 0 ? 1 : 0);
