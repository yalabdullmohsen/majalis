#!/usr/bin/env node
/**
 * Kuwait Instagram sources — discovery test + report.
 * Usage: node scripts/test-kuwait-instagram-sources.mjs [--all]
 */
import { discoverInstagramSource } from "../lib/cms/instagram-connector.mjs";
import { createSourceConnector } from "../lib/cms/connectors/index.mjs";
import {
  KUWAIT_INSTAGRAM_SOURCES,
  KUWAIT_INSTAGRAM_TEST_HANDLES,
  getKuwaitSourceByHandle,
} from "../lib/cms/kuwait-instagram-sources.mjs";

const runAll = process.argv.includes("--all");
const handles = runAll ? KUWAIT_INSTAGRAM_SOURCES.map((s) => s.config.handle) : KUWAIT_INSTAGRAM_TEST_HANDLES;

const report = {
  sourcesTotal: KUWAIT_INSTAGRAM_SOURCES.length,
  tested: 0,
  fetched: 0,
  connectorNeeded: 0,
  websiteFallback: 0,
  withImage: 0,
  errors: 0,
  needsGraphApi: [],
  results: [],
};

console.log("═".repeat(60));
console.log("Kuwait Instagram Sources — Discovery Test");
console.log(`Total seed sources: ${report.sourcesTotal} | Testing: ${handles.length}`);
console.log("═".repeat(60));

for (const handle of handles) {
  const source = getKuwaitSourceByHandle(handle);
  if (!source) continue;
  report.tested += 1;

  const row = {
    handle,
    name: source.name,
    trust: source.trust_level,
    status: "unknown",
    title: "",
    image: false,
    websiteFallback: false,
    hint: "",
  };

  try {
    const connector = createSourceConnector(source);
    const viaPlugin = await connector.discover();
    const legacy = await discoverInstagramSource(source);
    const result = viaPlugin.items?.length ? viaPlugin : legacy;
    const item = result.items?.[0];
    const needsConnector = Boolean(
      result.connectorRequired || result.connectorHint || item?.connectorPending,
    );

    row.title = (item?.title || "").slice(0, 60);
    row.image = Boolean(item?.imageUrl);
    row.websiteFallback = Boolean(item?.fromWebsite);

    if (needsConnector) {
      row.status = "CONNECTOR_NEEDED";
      report.connectorNeeded += 1;
      report.needsGraphApi.push(handle);
      row.hint = (result.hint || result.connectorHint || "").slice(0, 100);
    } else {
      row.status = "OK";
      report.fetched += 1;
    }
    if (row.image) report.withImage += 1;
    if (row.websiteFallback) report.websiteFallback += 1;
  } catch (err) {
    row.status = "ERROR";
    row.hint = String(err.message || err).slice(0, 80);
    report.errors += 1;
  }

  report.results.push(row);
  console.log(
    `${row.status.padEnd(16)} | @${handle.padEnd(22)} | img:${row.image ? "yes" : "no "} | ${row.title || source.name}`,
  );
  if (row.hint && row.status !== "OK") console.log(`  └─ ${row.hint}`);
}

console.log("\n" + "─".repeat(60));
console.log("SUMMARY");
console.log("─".repeat(60));
console.log(`Sources in seed:        ${report.sourcesTotal}`);
console.log(`Tested this run:        ${report.tested}`);
console.log(`Fetched (OK):           ${report.fetched}`);
console.log(`Connector needed:       ${report.connectorNeeded}`);
console.log(`Website fallback used:  ${report.websiteFallback}`);
console.log(`With poster image:      ${report.withImage}`);
console.log(`Errors:                 ${report.errors}`);
console.log(`Need Instagram Graph:   ${report.needsGraphApi.join(", ") || "none"}`);
console.log("\nAuto-publish rules: active + trusted/official + confidence≥95% + full fields");
console.log("When Instagram blocks: sources stay in DB → pending_review drafts (no crash)");
console.log("Admin: /admin/sources | Monitor: /api/cron/lesson-source-monitor");
console.log("Apply SQL: kuwait_instagram_sources_v1.sql + v2.sql in Supabase");

process.exit(report.errors > 0 ? 1 : 0);
