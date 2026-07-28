/**
 * Part 23 — Dynamic network RTT & latency balancing engine.
 * Monitors navigator.connection.rtt + observed jitter; tunes batch sizes,
 * audio prefetch windows, and search debounce intervals. Logic-only — no UI.
 */

export type NetworkSchedulerPolicy = {
  rttMs: number | null;
  jitterMs: number;
  /** Suggested search / filter debounce (ms). */
  searchDebounceMs: number;
  /** Concurrent request batch size for background fetches. */
  requestBatchSize: number;
  /** How many next ayahs to warm-prefetch. */
  audioPrefetchCount: number;
  /** Target buffered media seconds (MSE / HTMLMedia). */
  targetBufferSec: number;
  reasons: string[];
};

type ConnLike = {
  rtt?: number;
  downlink?: number;
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
};

const listeners = new Set<(p: NetworkSchedulerPolicy) => void>();
let lastRtt: number | null = null;
let ewmaRtt: number | null = null;
let jitterEwma = 0;
let bound = false;

function readConn(): ConnLike | null {
  try {
    return (navigator as Navigator & { connection?: ConnLike }).connection ?? null;
  } catch {
    return null;
  }
}

function sampleRtt(): number | null {
  const conn = typeof navigator !== "undefined" ? readConn() : null;
  const raw = conn?.rtt;
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) return raw;
  return lastRtt;
}

/** Feed an observed one-way / RTT sample (e.g. audio start latency). */
export function observeNetworkRtt(rttMs: number): void {
  if (!Number.isFinite(rttMs) || rttMs < 0) return;
  if (ewmaRtt == null) {
    ewmaRtt = rttMs;
    jitterEwma = 0;
  } else {
    const delta = Math.abs(rttMs - ewmaRtt);
    jitterEwma = jitterEwma * 0.7 + delta * 0.3;
    ewmaRtt = ewmaRtt * 0.65 + rttMs * 0.35;
  }
  lastRtt = rttMs;
  emit();
}

export function computeNetworkSchedulerPolicy(
  hints?: { rttMs?: number | null; jitterMs?: number; ect?: string; saveData?: boolean; downlink?: number | null },
): NetworkSchedulerPolicy {
  const conn = typeof navigator !== "undefined" ? readConn() : null;
  const rtt = hints?.rttMs ?? ewmaRtt ?? sampleRtt();
  const jitter = hints?.jitterMs ?? jitterEwma;
  const ect = hints?.ect ?? conn?.effectiveType ?? "unknown";
  const saveData = hints?.saveData ?? !!conn?.saveData;
  const downlink = hints?.downlink ?? conn?.downlink ?? null;
  const reasons: string[] = [];

  let searchDebounceMs = 300;
  let requestBatchSize = 6;
  let audioPrefetchCount = 1;
  let targetBufferSec = 8;

  if (saveData) {
    reasons.push("save-data");
    searchDebounceMs = 450;
    requestBatchSize = 2;
    audioPrefetchCount = 0;
    targetBufferSec = 4;
  }

  if (ect === "slow-2g" || ect === "2g") {
    reasons.push(`ect:${ect}`);
    searchDebounceMs = 550;
    requestBatchSize = 1;
    audioPrefetchCount = 0;
    targetBufferSec = 18;
  } else if (ect === "3g") {
    reasons.push("ect:3g");
    searchDebounceMs = 400;
    requestBatchSize = 3;
    audioPrefetchCount = 1;
    targetBufferSec = 12;
  } else if (ect === "4g") {
    reasons.push("ect:4g");
    searchDebounceMs = 280;
    requestBatchSize = 8;
    audioPrefetchCount = 2;
    targetBufferSec = 6;
  }

  if (rtt != null) {
    reasons.push(`rtt:${Math.round(rtt)}`);
    if (rtt > 400) {
      searchDebounceMs = Math.max(searchDebounceMs, 500);
      requestBatchSize = Math.min(requestBatchSize, 2);
      audioPrefetchCount = 0;
      targetBufferSec = Math.max(targetBufferSec, 16);
    } else if (rtt > 200) {
      searchDebounceMs = Math.max(searchDebounceMs, 350);
      requestBatchSize = Math.min(requestBatchSize, 4);
      audioPrefetchCount = Math.min(audioPrefetchCount, 1);
    } else if (rtt < 50) {
      searchDebounceMs = Math.min(searchDebounceMs, 200);
      requestBatchSize = Math.max(requestBatchSize, 10);
      audioPrefetchCount = Math.max(audioPrefetchCount, 2);
      targetBufferSec = Math.min(targetBufferSec, 5);
    }
  }

  if (jitter > 80) {
    reasons.push(`jitter:${Math.round(jitter)}`);
    searchDebounceMs = Math.min(600, searchDebounceMs + 80);
    requestBatchSize = Math.max(1, requestBatchSize - 2);
    audioPrefetchCount = Math.min(audioPrefetchCount, 1);
  }

  if (downlink != null && downlink < 0.5) {
    reasons.push(`downlink:${downlink.toFixed(2)}`);
    requestBatchSize = 1;
    audioPrefetchCount = 0;
  }

  if (!reasons.length) reasons.push("healthy");

  return {
    rttMs: rtt,
    jitterMs: Math.round(jitter),
    searchDebounceMs: Math.max(120, Math.min(700, Math.round(searchDebounceMs))),
    requestBatchSize: Math.max(1, Math.min(16, requestBatchSize | 0)),
    audioPrefetchCount: Math.max(0, Math.min(3, audioPrefetchCount | 0)),
    targetBufferSec: Math.max(3, Math.min(30, targetBufferSec)),
    reasons,
  };
}

function emit(): void {
  const policy = computeNetworkSchedulerPolicy();
  for (const fn of listeners) {
    try {
      fn(policy);
    } catch {
      /* ignore */
    }
  }
}

function ensureBound(): void {
  if (bound || typeof window === "undefined") return;
  bound = true;
  const conn = readConn();
  conn?.addEventListener?.("change", () => emit());
  // Soft poll — some browsers never fire change
  window.setInterval(() => {
    const r = sampleRtt();
    if (r != null) observeNetworkRtt(r);
  }, 20_000);
}

export function subscribeNetworkScheduler(
  fn: (p: NetworkSchedulerPolicy) => void,
): () => void {
  ensureBound();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getNetworkSchedulerPolicy(): NetworkSchedulerPolicy {
  ensureBound();
  return computeNetworkSchedulerPolicy();
}

export function startNetworkScheduler(): void {
  ensureBound();
  const r = sampleRtt();
  if (r != null) observeNetworkRtt(r);
}

export function resetNetworkSchedulerForTests(): void {
  lastRtt = null;
  ewmaRtt = null;
  jitterEwma = 0;
  listeners.clear();
  bound = false;
}
