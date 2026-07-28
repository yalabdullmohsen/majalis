/**
 * Supervised Web Worker bridge — auto-restarts crashed workers and
 * re-issues pending request/response tasks without failing the UI.
 * Logic-only — no UI.
 */

export type WorkerFactory = () => Worker;

export type SupervisedWorkerOptions = {
  name?: string;
  /** Max automatic restarts per session (default 5). */
  maxRestarts?: number;
  /** ms to wait before restart (default 250). */
  restartDelayMs?: number;
};

type Pending = {
  id: number;
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
  payload: unknown;
  type: string;
};

let nextId = 1;

/**
 * Wrap a Worker factory with crash detection, restart, and pending replay.
 */
export class SupervisedWorker {
  private factory: WorkerFactory;
  private worker: Worker | null = null;
  private opts: Required<SupervisedWorkerOptions>;
  private restarts = 0;
  private pending = new Map<number, Pending>();
  private disposed = false;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(factory: WorkerFactory, opts: SupervisedWorkerOptions = {}) {
    this.factory = factory;
    this.opts = {
      name: opts.name ?? "worker",
      maxRestarts: opts.maxRestarts ?? 5,
      restartDelayMs: opts.restartDelayMs ?? 250,
    };
    this.spawn();
  }

  private spawn(): void {
    if (this.disposed) return;
    try {
      this.worker?.terminate();
    } catch {
      /* ignore */
    }
    const w = this.factory();
    this.worker = w;
    w.onmessage = (ev: MessageEvent) => this.onMessage(ev);
    w.onerror = () => this.onCrash("error");
    w.onmessageerror = () => this.onCrash("messageerror");
  }

  private onMessage(ev: MessageEvent): void {
    const data = ev.data as { id?: number; ok?: boolean; result?: unknown; error?: string } | null;
    if (!data || typeof data.id !== "number") return;
    const p = this.pending.get(data.id);
    if (!p) return;
    this.pending.delete(data.id);
    if (data.ok) p.resolve(data.result);
    else p.reject(new Error(data.error || `${this.opts.name} task failed`));
  }

  private onCrash(reason: string): void {
    if (this.disposed) return;
    if (this.restarts >= this.opts.maxRestarts) {
      for (const p of this.pending.values()) {
        p.reject(new Error(`${this.opts.name} crashed (${reason}) and restart budget exhausted`));
      }
      this.pending.clear();
      return;
    }
    this.restarts += 1;
    if (this.restartTimer) clearTimeout(this.restartTimer);
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      this.spawn();
      // Re-issue in-flight tasks
      for (const p of this.pending.values()) {
        this.postRaw(p.id, p.type, p.payload);
      }
    }, this.opts.restartDelayMs);
  }

  private postRaw(id: number, type: string, payload: unknown): void {
    try {
      this.worker?.postMessage({ id, type, payload });
    } catch {
      this.onCrash("postMessage");
    }
  }

  /** Request/response over the worker with auto-retry across restarts. */
  request<T>(type: string, payload: unknown, timeoutMs = 15_000): Promise<T> {
    if (this.disposed) return Promise.reject(new Error(`${this.opts.name} disposed`));
    const id = nextId++;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${this.opts.name} timeout: ${type}`));
      }, timeoutMs);
      this.pending.set(id, {
        id,
        type,
        payload,
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v as T);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      this.postRaw(id, type, payload);
    });
  }

  get restartCount(): number {
    return this.restarts;
  }

  terminate(): void {
    this.disposed = true;
    if (this.restartTimer) clearTimeout(this.restartTimer);
    for (const p of this.pending.values()) {
      p.reject(new Error(`${this.opts.name} terminated`));
    }
    this.pending.clear();
    try {
      this.worker?.terminate();
    } catch {
      /* ignore */
    }
    this.worker = null;
  }
}

/** Test helper — simulate a flaky worker factory. */
export function createCountingWorkerFactory(
  handler: (msg: { id: number; type: string; payload: unknown }) => unknown,
  opts?: { failFirstN?: number },
): WorkerFactory {
  let fails = opts?.failFirstN ?? 0;
  return () => {
    // Minimal in-process fake Worker for Node tests
    const listeners: { message?: (ev: MessageEvent) => void; error?: () => void } = {};
    const fake = {
      postMessage(data: { id: number; type: string; payload: unknown }) {
        if (fails > 0) {
          fails -= 1;
          queueMicrotask(() => listeners.error?.());
          return;
        }
        queueMicrotask(() => {
          try {
            const result = handler(data);
            listeners.message?.({ data: { id: data.id, ok: true, result } } as MessageEvent);
          } catch (err) {
            listeners.message?.({
              data: { id: data.id, ok: false, error: String((err as Error)?.message || err) },
            } as MessageEvent);
          }
        });
      },
      terminate() {
        /* noop */
      },
      set onmessage(fn: ((ev: MessageEvent) => void) | null) {
        listeners.message = fn ?? undefined;
      },
      set onerror(fn: (() => void) | null) {
        listeners.error = fn ?? undefined;
      },
      set onmessageerror(_fn: (() => void) | null) {
        /* noop */
      },
    };
    return fake as unknown as Worker;
  };
}
