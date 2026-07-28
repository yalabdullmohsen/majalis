/**
 * Part 22 — Adaptive network protocol fallback engine.
 * Prefers WebTransport → WebSocket → HTTP Fetch streams based on
 * availability and middlebox failures. Logic-only — no UI.
 */

export type TransportKind = "webtransport" | "websocket" | "fetch";

export type TransportAttempt = {
  kind: TransportKind;
  ok: boolean;
  error?: string;
  ms: number;
};

export type TransportSession = {
  kind: TransportKind;
  /** Send a JSON-able payload; resolves when accepted by the transport. */
  send: (payload: unknown) => Promise<void>;
  /** Close underlying sockets / streams. */
  close: () => void;
};

export type AdaptiveTransportOptions = {
  /** Absolute or same-origin path for HTTP fallback (required). */
  httpUrl: string;
  /** Optional WebSocket URL (ws/wss). */
  wsUrl?: string;
  /** Optional WebTransport URL (https). */
  webTransportUrl?: string;
  /** Prefer order (default: webtransport, websocket, fetch). */
  prefer?: TransportKind[];
  /** Probe timeout per transport (ms). */
  probeTimeoutMs?: number;
  fetchInit?: RequestInit;
};

const DEFAULT_ORDER: TransportKind[] = ["webtransport", "websocket", "fetch"];

function hasWebTransport(): boolean {
  return typeof globalThis !== "undefined" && "WebTransport" in globalThis;
}

