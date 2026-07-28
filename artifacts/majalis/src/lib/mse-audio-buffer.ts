/**
 * Part 23 — Resilient MSE SourceBuffer management.
 * Handles append backpressure (QuotaExceededError) and proactive eviction
 * of played ranges so long Quran recitations keep a flat memory footprint.
 * Logic-only — no UI.
 */

export type MseSessionOptions = {
  /** MIME type e.g. audio/mpeg or audio/mp4; codecs optional. */
  mimeType?: string;
  /** Keep this many seconds behind currentTime. */
  retainBehindSec?: number;
  /** Soft max buffered seconds ahead. */
  maxAheadSec?: number;
};

export type MseAppendResult =
  | { ok: true; queued: boolean }
  | { ok: false; error: string; evicted: boolean };

export type MseAudioSession = {
  mediaSource: MediaSource;
  sourceBuffer: SourceBuffer | null;
  objectUrl: string;
  append: (data: ArrayBuffer | ArrayBufferView) => Promise<MseAppendResult>;
  evictPlayed: () => void;
  endOfStream: () => void;
  destroy: () => void;
  getBufferedSeconds: () => number;
};

function toUint8(data: ArrayBuffer | ArrayBufferView): Uint8Array {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

export function isMseSupported(mimeType = "audio/mpeg"): boolean {
  try {
    if (typeof MediaSource === "undefined") return false;
    return MediaSource.isTypeSupported(mimeType);
  } catch {
    return false;
  }
}

function waitUpdateEnd(sb: SourceBuffer): Promise<void> {
  if (!sb.updating) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      sb.removeEventListener("updateend", done);
      resolve();
    };
    sb.addEventListener("updateend", done);
  });
}

/**
 * Attach an MSE pipeline to an HTMLAudioElement for continuous streaming.
 * Falls back gracefully when MSE unsupported (caller should use src=blob).
 */
export async function createMseAudioSession(
  audio: HTMLAudioElement,
  opts?: MseSessionOptions,
): Promise<MseAudioSession | null> {
  const mimeType = opts?.mimeType ?? "audio/mpeg";
  if (!isMseSupported(mimeType)) return null;

  const retainBehind = opts?.retainBehindSec ?? 30;
  const maxAhead = opts?.maxAheadSec ?? 90;
  const mediaSource = new MediaSource();
  const objectUrl = URL.createObjectURL(mediaSource);
  audio.src = objectUrl;

  let sourceBuffer: SourceBuffer | null = null;
  const queue: Uint8Array[] = [];
  let destroyed = false;
  let draining = false;

  await new Promise<void>((resolve, reject) => {
    const onOpen = () => {
      try {
        sourceBuffer = mediaSource.addSourceBuffer(mimeType);
        sourceBuffer.mode = "sequence";
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    if (mediaSource.readyState === "open") onOpen();
    else mediaSource.addEventListener("sourceopen", onOpen, { once: true });
  });

  const evictPlayed = () => {
    if (!sourceBuffer || sourceBuffer.updating || destroyed) return;
    try {
      const t = audio.currentTime || 0;
      const buffered = sourceBuffer.buffered;
      if (!buffered.length) return;
      const start = buffered.start(0);
      const cut = Math.max(start, t - retainBehind);
      if (cut - start > 2) {
        sourceBuffer.remove(start, cut);
      }
      // Cap ahead buffer
      const end = buffered.end(buffered.length - 1);
      if (end - t > maxAhead + 10) {
        // Will be trimmed on next successful append cycle after updateend
      }
    } catch {
      /* ignore transient */
    }
  };

  const drain = async (): Promise<void> => {
    if (draining || destroyed || !sourceBuffer) return;
    draining = true;
    try {
      while (queue.length && sourceBuffer && !destroyed) {
        await waitUpdateEnd(sourceBuffer);
        evictPlayed();
        await waitUpdateEnd(sourceBuffer);
        const chunk = queue.shift();
        if (!chunk) break;
        try {
          sourceBuffer.appendBuffer(chunk);
          await waitUpdateEnd(sourceBuffer);
        } catch (err) {
          const name = (err as DOMException)?.name || "";
          if (name === "QuotaExceededError") {
            // Proactive eviction then retry once
            evictPlayed();
            await waitUpdateEnd(sourceBuffer);
            try {
              // Evict more aggressively
              const t = audio.currentTime || 0;
              const buffered = sourceBuffer.buffered;
              if (buffered.length) {
                const start = buffered.start(0);
                const aggressive = Math.max(start, t - 5);
                if (aggressive > start) sourceBuffer.remove(start, aggressive);
                await waitUpdateEnd(sourceBuffer);
              }
              sourceBuffer.appendBuffer(chunk);
              await waitUpdateEnd(sourceBuffer);
            } catch {
              queue.unshift(chunk);
              break;
            }
          } else {
            queue.unshift(chunk);
            break;
          }
        }
      }
    } finally {
      draining = false;
    }
  };

  return {
    mediaSource,
    get sourceBuffer() {
      return sourceBuffer;
    },
    objectUrl,
    async append(data) {
      if (destroyed || !sourceBuffer) return { ok: false, error: "destroyed", evicted: false };
      queue.push(toUint8(data));
      try {
        await drain();
        return { ok: true, queued: queue.length > 0 };
      } catch (err) {
        const name = (err as DOMException)?.name || String(err);
        if (name.includes("QuotaExceeded")) {
          evictPlayed();
          return { ok: false, error: "QuotaExceededError", evicted: true };
        }
        return { ok: false, error: String(err), evicted: false };
      }
    },
    evictPlayed,
    endOfStream() {
      try {
        if (mediaSource.readyState === "open") mediaSource.endOfStream();
      } catch {
        /* ignore */
      }
    },
    destroy() {
      destroyed = true;
      queue.length = 0;
      try {
        if (sourceBuffer && !sourceBuffer.updating) {
          /* detach */
        }
      } catch {
        /* ignore */
      }
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        /* ignore */
      }
      try {
        audio.removeAttribute("src");
        audio.load();
      } catch {
        /* ignore */
      }
      sourceBuffer = null;
    },
    getBufferedSeconds() {
      try {
        if (!sourceBuffer || !sourceBuffer.buffered.length) return 0;
        const b = sourceBuffer.buffered;
        return b.end(b.length - 1) - b.start(0);
      } catch {
        return 0;
      }
    },
  };
}

/**
 * Evict played ranges on a live SourceBuffer (standalone helper for tests).
 */
export function evictPlayedSourceBufferRange(
  sourceBuffer: SourceBuffer,
  currentTime: number,
  retainBehindSec = 30,
): boolean {
  try {
    if (sourceBuffer.updating) return false;
    const buffered = sourceBuffer.buffered;
    if (!buffered.length) return false;
    const start = buffered.start(0);
    const cut = Math.max(start, currentTime - retainBehindSec);
    if (cut - start <= 1) return false;
    sourceBuffer.remove(start, cut);
    return true;
  } catch {
    return false;
  }
}

/** Classify append errors for callers. */
export function isQuotaExceededError(err: unknown): boolean {
  return (err as DOMException)?.name === "QuotaExceededError";
}
