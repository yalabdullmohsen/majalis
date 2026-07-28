/**
 * Analytics Web Worker — light off-main-thread metric batching.
 * Supervised via worker-supervisor (auto-restart on crash).
 */

/// <reference lib="webworker" />

type Metric = { name: string; value: number; ts?: number };

self.onmessage = (ev: MessageEvent) => {
  const msg = ev.data as { id: number; type: string; payload: unknown } | null;
  if (!msg || typeof msg.id !== "number") return;
  try {
    let result: unknown;
    switch (msg.type) {
      case "ping":
        result = "pong";
        break;
      case "summarize": {
        const batch = Array.isArray(msg.payload) ? (msg.payload as Metric[]) : [];
        const byName = new Map<string, { count: number; sum: number; max: number }>();
        for (const m of batch) {
          if (!m || typeof m.name !== "string" || !Number.isFinite(m.value)) continue;
          const cur = byName.get(m.name) ?? { count: 0, sum: 0, max: -Infinity };
          cur.count += 1;
          cur.sum += m.value;
          cur.max = Math.max(cur.max, m.value);
          byName.set(m.name, cur);
        }
        result = Object.fromEntries(
          [...byName.entries()].map(([name, s]) => [
            name,
            { count: s.count, avg: s.count ? s.sum / s.count : 0, max: s.max === -Infinity ? 0 : s.max },
          ]),
        );
        break;
      }
      default:
        throw new Error(`unknown task: ${msg.type}`);
    }
    (self as DedicatedWorkerGlobalScope).postMessage({ id: msg.id, ok: true, result });
  } catch (err) {
    (self as DedicatedWorkerGlobalScope).postMessage({
      id: msg.id,
      ok: false,
      error: String((err as Error)?.message || err),
    });
  }
};

export {};
