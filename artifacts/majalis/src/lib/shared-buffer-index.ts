/**
 * Part 23 — Zero-lock concurrent processing via SharedArrayBuffer + Atomics,
 * with silent structured-clone fallback when COOP/COEP isolation is absent.
 * Used for heavy Arabic text indexing / root-word search off the main thread.
 * Logic-only — no UI.
 */

export type ConcurrentIndexJob = {
  id: string;
  /** Haystack strings to scan. */
  items: string[];
  /** Needle (already normalized preferred). */
  query: string;
};

export type ConcurrentIndexHit = {
  index: number;
  score: number;
};

export type ConcurrentIndexResult = {
  id: string;
  hits: ConcurrentIndexHit[];
  mode: "shared-buffer" | "structured-clone";
};

/** True when crossOriginIsolated + SAB + Atomics are usable. */
export function canUseSharedArrayBuffer(): boolean {
  try {
    if (typeof SharedArrayBuffer === "undefined") return false;
    if (typeof Atomics === "undefined") return false;
    if (typeof crossOriginIsolated !== "undefined" && crossOriginIsolated !== true) {
      return false;
    }
    // Probe construct
    const buf = new SharedArrayBuffer(8);
    const view = new Int32Array(buf);
    Atomics.store(view, 0, 1);
    return Atomics.load(view, 0) === 1;
  } catch {
    return false;
  }
}

/**
 * Layout of control SAB (Int32):
 * [0] = state (0 idle, 1 running, 2 done, 3 error)
 * [1] = hitCount
 * [2] = reserved
 * [3] = generation
 * Hit pairs packed in Float64Array sibling buffer: [index, score, ...]
 */
const STATE_IDLE = 0;
const STATE_RUNNING = 1;
const STATE_DONE = 2;

function scoreMatch(hay: string, needle: string): number {
  if (!needle) return 0;
  if (hay === needle) return 1;
  if (hay.includes(needle)) return 0.85;
  // cheap prefix / length-tolerant score
  let matched = 0;
  const n = Math.min(hay.length, needle.length);
  for (let i = 0; i < n; i++) {
    if (hay[i] === needle[i]) matched += 1;
    else break;
  }
  return matched / Math.max(needle.length, 1) * 0.5;
}

