/**
 * Time-budget helpers for content engines — stay under Vercel 55s cron limit.
 */

export const CRON_BUDGET_MS = 48_000;
export const DRAIN_BUDGET_MS = 50_000;
export const STALE_RUN_MS = 5 * 60 * 1000;

export function isCronRun(runType) {
  return runType === "cron" || runType === "incremental";
}

export function cronMaxItems(runType, manualMax, cronMax = 2) {
  return isCronRun(runType) ? cronMax : manualMax;
}

export function budgetRemaining(startedAt, budgetMs = CRON_BUDGET_MS) {
  return Math.max(0, budgetMs - (Date.now() - startedAt));
}

export function budgetExceeded(startedAt, budgetMs = CRON_BUDGET_MS) {
  return budgetRemaining(startedAt, budgetMs) <= 0;
}

export async function runWithBudget(items, handler, { startedAt, budgetMs = CRON_BUDGET_MS, minRemainingMs = 3_000 } = {}) {
  const results = [];
  for (const item of items || []) {
    if (budgetRemaining(startedAt, budgetMs) < minRemainingMs) {
      results.push({ item, stopped: true, reason: "budget_exhausted" });
      break;
    }
    results.push({ item, ...(await handler(item)) });
  }
  return {
    results,
    stoppedEarly: results.some((r) => r.stopped),
    remainingMs: budgetRemaining(startedAt, budgetMs),
  };
}
