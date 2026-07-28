/**
 * Smart background sync scheduler — exponential backoff + full jitter.
 * Prevents retry storms on flaky networks / battery drain.
 * Logic-only — no UI.
 */

export type BackoffOptions = {
  /** Base delay for attempt 0 (ms). Default 1000. */
  baseMs?: number;
  /** Cap delay (ms). Default 60_000. */
  maxMs?: number;
  /** Attempt index (0-based). */
  attempt: number;
  /** Random source 0..1 — injectable for tests. */
  random?: () => number;
};

/**
 * Full-jitter exponential backoff (AWS-style):
 * delay = random(0, min(max, base * 2^attempt))
 */
export function computeBackoffMs(opts: BackoffOptions): number {
  const base = opts.baseMs ?? 1_000;
  const max = opts.maxMs ?? 60_000;
  const attempt = Math.max(0, Math.floor(opts.attempt));
  const exp = Math.min(max, base * Math.pow(2, attempt));
  const rand = opts.random ?? Math.random;
  return Math.floor(rand() * exp);
}

export type SyncJobResult = { ok: boolean; error?: string };

type JobState = {
  attempt: number;
  timer: ReturnType<typeof setTimeout> | null;
  running: boolean;
  lastAt: number;
};

const jobs = new Map<string, JobState>();

function getJob(key: string): JobState {
  let j = jobs.get(key);
  if (!j) {
    j = { attempt: 0, timer: null, running: false, lastAt: 0 };
    jobs.set(key, j);
  }
  return j;
}

/**
 * Schedule a background sync with coalescing + backoff on failure.
 * Success resets attempt counter. Concurrent calls for the same key coalesce.
 */
export function scheduleBackgroundSync(
  key: string,
  work: () => Promise<SyncJobResult | void>,
  opts?: { baseMs?: number; maxMs?: number; minIntervalMs?: number; maxAttempts?: number },
): void {
  if (typeof window === "undefined") return;
  const job = getJob(key);
  if (job.running || job.timer != null) return;

  const maxAttempts = opts?.maxAttempts ?? 8;
  if (job.attempt >= maxAttempts) return;

  const minInterval = opts?.minIntervalMs ?? 0;
  const since = Date.now() - job.lastAt;
  const delay =
    job.attempt === 0 && since >= minInterval
      ? 0
      : Math.max(
          minInterval > 0 ? Math.max(0, minInterval - since) : 0,
          job.attempt === 0 ? 0 : computeBackoffMs({
            attempt: job.attempt,
            baseMs: opts?.baseMs,
            maxMs: opts?.maxMs,
          }),
        );

  job.timer = setTimeout(() => {
    job.timer = null;
    job.running = true;
    void (async () => {
      try {
        const result = await work();
        const ok = result == null || result.ok !== false;
        if (ok) {
          job.attempt = 0;
        } else {
          job.attempt += 1;
          if (job.attempt < maxAttempts) {
            scheduleBackgroundSync(key, work, opts);
          }
        }
      } catch (err) {
        job.attempt += 1;
        if (job.attempt < maxAttempts) {
          scheduleBackgroundSync(key, work, opts);
        }
        void err;
      } finally {
        job.running = false;
        job.lastAt = Date.now();
      }
    })();
  }, delay);
}

/** Run work immediately with retries + jitter (awaitable). */
export async function runWithBackoff<T>(
  work: () => Promise<T>,
  opts?: {
    maxAttempts?: number;
    baseMs?: number;
    maxMs?: number;
    shouldRetry?: (err: unknown, attempt: number) => boolean;
    random?: () => number;
    sleep?: (ms: number) => Promise<void>;
  },
): Promise<T> {
  const maxAttempts = opts?.maxAttempts ?? 4;
  const sleep =
    opts?.sleep ??
    ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await work();
    } catch (err) {
      lastErr = err;
      const retry = opts?.shouldRetry?.(err, attempt) ?? true;
      if (!retry || attempt >= maxAttempts - 1) throw err;
      const wait = computeBackoffMs({
        attempt,
        baseMs: opts?.baseMs,
        maxMs: opts?.maxMs,
        random: opts?.random,
      });
      await sleep(wait);
    }
  }
  throw lastErr;
}

export function getSyncJobAttempt(key: string): number {
  return jobs.get(key)?.attempt ?? 0;
}

export function resetSyncSchedulerForTests(): void {
  for (const j of jobs.values()) {
    if (j.timer != null) clearTimeout(j.timer);
  }
  jobs.clear();
}