function hasWebSocket(): boolean {
  return typeof WebSocket !== "undefined";
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      p,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("transport-timeout")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Probe which transports are usable. Does not open long-lived sessions
 * except a cheap WebTransport/WebSocket handshake attempt when URLs given.
 */
export async function probeTransports(
  opts: AdaptiveTransportOptions,
): Promise<TransportAttempt[]> {
  const order = opts.prefer ?? DEFAULT_ORDER;
  const timeout = opts.probeTimeoutMs ?? 2_500;
  const attempts: TransportAttempt[] = [];

  for (const kind of order) {
    const t0 = Date.now();
    if (kind === "webtransport") {
      if (!opts.webTransportUrl || !hasWebTransport()) {
        attempts.push({ kind, ok: false, error: "unavailable", ms: 0 });
        continue;
      }
      try {
        // Dynamic construct — types may be missing in TS lib
        const WT = (globalThis as { WebTransport?: new (url: string) => {
          ready: Promise<void>;
          close: () => void;
        } }).WebTransport!;
        const transport = new WT(opts.webTransportUrl);
        await withTimeout(transport.ready, timeout);
        try {
          transport.close();
        } catch {
          /* ignore */
        }
        attempts.push({ kind, ok: true, ms: Date.now() - t0 });
      } catch (err) {
        attempts.push({
          kind,
          ok: false,
          error: String((err as Error)?.message || err),
          ms: Date.now() - t0,
        });
      }
      continue;
    }

    if (kind === "websocket") {
      if (!opts.wsUrl || !hasWebSocket()) {
        attempts.push({ kind, ok: false, error: "unavailable", ms: 0 });
        continue;
      }
      try {
        await withTimeout(
          new Promise<void>((resolve, reject) => {
            const ws = new WebSocket(opts.wsUrl!);
            const done = (fn: () => void) => {
              try {
                ws.close();
              } catch {
                /* ignore */
              }
              fn();
            };
            ws.onopen = () => done(resolve);
            ws.onerror = () => done(() => reject(new Error("ws-error")));
          }),
          timeout,
        );
        attempts.push({ kind, ok: true, ms: Date.now() - t0 });
      } catch (err) {
        attempts.push({
          kind,
          ok: false,
          error: String((err as Error)?.message || err),
          ms: Date.now() - t0,
        });
      }
      continue;
    }

    // fetch — always attempted when listed
    try {
      const { pooledFetch } = await import("@/lib/fetch-pool");
      const res = await withTimeout(
        pooledFetch(opts.httpUrl, {
          method: "HEAD",
          ...opts.fetchInit,
          timeoutMs: timeout,
        }),
        timeout + 500,
      );
      attempts.push({
        kind: "fetch",
        ok: res.ok || res.status === 405 || res.status === 404,
        error: res.ok ? undefined : `http-${res.status}`,
        ms: Date.now() - t0,
      });
    } catch (err) {
      attempts.push({
        kind: "fetch",
        ok: false,
        error: String((err as Error)?.message || err),
        ms: Date.now() - t0,
      });
    }
  }

  return attempts;
}

export function pickBestTransport(attempts: TransportAttempt[]): TransportKind {
  const ok = attempts.find((a) => a.ok);
  return ok?.kind ?? "fetch";
}

/**
 * Open a session on the first working transport.
 * Fetch session uses POST JSON streaming-friendly body.
 */
export async function openAdaptiveTransport(
  opts: AdaptiveTransportOptions,
): Promise<TransportSession> {
  const attempts = await probeTransports(opts);
  const kind = pickBestTransport(attempts);

  if (kind === "webtransport" && opts.webTransportUrl && hasWebTransport()) {
    const WT = (globalThis as { WebTransport?: new (url: string) => {
      ready: Promise<void>;
      close: () => void;
      createUnidirectionalStream: () => Promise<WritableStream<Uint8Array>>;
    } }).WebTransport!;
    const transport = new WT(opts.webTransportUrl);
    await transport.ready;
    return {
      kind: "webtransport",
      async send(payload) {
        const { encodeUtf8Copy } = await import("@/lib/text-codec");
        const bytes = encodeUtf8Copy(JSON.stringify(payload));
        const stream = await transport.createUnidirectionalStream();
        const writer = stream.getWriter();
        await writer.write(bytes);
        await writer.close();
      },
      close() {
        try {
          transport.close();
        } catch {
          /* ignore */
        }
      },
    };
  }

  if (kind === "websocket" && opts.wsUrl && hasWebSocket()) {
    const ws = await new Promise<WebSocket>((resolve, reject) => {
      const sock = new WebSocket(opts.wsUrl!);
      sock.onopen = () => resolve(sock);
      sock.onerror = () => reject(new Error("ws-open-failed"));
    });
    return {
      kind: "websocket",
      async send(payload) {
        ws.send(JSON.stringify(payload));
      },
      close() {
        try {
          ws.close();
        } catch {
          /* ignore */
        }
      },
    };
  }

  // HTTP/2-friendly Fetch fallback — uninterrupted sync path
  return {
    kind: "fetch",
    async send(payload) {
      const { pooledFetch } = await import("@/lib/fetch-pool");
      const res = await pooledFetch(opts.httpUrl, {
        method: "POST",
        headers: { "content-type": "application/json", ...(opts.fetchInit?.headers || {}) },
        body: JSON.stringify(payload),
        ...opts.fetchInit,
        timeoutMs: opts.probeTimeoutMs ?? 8_000,
      });
      if (!res.ok) throw new Error(`fetch-sync-${res.status}`);
    },
    close() {
      /* stateless */
    },
  };
}

/**
 * Sync a reading-progress payload with automatic transport fallback.
 * Failures fall through transports until one succeeds or all fail.
 */
export async function syncWithTransportFallback(
  payload: unknown,
  opts: AdaptiveTransportOptions,
): Promise<{ kind: TransportKind; ok: boolean; attempts: TransportAttempt[] }> {
  const order = opts.prefer ?? DEFAULT_ORDER;
  const attempts: TransportAttempt[] = [];

  for (const kind of order) {
    const t0 = Date.now();
    try {
      const session = await openAdaptiveTransport({
        ...opts,
        prefer: [kind],
      });
      if (session.kind !== kind && kind !== "fetch") {
        session.close();
        attempts.push({ kind, ok: false, error: "skipped", ms: Date.now() - t0 });
        continue;
      }
      await session.send(payload);
      session.close();
      attempts.push({ kind: session.kind, ok: true, ms: Date.now() - t0 });
      return { kind: session.kind, ok: true, attempts };
    } catch (err) {
      attempts.push({
        kind,
        ok: false,
        error: String((err as Error)?.message || err),
        ms: Date.now() - t0,
      });
    }
  }

  return { kind: "fetch", ok: false, attempts };
}
