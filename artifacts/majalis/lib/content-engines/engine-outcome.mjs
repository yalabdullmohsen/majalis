/**
 * Standardized content engine outcome logging — distinguishes no_content from errors.
 */

import { createRunLogger } from "./run-manager.mjs";

export const OUTCOME = {
  NO_CONTENT: "no_content",
  NO_SOURCES: "no_sources",
  NOT_CONFIGURED: "not_configured",
  PUBLISHED: "published",
  REVIEW: "review",
  DUPLICATE: "duplicate",
  REJECTED: "rejected",
  ERROR: "error",
};

/**
 * @param {object} params
 * @param {string} params.engineId
 * @param {string} params.runId
 * @param {string} params.outcome
 * @param {string} [params.message]
 * @param {object} [params.metadata]
 * @param {object} [params.stats]
 */
export async function logEngineOutcome({ engineId, runId, outcome, message, metadata, stats }) {
  const log = createRunLogger(runId, engineId);
  const level = outcome === OUTCOME.ERROR ? "error" : outcome === OUTCOME.NO_CONTENT || outcome === OUTCOME.NO_SOURCES ? "info" : "info";
  await log("outcome", level, message || outcome, {
    metadata: { outcome, ...(metadata || {}) },
  });

  return {
    ok: outcome !== OUTCOME.ERROR,
    outcome,
    noContent: outcome === OUTCOME.NO_CONTENT || outcome === OUTCOME.NO_SOURCES,
    notConfigured: outcome === OUTCOME.NOT_CONFIGURED,
    stats: stats || {},
    message: message || outcome,
  };
}

export function finalizeEngineStats(stats, { published = 0, parsed = 0, fetched = 0, errors = 0 } = {}) {
  return {
    items_fetched: (stats.items_fetched || 0) + fetched,
    items_parsed: (stats.items_parsed || 0) + parsed,
    items_enriched: stats.items_enriched || 0,
    items_duplicate: stats.items_duplicate || 0,
    items_rejected: stats.items_rejected || 0,
    items_review: stats.items_review || 0,
    items_published: (stats.items_published || 0) + published,
    errors: (stats.errors || 0) + errors,
  };
}
