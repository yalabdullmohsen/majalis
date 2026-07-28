/**
 * Ultra-lightweight diagnostics ring buffer — never blocks the main thread.
 * Logic-only — no UI.
 */

export type DiagnosticKind =
  | "audio-chunk-fail"
  | "audio-stall"
  | "idb-retry"
  | "idb-heal"
  | "worker-restart"
  | "font-wait"
  | "nav-abort"
  | "fetch-fail"
  | "custom";

export type DiagnosticEvent = {
  kind: DiagnosticKind;
  message: string;
  ts: number;
  meta?: Record<string, unknown>;
};

const CAPACITY = 128;
const buffer: DiagnosticEvent[] = new Array(CAPACITY);
let writeIdx = 0;
let size = 0;
let counters: Record<string, number> = Object.create(null);

function bump(kind: string): void {
  counters[kind] = (counters[kind] ?? 0) + 1;
}

/** Push one diagnostic event (O(1), no allocation beyond the event object). */
export function logDiagnostic(
  kind: DiagnosticKind,
  message: string,
  meta?: Record<string, unknown>,
): void {
  const ev: DiagnosticEvent = {
    kind,
    message,
    ts: Date.now(),
    meta,
  };
  buffer[writeIdx] = ev;
  writeIdx = (writeIdx + 1) % CAPACITY;
  if (size < CAPACITY) size += 1;
  bump(kind);
}

export function getDiagnosticCounters(): Readonly<Record<string, number>> {
  return { ...counters };
}

export function getDiagnosticCount(kind: DiagnosticKind): number {
  return counters[kind] ?? 0;
}

/** Snapshot recent events (oldest→newest), capped. */
export function getRecentDiagnostics(limit = 32): DiagnosticEvent[] {
  const n = Math.min(limit, size);
  const out: DiagnosticEvent[] = [];
  for (let i = n; i > 0; i--) {
    const idx = (writeIdx - i + CAPACITY) % CAPACITY;
    const ev = buffer[idx];
    if (ev) out.push(ev);
  }
  return out;
}

export function clearDiagnostics(): void {
  writeIdx = 0;
  size = 0;
  counters = Object.create(null);
  for (let i = 0; i < CAPACITY; i++) {
    // @ts-expect-error clear slot
    buffer[i] = undefined;
  }
}

/**
 * Hook-shaped API without importing React — callers wrap in useMemo/useEffect.
 * Returns stable function refs for logging + snapshot.
 */
export function createDiagnosticsApi() {
  return {
    log: logDiagnostic,
    counters: getDiagnosticCounters,
    recent: getRecentDiagnostics,
    clear: clearDiagnostics,
  };
}
