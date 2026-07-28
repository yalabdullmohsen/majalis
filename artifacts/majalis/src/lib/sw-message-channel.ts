/**
 * Bidirectional Service Worker MessageChannel — request/response with timeout.
 * Guarantees confirmation for offline sync / audio cache status ops.
 * Logic-only — no UI.
 */

export type SwChannelRequest = {
  type: string;
  payload?: unknown;
  /** Client-generated id (auto if omitted) */
  id?: string;
};

export type SwChannelResponse = {
  ok: boolean;
  type: string;
  id: string;
  payload?: unknown;
  error?: string;
};

const DEFAULT_TIMEOUT_MS = 8_000;

function nextId(): string {
  return `sw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Send a request to the active Service Worker via MessageChannel.
 * Resolves with the SW response or rejects/falls back on timeout.
 */
export async function swChannelRequest(
  request: SwChannelRequest,
  opts?: { timeoutMs?: number; fallback?: SwChannelResponse },
): Promise<SwChannelResponse> {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const id = request.id ?? nextId();

  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return (
      opts?.fallback ?? {
        ok: false,
        type: request.type,
        id,
        error: "no-service-worker",
      }
    );
  }

  const controller = navigator.serviceWorker.controller;
  if (!controller) {
    return (
      opts?.fallback ?? {
        ok: false,
        type: request.type,
        id,
        error: "no-controller",
      }
    );
  }

  return new Promise<SwChannelResponse>((resolve) => {
    const channel = new MessageChannel();
    let settled = false;

    const finish = (res: SwChannelResponse) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        channel.port1.close();
      } catch {
        /* ignore */
      }
      resolve(res);
    };

    const timer = setTimeout(() => {
      finish(
        opts?.fallback ?? {
          ok: false,
          type: request.type,
          id,
          error: "timeout",
        },
      );
    }, timeoutMs);

    channel.port1.onmessage = (ev: MessageEvent) => {
      const data = ev.data as SwChannelResponse | undefined;
      if (!data || data.id !== id) return;
      finish({
        ok: !!data.ok,
        type: data.type || request.type,
        id,
        payload: data.payload,
        error: data.error,
      });
    };

    try {
      controller.postMessage(
        {
          type: request.type,
          id,
          payload: request.payload,
          __majalisChannel: true,
        },
        [channel.port2],
      );
    } catch (err) {
      finish(
        opts?.fallback ?? {
          ok: false,
          type: request.type,
          id,
          error: String((err as Error)?.message || err),
        },
      );
    }
  });
}

/** Convenience: ask SW for offline cache status. */
export function swQueryOfflineCacheStatus(timeoutMs = 5_000): Promise<SwChannelResponse> {
  return swChannelRequest(
    { type: "MAJALIS_OFFLINE_CACHE_STATUS" },
    {
      timeoutMs,
      fallback: { ok: false, type: "MAJALIS_OFFLINE_CACHE_STATUS", id: "fallback", error: "unavailable" },
    },
  );
}

/** Convenience: request SW to acknowledge offline sync kick. */
export function swNotifyOfflineSync(payload?: unknown): Promise<SwChannelResponse> {
  return swChannelRequest(
    { type: "MAJALIS_OFFLINE_SYNC", payload },
    { timeoutMs: 5_000, fallback: { ok: true, type: "MAJALIS_OFFLINE_SYNC", id: "local-fallback" } },
  );
}
