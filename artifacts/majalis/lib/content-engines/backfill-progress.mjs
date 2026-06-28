/**
 * Backfill progress helpers — resume, ETA, pause/resume control.
 */

export function computeBackfillProgress(cursor, totalSteps) {
  const total = Math.max(1, totalSteps || 1);
  const current = Math.min(Math.max(0, cursor || 0), total);
  const percent = Math.round((current / total) * 100);
  const remaining = Math.max(0, total - current);
  return { cursor: current, totalSteps: total, percent, remainingSteps: remaining };
}

export function estimateBackfillEta({ remainingSteps, avgStepMs = 45_000 }) {
  if (!remainingSteps) return { etaMs: 0, etaIso: new Date().toISOString() };
  const etaMs = remainingSteps * avgStepMs;
  return { etaMs, etaIso: new Date(Date.now() + etaMs).toISOString() };
}

export function isBackfillPaused(report) {
  return report?.paused === true;
}

export function buildBackfillStatus({ monthKey, cursor, steps, state, report }) {
  const progress = computeBackfillProgress(cursor, steps.length);
  const eta = estimateBackfillEta({ remainingSteps: progress.remainingSteps });
  return {
    monthKey,
    status: state?.status || "pending",
    paused: isBackfillPaused(report),
    progress,
    eta,
    currentStep: steps[cursor] || null,
    nextStep: steps[cursor] || null,
    completedSteps: steps.slice(0, cursor).map((s) => s.id),
    remainingSteps: steps.slice(cursor).map((s) => s.id),
    engines: steps.map((s) => s.id),
    lastStep: report?.lastStep || null,
    itemsProcessed: state?.items_processed || 0,
    itemsPublished: state?.items_published || 0,
    errorMessage: state?.error_message || null,
    startedAt: state?.started_at || null,
    finishedAt: state?.finished_at || null,
  };
}
