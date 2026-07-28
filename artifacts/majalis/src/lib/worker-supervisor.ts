/**
 * Master polish — resilient Web Worker supervisor.
 * Catches crashes, restarts the worker, and re-issues the last pending task.
 * Logic-only — no UI.
 */

export type SupervisedWorkerOptions = {
  /** Worker script URL or inline source (blob). */
  source: string | (() => Worker);
  /** Max automatic restarts (default 3). */
  maxRestarts?: number;
  /** Message timeout ms (default 20000). */
  timeoutMs?: number;
};

export type SupervisedWorkerHandle = {
  post: <TReq, TRes>(msg: TReq, transfer?: Transferable[]) => Promise<TRes>;
  terminate: () => void;
  restarts: () => number;
  isAlive: () => boolean;
};

export function createSupervisedWorker(opts: SupervisedWorkerOptions): SupervisedWorkerHandle {
  const maxRestarts = opts.maxRestarts ?? 3;
  const timeoutMs = opts.timeoutMs ?? 20_000;
  let worker: Worker | null = null;
  let restarts = 0;
  let alive = false;
  let pending: {
    msg: unknown;
    transfer?: Transferable[];
    resolve: (v: unknown) => void;
    reject: (e: unknown) => void;
    timer: ReturnType<typeof setTimeout>;
  } | null = null;

  const spawn = () => {
    try {
      worker?.terminate();
    } catch {
      /* ignore */
    }
    try {
      worker =
        typeof opts.source === "function"
          ? opts.source()
          : new Worker(opts.source, { type: "classic" });
      alive = true;
      worker.onmessage = (ev) => {
        if (!pending) return;
        clearTimeout(pending.timer);
        const p = pending;
        pending = null;
        p.resolve(ev.data);
      };
      worker.onerror = () => {
        alive = false;
        void recover();
      };
      worker.onmessageerror = () => {
        alive = false;
        void recover();
      };
    } catch {
      alive = false;
      worker = null;
    }
  };

  const recover = async () => {
    if (restarts >= maxRestarts) {
      if (pending) {
        clearTimeout(pending.timer);
        pending.reject(new Error("worker-dead"));
        pending = null;
      }
      return;
    }
    restarts += 1;
    spawn();
    if (pending && worker && alive) {
      try {
        worker.postMessage(pending.msg, pending.transfer ?? []);
      } catch (err) {
        pending.reject(err);
        pending = null;
      }
    }
  };

  spawn();

  return {
    post(msg, transfer) {
      return new Promise((resolve, reject) => {
        if (!worker || !alive) {
          spawn();
        }
        if (!worker || !alive) {
          reject(new Error("worker-unavailable"));
          return;
        }
        if (pending) {
          reject(new Error("worker-busy"));
          return;
        }
        const timer = setTimeout(() => {
          pending = null;
          alive = false;
          void recover().then(() => reject(new Error("worker-timeout")));
        }, timeoutMs);
        pending = {
          msg,
          transfer,
          resolve: resolve as (v: unknown) => void,
          reject,
          timer,
        };
        try {
          worker.postMessage(msg, transfer ?? []);
        } catch (err) {
          clearTimeout(timer);
          pending = null;
          reject(err);
        }
      });
    },
    terminate() {
      if (pending) {
        clearTimeout(pending.timer);
        pending.reject(new Error("worker-terminated"));
        pending = null;
      }
      try {
        worker?.terminate();
      } catch {
        /* ignore */
      }
      worker = null;
      alive = false;
    },
    restarts: () => restarts,
    isAlive: () => alive,
  };
}
