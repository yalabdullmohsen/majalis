#!/usr/bin/env node
/**
 * Connector health classifier unit tests.
 */
import { classifyConnectorHealth, summarizeConnectorHealth } from "../lib/auto-knowledge-engine/connector-health-classifier.mjs";

let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${msg}`);
  } else {
    fail++;
    console.error(`  ✗ ${msg}`);
  }
}

console.log("=== Connector Health Classifier ===\n");

ok(classifyConnectorHealth({ is_active: false }).state === "Disabled", "Inactive → Disabled");
ok(classifyConnectorHealth({ is_active: true, health_status: "healthy" }, { healthy: true }).state === "Healthy", "Probe healthy → Healthy");
ok(
  classifyConnectorHealth({ is_active: true, connector_type: "instagram" }, {}).state === "Credential Required",
  "Instagram without token → Credential Required",
);
ok(
  classifyConnectorHealth({ is_active: true }, { error: "Request timeout after 15000ms" }).state === "External Failure",
  "Timeout → External Failure",
);

const summary = summarizeConnectorHealth(
  [
    { slug: "a", name: "A", is_active: true, health_status: "healthy" },
    { slug: "b", name: "B", is_active: true, health_status: "healthy" },
    { slug: "c", name: "C", is_active: false },
    { slug: "d", name: "D", is_active: true, connector_type: "instagram" },
  ],
  [
    { slug: "a", healthy: true },
    { slug: "b", healthy: true },
  ],
);

ok(summary.total === 4, "Summary total = 4");
ok(summary.breakdown.Healthy === 2, "2 Healthy");
ok(summary.breakdown.Disabled === 1, "1 Disabled");
ok(summary.healthPercent === 50, "Health 50% (2/4)");
ok(summary.overallStatus === "Degraded" || summary.overallStatus === "Healthy", "Overall status computed");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
