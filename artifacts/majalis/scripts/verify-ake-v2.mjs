#!/usr/bin/env node
/**
 * Verify AKE v2 multi-source engine (unit tests).
 */
import { createConnector } from "../lib/auto-knowledge-engine/connectors/index.mjs";
import { computeUnifiedFingerprint } from "../lib/auto-knowledge-engine/v2/unified-dedup.mjs";
import { detectLifecycleChange } from "../lib/auto-knowledge-engine/v2/content-lifecycle.mjs";
import { isCircuitOpen, recordCircuitSuccess, recordCircuitFailure } from "../lib/auto-knowledge-engine/v2/parallel-runner.mjs";
import { CONTENT_CATEGORIES, PIPELINE_STAGES_V2 } from "../lib/auto-knowledge-engine/v2/plugin-registry.mjs";
import { DEFAULT_POLL_INTERVALS } from "../lib/auto-knowledge-engine/connector-scheduler.mjs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(PIPELINE_STAGES_V2.length === 10, "pipeline stages");
assert(CONTENT_CATEGORIES.includes("تفسير"), "categories");
assert(DEFAULT_POLL_INTERVALS.instagram === 15, "instagram 15min");
assert(DEFAULT_POLL_INTERVALS.default === 15, "default 15min");

const ig = createConnector({
  slug: "test-ig",
  name: "Test",
  connector_type: "instagram",
  official_url: "https://instagram.com/test",
  api_config: { handle: "test" },
});
assert(ig.connectorType === "instagram", "instagram connector");

const web = createConnector({
  slug: "test-web",
  name: "Test Web",
  connector_type: "website",
  official_url: "https://example.com",
});
assert(web.connectorType === "website", "website connector");

const fp1 = computeUnifiedFingerprint({
  raw_title: "درس في التفسير",
  raw_body: "محتوى الدرس",
  extracted_fields: { speaker_name: "فلان", mosque: "مسجد X", gregorian_date: "2026-06-15" },
});
const fp2 = computeUnifiedFingerprint({
  raw_title: "درس في التفسير",
  raw_body: "محتوى الدرس",
  extracted_fields: { speaker_name: "فلان", mosque: "مسجد X", gregorian_date: "2026-06-15" },
});
assert(fp1 === fp2, "same fingerprint cross-source");

const cancel = detectLifecycleChange(null, { raw_title: "إلغاء الدرس", raw_body: "أُلغي الدرس" }, {});
assert(cancel?.changeType === "cancelled", "cancel detection");

recordCircuitFailure("test-slug");
recordCircuitFailure("test-slug");
recordCircuitFailure("test-slug");
assert(isCircuitOpen("test-slug"), "circuit opens");
recordCircuitSuccess("test-slug");
assert(!isCircuitOpen("test-slug"), "circuit closes");

console.log(JSON.stringify({ ok: true, tests: 12, version: "ake-v2.0" }, null, 2));
