/**
 * Article Engine — RSS/websites via AKE + auto-content.
 */
import { runAutoKnowledgeEngine } from "../../auto-knowledge-sync.mjs";
import { runAutoContentSync } from "../../auto-content/auto-content-sync.mjs";
import { startEngineRun, finishEngineRun, createRunLogger } from "../run-manager.mjs";

const ENGINE_ID = "articles";

export async function run({ runType = "incremental", maxItems = 20 } = {}) {
  const { runId, startedAt } = await startEngineRun(ENGINE_ID, runType);
  const log = createRunLogger(runId, ENGINE_ID);
  const stats = {
    items_fetched: 0,
    items_parsed: 0,
    items_enriched: 0,
    items_duplicate: 0,
    items_rejected: 0,
    items_review: 0,
    items_published: 0,
    items_indexed: 0,
    errors: 0,
  };

  try {
    await log("fetch", "info", "Running AKE RSS/article connectors");

    const akeResult = await runAutoKnowledgeEngine({
      triggerType: runType === "manual" ? "manual" : "cron",
      importMode: runType === "backfill" ? "backfill" : "auto",
      maxItemsPerConnector: maxItems,
      maxConnectors: 8,
    });

    const akeStats = akeResult.stats || akeResult;
    stats.items_fetched += akeResult.connectorsChecked || akeStats.connectors_checked || 0;
    stats.items_parsed += akeResult.itemsProcessed || akeStats.items_processed || 0;
    stats.items_published += akeResult.itemsPublished || akeStats.items_published || 0;
    stats.items_review += akeResult.itemsReview || akeStats.items_review || 0;
    stats.items_duplicate += akeResult.itemsDuplicate || akeStats.items_duplicate || 0;
    stats.items_rejected += akeResult.itemsRejected || akeStats.items_rejected || 0;
    stats.items_enriched = stats.items_parsed;

    await log("fetch", "info", "Running auto-content RSS sync");
    const autoContent = await runAutoContentSync({ triggerType: "cron", skipSchemaCheck: true });
    stats.items_parsed += autoContent.imported || autoContent.processed || 0;
    stats.items_published += autoContent.published || 0;

    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, {
      report: { ake: akeResult, autoContent },
    });
    return { ok: true, engineId: ENGINE_ID, runId, stats };
  } catch (err) {
    stats.errors = 1;
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { errorMessage: err.message });
    return { ok: false, error: err.message, stats };
  }
}
