/**
 * GKE Reputation Engine — adjusts source trust based on outcomes.
 */
import { GKE_SHADOW_MODE, GKE_AUTO_PUBLISH_MIN_REPUTATION } from "./config.mjs";

const REASON_WEIGHTS = {
  accurate_data: 2,
  no_duplicates: 1,
  no_errors: 1,
  timely_updates: 1,
  high_errors: -5,
  duplicate_spike: -4,
  stale_updates: -3,
  needs_correction: -2,
};

/**
 * Compute reputation from signals (0–100).
 * @param {{ trust_score?: number, reputation_score?: number, items_imported?: number, items_accepted?: number, items_rejected?: number, items_duplicate?: number, last_sync_at?: string }} source
 */
export function computeReputation(source) {
  let score = source.reputation_score ?? source.trust_score ?? 70;
  const imported = source.items_imported || 0;
  const accepted = source.items_accepted || 0;
  const rejected = source.items_rejected || 0;
  const dupes = source.items_duplicate || 0;

  if (imported > 0) {
    const acceptRate = accepted / imported;
    const dupeRate = dupes / imported;
    const rejectRate = rejected / imported;
    if (acceptRate >= 0.85) score += REASON_WEIGHTS.accurate_data;
    if (dupeRate <= 0.05) score += REASON_WEIGHTS.no_duplicates;
    if (rejectRate <= 0.1) score += REASON_WEIGHTS.no_errors;
    if (dupeRate >= 0.25) score += REASON_WEIGHTS.duplicate_spike;
    if (rejectRate >= 0.4) score += REASON_WEIGHTS.high_errors;
  }

  if (source.last_sync_at) {
    const daysSince = (Date.now() - new Date(source.last_sync_at).getTime()) / 86400000;
    const expectedDays = 7;
    if (daysSince <= expectedDays) score += REASON_WEIGHTS.timely_updates;
    else if (daysSince > expectedDays * 3) score += REASON_WEIGHTS.stale_updates;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Record outcome and return new reputation.
 */
export function applyReputationDelta(currentScore, reason) {
  const delta = REASON_WEIGHTS[reason] ?? 0;
  const newScore = Math.max(0, Math.min(100, currentScore + delta));
  return { previous_score: currentScore, new_score: newScore, delta, reason };
}

/** Whether auto-publish is allowed (disabled in shadow mode). */
export function canAutoPublish(source) {
  if (GKE_SHADOW_MODE) return false;
  if (source.publish_policy === "shadow") return false;
  if (source.publish_policy === "review") return false;
  const rep = source.reputation_score ?? source.trust_score ?? 0;
  return rep >= GKE_AUTO_PUBLISH_MIN_REPUTATION;
}

export function rankSourcesByReputation(sources) {
  return [...sources].sort(
    (a, b) =>
      (b.reputation_score ?? b.trust_score ?? 0) - (a.reputation_score ?? a.trust_score ?? 0),
  );
}

export function getWorstSources(sources, limit = 5) {
  return rankSourcesByReputation(sources).slice(-limit).reverse();
}

export function getBestSources(sources, limit = 5) {
  return rankSourcesByReputation(sources).slice(0, limit);
}

export function getMostActiveSources(sources, limit = 5) {
  return [...sources]
    .sort((a, b) => (b.items_imported || 0) - (a.items_imported || 0))
    .slice(0, limit);
}
