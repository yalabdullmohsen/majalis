/**
 * Backfill Engine — one sub-engine per invocation (resume via cursor).
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { currentMonthKey, currentMonthWindow } from "../sync-window.mjs";
import { startEngineRun, finishEngineRun, createRunLogger } from "../run-manager.mjs";
import { CRON_BUDGET_MS, cronMaxItems, isCronRun } from "../budget.mjs";
import { run as runLessonIntelligence } from "./lesson-intelligence.mjs";
import { run as runInstagram } from "./instagram.mjs";
import { run as runYoutube } from "./youtube.mjs";
import { run as runArticles } from "./articles.mjs";
import { run as runBenefits } from "./benefits.mjs";
import { run as runQuiz } from "./quiz.mjs";
import { run as runNotes } from "./lesson-notes.mjs";

const ENGINE_ID = "backfill";

const PIPELINE = [
  { id: "lesson-intelligence", fn: runLessonIntelligence, phase: "fetch" },
  { id: "instagram", fn: runInstagram, phase: "fetch" },
  { id: "youtube", fn: runYoutube, phase: "fetch" },
  { id: "articles", fn: runArticles, phase: "fetch" },
  { id: "benefits", fn: runBenefits, phase: "derive" },
  { id: "quiz", fn: runQuiz, phase: "derive" },
  { id: "lesson-notes", fn: runNotes, phase: "derive" },
];

async function loadBackfillState(admin, monthKey) {
  const { data } = await admin
    .from("content_engine_backfill_status")
    .select("*")
    .eq("engine_id", ENGINE_ID)
    .eq("month_key", monthKey)
    .maybeSingle();
  return data;
}

export async function run({ runType = "backfill", skipDerivation = false, budgetMs = CRON_BUDGET_MS, drain = false } = {}) {
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

  const steps = skipDerivation ? PIPELINE.filter((s) => s.phase === "fetch") : PIPELINE;

  try {
    if (!admin) throw new Error("no_admin");

    let state = await loadBackfillState(admin, monthKey);
    const report = state?.report && typeof state.report === "object" ? state.report : {};
    let cursor = Number(report.cursor || 0);

    if (state?.status === "completed" && isCronRun(runType) && !drain) {
      await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { report: { skipped: "backfill_complete", monthKey } });
      return { ok: true, engineId: ENGINE_ID, runId, stats, complete: true, monthKey };
    }

    if (!state || state.status === "pending") {
      await admin.from("content_engine_backfill_status").upsert(
        {
          engine_id: ENGINE_ID,
          month_key: monthKey,
          status: "running",
          started_at: new Date().toISOString(),
          report: { cursor: 0, window },
        },
        { onConflict: "engine_id,month_key" },
      );
      cursor = 0;
    }

    if (cursor >= steps.length) {
      await admin.from("content_engine_backfill_status").upsert(
        {
          engine_id: ENGINE_ID,
          month_key: monthKey,
          status: "completed",
          finished_at: new Date().toISOString(),
          report: { cursor, complete: true },
        },
        { onConflict: "engine_id,month_key" },
      );
      await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { report: { monthKey, complete: true } });
      return { ok: true, engineId: ENGINE_ID, runId, stats, complete: true, monthKey };
    }

    const step = steps[cursor];
    await log("fetch", "info", `Backfill step ${cursor + 1}/${steps.length}: ${step.id}`, {
      metadata: { monthKey, window },
    });

    const maxItems = cronMaxItems(runType, 15, 3);
    const result = await step.fn({
      runType: "backfill",
      maxItems,
      budgetMs,
      drain,
    });

    if (result.stats) {
      for (const k of Object.keys(stats)) {
        if (typeof result.stats[k] === "number") stats[k] += result.stats[k];
      }
    }
    if (!result.ok) stats.errors++;

    const nextCursor = cursor + 1;
    const complete = nextCursor >= steps.length;

    await admin.from("content_engine_backfill_status").upsert(
      {
        engine_id: ENGINE_ID,
        month_key: monthKey,
        status: complete ? "completed" : "running",
        items_processed: (state?.items_processed || 0) + (result.stats?.items_parsed || 0),
        items_published: (state?.items_published || 0) + (result.stats?.items_published || 0),
        finished_at: complete ? new Date().toISOString() : null,
        report: {
          cursor: nextCursor,
          lastStep: step.id,
          lastResult: { ok: result.ok, stats: result.stats },
          engines: steps.map((s) => s.id),
        },
      },
      { onConflict: "engine_id,month_key" },
    );

    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, {
      report: { monthKey, step: step.id, cursor: nextCursor, complete },
    });

    return {
      ok: true,
      engineId: ENGINE_ID,
      runId,
      stats,
      monthKey,
      step: step.id,
      cursor: nextCursor,
      complete,
      resumed: cursor > 0,
    };
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
