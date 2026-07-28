/**
 * Heavy-compute Web Worker — Arabic filter + analytics aggregation.
 * Keep self-contained logic via arabic-match-core (no DOM).
 */
/// <reference lib="webworker" />

import {
  aggregateDayMetrics,
  filterDocsByNeedle,
  prepareNeedleVariants,
  type MatchDoc,
} from "@/lib/arabic-match-core";

export type HeavyComputeRequest =
  | {
      id: string;
      type: "filter_docs";
      docs: MatchDoc[];
      needles: string[];
    }
  | {
      id: string;
      type: "aggregate_days";
      days: Array<{
        tasksCompleted: number;
        tasksTotal: number;
        pagesRead: number;
        active: boolean;
      }>;
    };

export type HeavyComputeResponse =
  | { id: string; type: "filter_docs"; ids: string[] }
  | {
      id: string;
      type: "aggregate_days";
      result: { completionRate: number; totalPages: number; activeDays: number };
    }
  | { id: string; type: "error"; message: string };

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (ev: MessageEvent<HeavyComputeRequest>) => {
  const msg = ev.data;
  if (!msg || !msg.id) return;
  try {
    if (msg.type === "filter_docs") {
      const variants = prepareNeedleVariants(msg.needles);
      const ids = filterDocsByNeedle(msg.docs, variants);
      const res: HeavyComputeResponse = { id: msg.id, type: "filter_docs", ids };
      ctx.postMessage(res);
      return;
    }
    if (msg.type === "aggregate_days") {
      const result = aggregateDayMetrics(msg.days);
      const res: HeavyComputeResponse = { id: msg.id, type: "aggregate_days", result };
      ctx.postMessage(res);
      return;
    }
  } catch (err) {
    const res: HeavyComputeResponse = {
      id: msg.id,
      type: "error",
      message: String((err as Error)?.message || err),
    };
    ctx.postMessage(res);
  }
};
