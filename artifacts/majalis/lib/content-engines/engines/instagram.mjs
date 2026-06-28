/**
 * Instagram Content Engine — one source per cron tick (resume cursor).
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { listLessonSources } from "../../cms/lesson-intelligence/sources.mjs";
import { runLessonIntelligenceEngine } from "../../cms/lesson-intelligence/index.mjs";
import { startEngineRun, finishEngineRun, createRunLogger } from "../run-manager.mjs";
import { CRON_BUDGET_MS, cronMaxItems, isCronRun, budgetExceeded } from "../budget.mjs";
import { getEngineCursor, saveEngineCursor } from "../work-queue.mjs";
import { getInstagramGraphStatus } from "../../cms/instagram-graph-api.mjs";

const ENGINE_ID = "instagram";

export async function run({ runType = "incremental", budgetMs = CRON_BUDGET_MS, maxSources } = {}) {
  const admin = getSupabaseAdmin();
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
      const igStatus = getInstagramGraphStatus();
      await finishEngineRun(runId, ENGINE_ID, stats, startedAt, {
        report: {
          outcome: igStatus.configured ? "no_sources" : "not_configured",
          instagram: igStatus,
        },
      });
      return {
        ok: true,
        engineId: ENGINE_ID,
        runId,
        stats,
        outcome: igStatus.configured ? "no_sources" : "not_configured",
        message: igStatus.configured ? "no_active_instagram_sources" : igStatus.status,
        instagram: igStatus,
      };
    }

    const perTick = maxSources ?? cronMaxItems(runType, 10, 1);
    let startIdx = 0;
    if (isCronRun(runType) && admin) {
      startIdx = await getEngineCursor(admin, ENGINE_ID, "sourceCursor");
    }

    const aggregate = { discovered: 0, extracted: 0, published: 0, duplicates: 0, pending: 0, errors: 0 };
    const batch = [];
    for (let i = 0; i < perTick; i++) {
      if (budgetExceeded(startedAt, budgetMs)) break;
      const idx = (startIdx + i) % sources.length;
      batch.push(sources[idx]);
    }

    for (const source of batch) {
      if (budgetExceeded(startedAt, budgetMs)) break;
      try {
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
      } catch (err) {
        aggregate.errors++;
        await log("fetch", "warn", `Instagram source failed: ${source.id}`, {
          metadata: { error: err.message, source: source.name },
        });
      }
    }

    if (isCronRun(runType) && admin && batch.length) {
      await saveEngineCursor(admin, ENGINE_ID, (startIdx + batch.length) % sources.length, "sourceCursor");
    }

    stats.items_parsed = aggregate.extracted;
    stats.items_enriched = aggregate.extracted;
    stats.items_duplicate = aggregate.duplicates;
    stats.items_review = aggregate.pending;
    stats.items_published = aggregate.published;
    stats.errors = aggregate.errors;

    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, {
      report: { ...aggregate, sourcesProcessed: batch.map((s) => s.id), cursor: startIdx },
    });
    return { ok: true, engineId: ENGINE_ID, runId, stats, result: aggregate, resumed: isCronRun(runType) };
  } catch (err) {
    stats.errors = 1;
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { errorMessage: err.message });
    return { ok: false, error: err.message, stats };
  }
}
