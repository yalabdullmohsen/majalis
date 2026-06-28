/**
 * Backfill Engine — current month then incremental.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { currentMonthKey, currentMonthWindow } from "../sync-window.mjs";
import { startEngineRun, finishEngineRun, createRunLogger } from "../run-manager.mjs";
import { run as runLessonIntelligence } from "./lesson-intelligence.mjs";
import { run as runInstagram } from "./instagram.mjs";
import { run as runYoutube } from "./youtube.mjs";
import { run as runArticles } from "./articles.mjs";
import { run as runBenefits } from "./benefits.mjs";
import { run as runQuiz } from "./quiz.mjs";
import { run as runNotes } from "./lesson-notes.mjs";

const ENGINE_ID = "backfill";

const BACKFILL_ENGINES = [
  { id: "lesson-intelligence", fn: runLessonIntelligence },
  { id: "instagram", fn: runInstagram },
  { id: "youtube", fn: runYoutube },
  { id: "articles", fn: runArticles },
];

const DERIVATION_ENGINES = [
  { id: "benefits", fn: runBenefits },
  { id: "quiz", fn: runQuiz },
  { id: "lesson-notes", fn: runNotes },
];

export async function run({ runType = "backfill", skipDerivation = false } = {}) {
  const admin = getSupabaseAdmin();
  const { runId, startedAt } = await startEngineRun(ENGINE_ID, runType);
  const log = createRunLogger(runId, ENGINE_ID);
  const monthKey = currentMonthKey();
  const window = currentMonthWindow();

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

  const engineResults = [];

  try {
    if (admin) {
      await admin.from("content_engine_backfill_status").upsert(
        {
          engine_id: ENGINE_ID,
          month_key: monthKey,
          status: "running",
          started_at: new Date().toISOString(),
        },
        { onConflict: "engine_id,month_key" },
      );
    }

    await log("fetch", "info", `Backfill window: ${window.start} → ${window.end}`);

    for (const { id, fn } of BACKFILL_ENGINES) {
      await log("fetch", "info", `Backfill: ${id}`);
      const result = await fn({ runType: "backfill" });
      engineResults.push({ engineId: id, ...result });
      if (result.stats) {
        for (const k of Object.keys(stats)) {
          if (typeof result.stats[k] === "number") stats[k] += result.stats[k];
        }
      }
      if (!result.ok) stats.errors++;
    }

    if (!skipDerivation) {
      for (const { id, fn } of DERIVATION_ENGINES) {
        await log("ai_enrichment", "info", `Derivation backfill: ${id}`);
        const result = await fn({ runType: "backfill", maxItems: 15 });
        engineResults.push({ engineId: id, ...result });
        if (result.stats) {
          for (const k of Object.keys(stats)) {
            if (typeof result.stats[k] === "number") stats[k] += result.stats[k];
          }
        }
      }
    }

    if (admin) {
      await admin.from("content_engine_backfill_status").upsert(
        {
          engine_id: ENGINE_ID,
          month_key: monthKey,
          status: stats.errors > 0 && stats.items_published === 0 ? "failed" : "completed",
          items_processed: stats.items_parsed,
          items_published: stats.items_published,
          finished_at: new Date().toISOString(),
          report: { engines: engineResults.map((r) => ({ id: r.engineId, ok: r.ok, stats: r.stats })) },
        },
        { onConflict: "engine_id,month_key" },
      );
    }

    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { report: { monthKey, engines: engineResults } });
    return { ok: true, engineId: ENGINE_ID, runId, stats, monthKey, engines: engineResults };
  } catch (err) {
    stats.errors = 1;
    if (admin) {
      await admin.from("content_engine_backfill_status").upsert(
        {
          engine_id: ENGINE_ID,
          month_key: monthKey,
          status: "failed",
          error_message: err.message,
          finished_at: new Date().toISOString(),
        },
        { onConflict: "engine_id,month_key" },
      );
    }
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { errorMessage: err.message });
    return { ok: false, error: err.message, stats };
  }
}
