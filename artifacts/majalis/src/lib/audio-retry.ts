/**
 * Exponential backoff for audio stream retries — pure helpers.
 */

export function audioBackoffMs(attempt: number, baseMs = 300, maxMs = 5_000): number {
  const exp = Math.min(maxMs, baseMs * Math.pow(2, Math.max(0, attempt)));
  const jitter = exp * 0.2 * Math.random();
  return Math.round(Math.min(maxMs, exp * 0.8 + jitter));
}

export type AudioRetryDecision =
  | { action: "retry"; delayMs: number }
  | { action: "fail" };

/** Decide whether to retry after a media error. NotAllowedError is never retried. */
export function decideAudioRetry(
  err: unknown,
  attempt: number,
  maxAttempts = 3,
): AudioRetryDecision {
  if (attempt >= maxAttempts) return { action: "fail" };
  const name = (err as { name?: string })?.name || "";
  const message = String((err as Error)?.message || err || "");
  if (name === "NotAllowedError" || message.includes("NotAllowedError")) {
    return { action: "fail" };
  }
  // AbortError from intentional stop — do not retry
  if (name === "AbortError") return { action: "fail" };
  return { action: "retry", delayMs: audioBackoffMs(attempt) };
}

export function isTransientMediaError(audio: HTMLAudioElement | null): boolean {
  if (!audio) return true;
  const code = audio.error?.code;
  // MEDIA_ERR_ABORTED=1, NETWORK=2, DECODE=3, SRC_NOT_SUPPORTED=4
  if (code === 1) return false;
  if (code === 4) return false;
  return true; // network / decode / unknown → retry
}