/** Synchronous scan — used by clone fallback and SAB worker body. */
export function indexSearchSync(
  items: readonly string[],
  query: string,
  limit = 50,
): ConcurrentIndexHit[] {
  const q = query.trim();
  if (!q) return [];
  const hits: ConcurrentIndexHit[] = [];
  for (let i = 0; i < items.length; i++) {
    const score = scoreMatch(items[i] ?? "", q);
    if (score >= 0.5) hits.push({ index: i, score });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

/**
 * Run index job. Prefers SAB ring coordination when isolated; otherwise
 * structured-clone via Promise microtask (zero Worker overhead in restricted envs).
 */
export async function runConcurrentIndex(
  job: ConcurrentIndexJob,
  opts?: { limit?: number; signal?: AbortSignal },
): Promise<ConcurrentIndexResult> {
  const limit = opts?.limit ?? 50;
  if (opts?.signal?.aborted) {
    return { id: job.id, hits: [], mode: "structured-clone" };
  }

  if (canUseSharedArrayBuffer() && typeof Worker !== "undefined") {
    try {
      const hits = await runWithSharedBuffer(job, limit, opts?.signal);
      return { id: job.id, hits, mode: "shared-buffer" };
    } catch {
      /* fall through */
    }
  }

  // Silent structured-clone / main-thread chunked fallback
  const hits = await runCloneFallback(job.items, job.query, limit, opts?.signal);
  return { id: job.id, hits, mode: "structured-clone" };
}

async function runCloneFallback(
  items: readonly string[],
  query: string,
  limit: number,
  signal?: AbortSignal,
): Promise<ConcurrentIndexHit[]> {
  const { yieldToMain } = await import("@/lib/yield-to-main");
  const hits: ConcurrentIndexHit[] = [];
  const chunk = 200;
  for (let i = 0; i < items.length; i += chunk) {
    if (signal?.aborted) break;
    if (i > 0) await yieldToMain();
    const end = Math.min(i + chunk, items.length);
    for (let j = i; j < end; j++) {
      const score = scoreMatch(items[j] ?? "", query);
      if (score >= 0.5) hits.push({ index: j, score });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

async function runWithSharedBuffer(
  job: ConcurrentIndexJob,
  limit: number,
  signal?: AbortSignal,
): Promise<ConcurrentIndexHit[]> {
  // Encode items as length-prefixed UTF-8 in a transferable SAB payload is heavy;
  // instead: control SAB + clone items into worker once (items still cloned once),
  // results written via Atomics into shared hit buffer — zero-lock result handoff.
  const control = new SharedArrayBuffer(16);
  const hitBuf = new SharedArrayBuffer(Math.max(64, limit * 2 * 8));
  const ctrl = new Int32Array(control);
  Atomics.store(ctrl, 0, STATE_IDLE);

  const workerSource = `
    self.onmessage = (ev) => {
      const { control, hitBuf, items, query, limit } = ev.data;
      const ctrl = new Int32Array(control);
      const hits = new Float64Array(hitBuf);
      Atomics.store(ctrl, 0, ${STATE_RUNNING});
      try {
        const q = String(query || "");
        const out = [];
        for (let i = 0; i < items.length; i++) {
          const hay = String(items[i] || "");
          let score = 0;
          if (!q) score = 0;
          else if (hay === q) score = 1;
          else if (hay.includes(q)) score = 0.85;
          else {
            let matched = 0;
            const n = Math.min(hay.length, q.length);
            for (let k = 0; k < n; k++) {
              if (hay[k] === q[k]) matched++;
              else break;
            }
            score = (matched / Math.max(q.length, 1)) * 0.5;
          }
          if (score >= 0.5) out.push([i, score]);
        }
        out.sort((a, b) => b[1] - a[1]);
        const slice = out.slice(0, limit);
        for (let i = 0; i < slice.length; i++) {
          hits[i * 2] = slice[i][0];
          hits[i * 2 + 1] = slice[i][1];
        }
        Atomics.store(ctrl, 1, slice.length);
        Atomics.store(ctrl, 0, ${STATE_DONE});
        Atomics.notify(ctrl, 0);
      } catch (e) {
        Atomics.store(ctrl, 0, 3);
        Atomics.notify(ctrl, 0);
      }
    };
  `;

  const blob = new Blob([workerSource], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);

  try {
    worker.postMessage({
      control,
      hitBuf,
      items: job.items,
      query: job.query,
      limit,
    });

    // Wait for done via Atomics.waitAsync when available, else poll
    await waitForAtomicsDone(ctrl, signal);

    const count = Atomics.load(ctrl, 1);
    const hitsView = new Float64Array(hitBuf);
    const hits: ConcurrentIndexHit[] = [];
    for (let i = 0; i < count; i++) {
      hits.push({ index: hitsView[i * 2]!, score: hitsView[i * 2 + 1]! });
    }
    return hits;
  } finally {
    try {
      worker.terminate();
    } catch {
      /* ignore */
    }
    URL.revokeObjectURL(url);
  }
}

async function waitForAtomicsDone(ctrl: Int32Array, signal?: AbortSignal): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (signal?.aborted) throw new Error("aborted");
    const state = Atomics.load(ctrl, 0);
    if (state === STATE_DONE) return;
    if (state === 3) throw new Error("worker-error");
    // Prefer Atomics.waitAsync
    const waitAsync = (
      Atomics as typeof Atomics & {
        waitAsync?: (
          typedArray: Int32Array,
          index: number,
          value: number,
          timeout?: number,
        ) => { async: false; value: string } | { async: true; value: Promise<string> };
      }
    ).waitAsync;
    if (typeof waitAsync === "function") {
      const result = waitAsync(ctrl, 0, STATE_RUNNING, 50);
      if (result.async) await result.value;
    } else {
      await new Promise((r) => setTimeout(r, 8));
    }
  }
  throw new Error("sab-timeout");
}
