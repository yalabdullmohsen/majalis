/**
 * Instagram Content Engine — approved Instagram sources via lesson intelligence.
 */
import { listLessonSources } from "../../cms/lesson-intelligence/sources.mjs";
import { runLessonIntelligenceEngine } from "../../cms/lesson-intelligence/index.mjs";
import { startEngineRun, finishEngineRun, createRunLogger } from "../run-manager.mjs";

const ENGINE_ID = "instagram";

export async function run({ runType = "incremental" } = {}) {
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
    errors: 0,
  };

  try {
    const sources = (await listLessonSources()).filter(
      (s) => s.active && (s.source_type === "instagram" || s.platform === "instagram"),
    );

    stats.items_fetched = sources.length;
    await log("fetch", "info", `Instagram sources: ${sources.length}`);

    if (!sources.length) {
      await finishEngineRun(runId, ENGINE_ID, stats, startedAt, {
        report: { message: "no_active_instagram_sources" },
      });
      return { ok: true, engineId: ENGINE_ID, runId, stats, message: "no_active_instagram_sources" };
    }

    const aggregate = { discovered: 0, extracted: 0, published: 0, duplicates: 0, pending: 0, errors: 0 };

    for (const source of sources.slice(0, 10)) {
      const result = await runLessonIntelligenceEngine({
        sourceId: source.id,
        runType: runType === "backfill" ? "manual" : "cron",
      });
      aggregate.discovered += result.discovered || 0;
      aggregate.extracted += result.extracted || 0;
      aggregate.published += result.published || 0;
      aggregate.duplicates += result.duplicates || 0;
      aggregate.pending += result.pending || 0;
      aggregate.errors += result.errors || 0;
    }

    stats.items_parsed = aggregate.extracted;
    stats.items_enriched = aggregate.extracted;
    stats.items_duplicate = aggregate.duplicates;
    stats.items_review = aggregate.pending;
    stats.items_published = aggregate.published;
    stats.errors = aggregate.errors;

    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { report: aggregate });
    return { ok: true, engineId: ENGINE_ID, runId, stats, result: aggregate };
  } catch (err) {
    stats.errors = 1;
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { errorMessage: err.message });
    return { ok: false, error: err.message, stats };
  }
}
