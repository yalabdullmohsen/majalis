/**
 * Performance monitor — logs operations exceeding threshold to console + error pipeline.
 */

import { logClientError, buildErrorReport } from "@/lib/error-report";

export const PERF_SLOW_MS = 3000;

type PerfKind = "api" | "query" | "render" | "supabase" | "fetch";

export type PerfEntry = {
  kind: PerfKind;
  label: string;
  durationMs: number;
  ok: boolean;
  meta?: Record<string, unknown>;
};

const recent = new Map<string, number>();
const DEDUPE_MS = 5000;

function dedupeKey(kind: PerfKind, label: string): string {
  return `${kind}:${label}`;
}

export function recordPerformance(entry: PerfEntry): void {
  if (entry.durationMs < PERF_SLOW_MS) return;

  const key = dedupeKey(entry.kind, entry.label);
  const now = Date.now();
  const last = recent.get(key) ?? 0;
  if (now - last < DEDUPE_MS) return;
  recent.set(key, now);

  const msg = `[perf:slow] ${entry.kind} "${entry.label}" ${entry.durationMs}ms ${entry.ok ? "ok" : "fail"}`;
  console.warn(msg, entry.meta ?? "");

  void logClientError(
    buildErrorReport(new Error(msg), {
      component: "PerformanceMonitor",
      section: entry.kind,
    }),
  );
}

export async function measureAsync<T>(
  kind: PerfKind,
  label: string,
  fn: () => Promise<T>,
  meta?: Record<string, unknown>,
): Promise<T> {
  const started = performance.now();
  try {
    const result = await fn();
    recordPerformance({
      kind,
      label,
      durationMs: Math.round(performance.now() - started),
      ok: true,
      meta,
    });
    return result;
  } catch (err) {
    recordPerformance({
      kind,
      label,
      durationMs: Math.round(performance.now() - started),
      ok: false,
      meta: { ...meta, error: String((err as Error)?.message || err) },
    });
    throw err;
  }
}
