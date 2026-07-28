/**
 * Supervised analytics worker client with main-thread fallback.
 * Logic-only — no UI.
 */

import { SupervisedWorker } from "@/lib/worker-supervisor";

export type AnalyticsMetric = { name: string; value: number; ts?: number };

export type AnalyticsSummary = Record<
  string,
  { count: number; avg: number; max: number }
>;

let supervised: SupervisedWorker | null = null;

function getWorker(): SupervisedWorker | null {
  if (typeof Worker === "undefined") return null;
  if (supervised) return supervised;
  try {
    supervised = new SupervisedWorker(
      () =>
        new Worker(new URL("../workers/analytics.worker.ts", import.meta.url), {
          type: "module",
          name: "majalis-analytics",
        }),
      { name: "analytics", maxRestarts: 5 },
    );
    return supervised;
  } catch {
    return null;
  }
}

function summarizeMain(batch: AnalyticsMetric[]): AnalyticsSummary {
  const byName = new Map<string, { count: number; sum: number; max: number }>();
  for (const m of batch) {
    if (!m || typeof m.name !== "string" || !Number.isFinite(m.value)) continue;
    const cur = byName.get(m.name) ?? { count: 0, sum: 0, max: -Infinity };
    cur.count += 1;
    cur.sum += m.value;
    cur.max = Math.max(cur.max, m.value);
    byName.set(m.name, cur);
  }
  const out: AnalyticsSummary = {};
  for (const [name, s] of byName) {
    out[name] = {
      count: s.count,
      avg: s.count ? s.sum / s.count : 0,
      max: s.max === -Infinity ? 0 : s.max,
    };
  }
  return out;
}

export async function workerSummarizeMetrics(
  batch: AnalyticsMetric[],
): Promise<AnalyticsSummary> {
  const w = getWorker();
  if (!w) return summarizeMain(batch);
  try {
    return await w.request<AnalyticsSummary>("summarize", batch, 8_000);
  } catch {
    return summarizeMain(batch);
  }
}

export function terminateAnalyticsWorker(): void {
  supervised?.terminate();
  supervised = null;
}
