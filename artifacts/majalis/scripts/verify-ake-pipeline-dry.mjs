#!/usr/bin/env node
import { createConnector } from "../lib/auto-knowledge-engine/connectors/index.mjs";
import { verifyBatch } from "../lib/auto-knowledge-engine/verification.mjs";
import { analyzeBatch } from "../lib/knowledge-engine/ai-analyzer.mjs";
import { runQualityGate } from "../lib/auto-knowledge-engine/quality-gate.mjs";
import { resolveDataFilePath } from "../lib/data-paths.mjs";
import { existsSync } from "node:fs";

const iifaConfig = {
  slug: "iifa-oic",
  name: "IIFA OIC",
  connector_type: "manifest",
  official_url: "https://www.iifa-aifi.org",
  trust_level: 5,
  auto_publish: true,
  allowed_kinds: ["fiqh_decision"],
  api_config: { manifest_file: "fiqh-official-manifest.json" },
};

async function main() {
  const manifestPath = resolveDataFilePath("fiqh-official-manifest.json");
  console.log(JSON.stringify({
    manifestPath,
    manifestExists: existsSync(manifestPath),
  }));

  const connector = createConnector(iifaConfig);
  const fetchResult = await connector.run();
  const fetched = fetchResult.items?.length || 0;

  const verified = await verifyBatch(fetchResult.items || [], iifaConfig, []);
  const toAnalyze = verified.filter((v) => !v.verification.isDuplicate);
  const parsed = toAnalyze.filter((v) => v.verification.sourceVerified).length;
  const duplicate = verified.length - toAnalyze.length;

  const analyzed = await analyzeBatch(toAnalyze.slice(0, 1), 1);
  const item = analyzed[0];
  const gate = runQualityGate(item, item.analysis, item.verification, iifaConfig);

  console.log(JSON.stringify({
    fetched,
    parsed,
    duplicate,
    sampleKind: item?.content_kind,
    gatePassed: gate.passed,
    autoPublish: gate.autoPublish,
    failedChecks: gate.failedChecks,
  }, null, 2));

  if (!gate.autoPublish || !gate.canPublish) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
