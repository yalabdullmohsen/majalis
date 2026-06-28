/**
 * Phase 7 — Content Engines Orchestrator
 */
import { ENGINE_IDS, getEngine } from "./registry.mjs";
import { isEngineEnabled } from "./run-manager.mjs";
import { getContentEngineStats, getVerificationReport } from "./stats.mjs";
import { listPendingReviews } from "./review-queue.mjs";

import { run as runLessonIntelligence } from "./engines/lesson-intelligence.mjs";
import { run as runBenefits } from "./engines/benefits.mjs";
import { run as runQuiz } from "./engines/quiz.mjs";
import { run as runLessonNotes } from "./engines/lesson-notes.mjs";
import { run as runSheikhEnrichment } from "./engines/sheikh-enrichment.mjs";
import { run as runInstagram } from "./engines/instagram.mjs";
import { run as runYoutube } from "./engines/youtube.mjs";
import { run as runArticles } from "./engines/articles.mjs";
import { run as runReviewQueue } from "./engines/review-queue.mjs";
import { run as runRecommendations } from "./engines/recommendations.mjs";
import { run as runNotifications } from "./engines/notifications.mjs";
import { run as runBackfill } from "./engines/backfill.mjs";

const RUNNERS = {
  "lesson-intelligence": runLessonIntelligence,
  benefits: runBenefits,
  quiz: runQuiz,
  "lesson-notes": runLessonNotes,
  "sheikh-enrichment": runSheikhEnrichment,
  instagram: runInstagram,
  youtube: runYoutube,
  articles: runArticles,
  "review-queue": runReviewQueue,
  recommendations: runRecommendations,
  notifications: runNotifications,
  backfill: runBackfill,
};

/** Default cron order: fetch sources first, derive content, then link/notify */
export const CRON_ORDER = [
  "lesson-intelligence",
  "instagram",
  "youtube",
  "articles",
  "benefits",
  "quiz",
  "lesson-notes",
  "sheikh-enrichment",
  "recommendations",
  "notifications",
  "review-queue",
];

export async function runContentEngine(engineId, options = {}) {
  const runner = RUNNERS[engineId];
  if (!runner) return { ok: false, error: `unknown_engine: ${engineId}` };

  const enabled = await isEngineEnabled(engineId);
  if (!enabled && !options.force) {
    return { ok: false, error: "engine_disabled", engineId };
  }

  return runner(options);
}

export async function runAllContentEngines(options = {}) {
  const engineIds = options.engineIds || CRON_ORDER;
  const results = [];
  const aggregate = {
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

  for (const engineId of engineIds) {
    if (options.skip?.includes(engineId)) continue;
    try {
      const result = await runContentEngine(engineId, {
        runType: options.runType || "cron",
        ...options.engineOptions?.[engineId],
      });
      results.push(result);
      if (result.stats) {
        for (const k of Object.keys(aggregate)) {
          if (typeof result.stats[k] === "number") aggregate[k] += result.stats[k];
        }
      }
      if (!result.ok) aggregate.errors++;
    } catch (err) {
      aggregate.errors++;
      results.push({ ok: false, engineId, error: err.message });
    }
  }

  return {
    ok: aggregate.errors === 0 || aggregate.items_published > 0,
    at: new Date().toISOString(),
    engines: results,
    aggregate,
  };
}

export async function runBackfillCurrentMonth(options = {}) {
  return runContentEngine("backfill", { runType: "backfill", ...options });
}

export async function retryFailedEngines(options = {}) {
  const stats = await getContentEngineStats(1);
  const failed = (stats.recent_runs || []).filter((r) => r.status === "failed" || r.status === "partial");
  const engineIds = [...new Set(failed.map((r) => r.engine_id))];
  if (!engineIds.length) return { ok: true, message: "no_failed_runs", engines: [] };
  return runAllContentEngines({ engineIds, runType: "retry", force: true, ...options });
}

export {
  getContentEngineStats,
  getVerificationReport,
  listPendingReviews,
  ENGINE_IDS,
  getEngine,
  RUNNERS,
};
