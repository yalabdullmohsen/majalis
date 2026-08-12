#!/usr/bin/env node
/**
 * Kuwait Instagram sources — discovery test (Phase 7: Graph API or Manual Assist).
 */
import { discoverInstagramSource, getInstagramGraphStatus } from "../lib/cms/instagram-connector.mjs";
import {
  KUWAIT_INSTAGRAM_SOURCES,
  KUWAIT_INSTAGRAM_TEST_HANDLES,
  getKuwaitSourceByHandle,
} from "../lib/cms/kuwait-instagram-sources.mjs";

const runAll = process.argv.includes("--all");
const useMock = process.argv.includes("--mock-graph");
const handles = runAll ? KUWAIT_INSTAGRAM_SOURCES.map((s) => s.config.handle) : KUWAIT_INSTAGRAM_TEST_HANDLES;

if (useMock) {
  process.env.INSTAGRAM_GRAPH_MOCK = "1";
  process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN = "mock";
  process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = "mock";
}

const graphStatus = getInstagramGraphStatus();
const report = {
  graphConfigured: graphStatus.configured || useMock,
  manualAssistMode: !graphStatus.configured && !useMock,
  tested: 0,
  withPosts: 0,
  manualAssist: 0,
  needsGraphApi: [],
};

console.log("═".repeat(60));
console.log("Kuwait Instagram — Phase 7 Discovery");
console.log(`Graph API: ${report.graphConfigured ? "configured" : "NOT configured → Manual Assist"}`);
console.log("═".repeat(60));

for (const handle of handles) {
  const source = { ...getKuwaitSourceByHandle(handle), id: `test-${handle}` };
  if (!source.config) continue;
  report.tested += 1;

  const result = await discoverInstagramSource(source);
  const item = result.items?.[0];
  const hasPosts = (result.items?.length || 0) > 0;
  const status = result.manualAssistMode
    ? "MANUAL_ASSIST"
    : hasPosts
      ? "POSTS_OK"
      : "NO_POSTS";

  if (hasPosts) report.withPosts += 1;
  if (result.manualAssistMode) {
    report.manualAssist += 1;
    report.needsGraphApi.push(handle);
  }

  console.log(
    `${status.padEnd(14)} | @${handle.padEnd(22)} | posts:${result.items?.length || 0} | img:${item?.imageUrl ? "yes" : "no "}`,
  );
}

console.log("\n" + "─".repeat(60));
console.log(`Tested: ${report.tested} | With posts: ${report.withPosts} | Manual Assist: ${report.manualAssist}`);
console.log("Manual Assist: /admin/sources → رفع إعلان | Graph API: /admin/integrations/instagram");
console.log("Mock test: node scripts/test-kuwait-instagram-sources.mjs --mock-graph");
