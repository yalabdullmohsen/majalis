/**
 * Journey performance marks — User Timing API + silent budget alerts
 * in development / staging only.
 * Logic-only — no UI.
 */

export type JourneyName =
  | "ttfv-interactive"
  | "audio-first-byte"
  | "mushaf-page-ready"
  | "offline-sync"
  | "custom";

/** Budgets in ms — exceeded → silent console warning in non-production. */
export const JOURNEY_BUDGETS_MS: Record<JourneyName, number> = {
  "ttfv-interactive": 2_500,
  "audio-first-byte": 1_800,
  "mushaf-page-ready": 3_000,
  "offline-sync": 12_000,
  custom: 5_000,
};

const PREFIX = "majalis:";

function isDevOrStaging(): boolean {
  try {
    // Vite
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    if (env?.DEV) return true;
    if (env?.MODE && env.MODE !== "production") return true;
    if (env?.VITE_APP_ENV && env.VITE_APP_ENV !== "production") return true;
  } catch {
    /* ignore */
  }
  try {
    if (typeof location !== "undefined") {
      const h = location.hostname;
      if (h === "localhost" || h === "127.0.0.1" || h.endsWith(".vercel.app")) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function markName(journey: string, phase: "start" | "end"): string {
  return `${PREFIX}${journey}:${phase}`;
}

export function markJourneyStart(journey: JourneyName | string): void {
  if (typeof performance === "undefined" || typeof performance.mark !== "function") return;
  try {
    performance.mark(markName(journey, "start"));
  } catch {
    /* ignore */
  }
}

export function markJourneyEnd(journey: JourneyName | string): void {
  if (typeof performance === "undefined" || typeof performance.mark !== "function") return;
  try {
    performance.mark(markName(journey, "end"));
  } catch {
    /* ignore */
  }
}

export type JourneyMeasureResult = {
  name: string;
  durationMs: number;
  overBudget: boolean;
  budgetMs: number;
};

/**
 * Measure start→end marks; alert in console only for dev/staging when over budget.
 */
export function measureJourney(
  journey: JourneyName | string,
  budgetMs?: number,
): JourneyMeasureResult | null {
  if (typeof performance === "undefined" || typeof performance.measure !== "function") {
    return null;
  }
  const start = markName(journey, "start");
  const end = markName(journey, "end");
  const measureName = `${PREFIX}${journey}`;
  try {
    // Clear prior measure with same name to avoid InvalidAccessError in some engines
    try {
      performance.clearMeasures?.(measureName);
    } catch {
      /* ignore */
    }
    performance.measure(measureName, start, end);
    const entries = performance.getEntriesByName(measureName, "measure");
    const last = entries[entries.length - 1];
    const durationMs = last ? Math.round(last.duration) : 0;
    const budget =
      budgetMs ??
      (JOURNEY_BUDGETS_MS[journey as JourneyName] ?? JOURNEY_BUDGETS_MS.custom);
    const overBudget = durationMs > budget;
    if (overBudget && isDevOrStaging()) {
      // Silent alert — console only, never user-facing UI
      console.warn(
        `[perf:budget] ${journey} ${durationMs}ms exceeds ${budget}ms`,
      );
    }
    return { name: measureName, durationMs, overBudget, budgetMs: budget };
  } catch {
    return null;
  }
}

/** Convenience: mark end + measure in one call. */
export function endJourney(
  journey: JourneyName | string,
  budgetMs?: number,
): JourneyMeasureResult | null {
  markJourneyEnd(journey);
  return measureJourney(journey, budgetMs);
}

/** Time an async fn with User Timing marks. */
export async function withJourneyMark<T>(
  journey: JourneyName | string,
  fn: () => Promise<T>,
  budgetMs?: number,
): Promise<T> {
  markJourneyStart(journey);
  try {
    return await fn();
  } finally {
    endJourney(journey, budgetMs);
  }
}

export function resetJourneyMarksForTests(): void {
  if (typeof performance === "undefined") return;
  try {
    performance.clearMarks?.();
    performance.clearMeasures?.();
  } catch {
    /* ignore */
  }
}
