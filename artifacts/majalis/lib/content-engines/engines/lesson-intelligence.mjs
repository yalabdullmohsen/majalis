/**
 * Lesson Intelligence Engine — delegates to Phase 6 engine.
 */
import { runLessonIntelligenceEngine } from "../../cms/lesson-intelligence/index.mjs";
import { startEngineRun, finishEngineRun, createRunLogger } from "../run-manager.mjs";

export async function run({ runType = "incremental", maxSources } = {}) {
  const { runId, startedAt } = await startEngineRun("lesson-intelligence", runType);
  const log = createRunLogger(runId, "lesson-intelligence");
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
    await log("fetch", "info", "Starting lesson intelligence scan");
    const result = await runLessonIntelligenceEngine({
      triggerType: runType === "manual" ? "manual" : "cron",
      maxSources: maxSources || undefined,
    });

    stats.items_fetched = result.discovered || result.itemsDiscovered || 0;
    stats.items_parsed = result.extracted || result.itemsExtracted || 0;
    stats.items_enriched = stats.items_parsed;
    stats.items_duplicate = result.duplicates || result.itemsDuplicate || 0;
    stats.items_review = result.pending || result.itemsPending || 0;
    stats.items_published = result.published || result.itemsPublished || 0;
    stats.errors = result.errors || result.itemsErrors || 0;

    await finishEngineRun(runId, "lesson-intelligence", stats, startedAt, { report: result });
    return { ok: true, engineId: "lesson-intelligence", runId, stats, result };
  } catch (err) {
    stats.errors = 1;
    await finishEngineRun(runId, "lesson-intelligence", stats, startedAt, { errorMessage: err.message });
    return { ok: false, engineId: "lesson-intelligence", error: err.message, stats };
  }
}
