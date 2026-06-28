#!/usr/bin/env node
/**
 * Verify AKE backfill + incremental sync window logic and optional live pipeline run.
 *
 * Usage:
 *   node scripts/verify-ake-backfill.mjs           # unit tests + dry connector fetch
 *   node scripts/verify-ake-backfill.mjs --live    # full engine run (needs Supabase env)
 */

import {
  currentMonthKey,
  startOfCurrentMonthUtc,
  buildBackfillWindow,
  buildIncrementalWindow,
  filterItemsBySyncWindow,
  resolveConnectorImportMode,
  extractSourcePublishedAt,
} from "../lib/auto-knowledge-engine/sync-window.mjs";
import {
  resolveRunImportMode,
  shouldCompleteConnectorBackfill,
} from "../lib/auto-knowledge-engine/sync-state.mjs";
import { createConnector } from "../lib/auto-knowledge-engine/connectors/index.mjs";

const LIVE = process.argv.includes("--live");

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERT: ${msg}`);
}

function testSyncWindow() {
  const now = new Date("2026-06-15T12:00:00Z");
  const monthKey = currentMonthKey(now);
  assert(monthKey === "2026-06", "monthKey");

  const backfill = buildBackfillWindow(now);
  assert(backfill.mode === "backfill", "backfill mode");
  assert(backfill.since.getTime() === startOfCurrentMonthUtc(now).getTime(), "backfill since");

  const oldItem = { published_at: "2026-05-20T00:00:00Z", external_id: "old" };
  const newItem = { published_at: "2026-06-10T00:00:00Z", external_id: "new" };
  const undated = { external_id: "undated" };

  const filtered = filterItemsBySyncWindow([oldItem, newItem, undated], backfill);
  assert(filtered.length === 1 && filtered[0].external_id === "new", "backfill excludes old + undated");

  const incremental = buildIncrementalWindow({ sync_cursor_at: "2026-06-01T00:00:00Z" }, now);
  const incFiltered = filterItemsBySyncWindow([oldItem, newItem, undated], incremental);
  assert(incFiltered.some((i) => i.external_id === "new"), "incremental keeps new");
  assert(incFiltered.some((i) => i.external_id === "undated"), "incremental keeps undated");

  const connector = { backfill_month_key: "2026-06", backfill_completed_at: "2026-06-01" };
  assert(resolveConnectorImportMode(connector, "backfill", "2026-06") === "incremental", "done connector → incremental");
  assert(resolveConnectorImportMode({}, "backfill", "2026-06") === "backfill", "fresh connector → backfill");

  const globalState = { global_backfill_completed: true, current_month_key: "2026-06" };
  assert(resolveRunImportMode(globalState, [{ is_active: true }], {}) === "incremental", "global incremental");

  assert(shouldCompleteConnectorBackfill({ rawFetched: 0, fetched: 0 }, "backfill"), "empty backfill completes");
  assert(
    shouldCompleteConnectorBackfill({ rawFetched: 5, fetched: 3, duplicate: 1, published: 2, review: 0, rejected: 0 }, "backfill"),
    "all handled backfill completes",
  );

  const pub = extractSourcePublishedAt({ raw_payload: { pubDate: "2026-06-01" } });
  assert(pub instanceof Date && !Number.isNaN(pub.getTime()), "extract pubDate");

  return { ok: true, tests: 12 };
}

async function dryConnectorFetch() {
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

  const window = buildBackfillWindow();
  const connector = createConnector(iifaConfig);
  const result = await connector.run({
    importMode: "backfill",
    window,
    limit: 40,
    manifestLimit: 200,
  });

  return {
    fetched: result.items?.length || 0,
    rawFetched: result.rawCount || 0,
    skippedByDate: result.skippedByDate || 0,
    importMode: "backfill",
    monthKey: currentMonthKey(),
  };
}

async function liveRun() {
  const { runAutoKnowledgeEngine, getAutoKnowledgeEngineStats } = await import("../lib/auto-knowledge-engine/orchestrator.mjs");
  const engine = await runAutoKnowledgeEngine({
    triggerType: "verify",
    maxItemsPerConnector: 40,
    maxConnectors: 20,
  });
  const stats = await getAutoKnowledgeEngineStats(7);

  return {
    active_connectors: engine.connectorsTotal,
    import_mode: engine.importMode,
    items_fetched: engine.fetched,
    items_parsed: engine.parsed,
    items_enriched: engine.enriched,
    duplicates_skipped: engine.duplicate,
    quality_rejections: engine.rejected,
    review_queue: engine.review,
    successfully_published: engine.published,
    search_index_updated: engine.indexed,
    skipped_by_date: engine.skippedByDate,
    stats_snapshot: stats.stats?.backfill || null,
    ok: engine.ok,
  };
}

async function main() {
  const unit = testSyncWindow();
  const dry = await dryConnectorFetch();

  const report = {
    at: new Date().toISOString(),
    unit_tests: unit,
    dry_fetch: dry,
  };

  if (LIVE) {
    report.live = await liveRun();
  }

  console.log(JSON.stringify(report, null, 2));

  if (LIVE && !report.live?.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
