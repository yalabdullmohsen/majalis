/**
 * YouTube/Video Engine — metadata only, no fabricated transcripts.
 */
import { listLessonSources } from "../../cms/lesson-intelligence/sources.mjs";
import { runLessonIntelligenceEngine } from "../../cms/lesson-intelligence/index.mjs";
import { startEngineRun, finishEngineRun, createRunLogger } from "../run-manager.mjs";

const ENGINE_ID = "youtube";

export async function run({ runType = "incremental", maxSources = 5 } = {}) {
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
      (s) => s.active && ["youtube", "youtube_live", "youtube_community"].includes(s.source_type),
    );

    stats.items_fetched = sources.length;

    const aggregate = { extracted: 0, published: 0, pending: 0, duplicates: 0, errors: 0 };

    for (const source of sources.slice(0, maxSources)) {
      const result = await runLessonIntelligenceEngine({
        sourceId: source.id,
        runType: runType === "backfill" ? "manual" : "cron",
      });
      aggregate.extracted += result.extracted || 0;
      aggregate.published += result.published || 0;
      aggregate.pending += result.pending || 0;
      aggregate.duplicates += result.duplicates || 0;
      aggregate.errors += result.errors || 0;
    }

    stats.items_parsed = aggregate.extracted;
    stats.items_published = aggregate.published;
    stats.items_review = aggregate.pending;
    stats.items_duplicate = aggregate.duplicates;
    stats.items_enriched = aggregate.extracted;

    await log("ai_enrichment", "info", "YouTube: metadata only — no transcript fabrication");
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { report: aggregate });
    return { ok: true, engineId: ENGINE_ID, runId, stats, result: aggregate };
  } catch (err) {
    stats.errors = 1;
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { errorMessage: err.message });
    return { ok: false, error: err.message, stats };
  }
}
