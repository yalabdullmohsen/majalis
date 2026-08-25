/**
 * Zero-Crash — عزل self-healing لكل async/sync/worker/native bridge.
 * لا يُنهي التطبيق ولا يجمّد الواجهة؛ يُسجّل بصمت ويُعيد fallback.
 */
import { scheduleNonCriticalWork } from "@/lib/power-saver-engine";

export type GuardResult<T> =
  | { ok: true; value: T }
  | { ok: false; recovered: true; reason: string };

let globalInstalled = false;

function logSilent(scope: string, err: unknown): void {
  try {
    if (import.meta.env?.DEV) {
      console.warn(`[sovereign:guard] ${scope}:`, err);
    }
  } catch {
    /* ignore — node test env */
  }
}

/** ينفّذ sync بلا رمي — يُعيد fallback عند أي استثناء. */
export function guardSync<T>(fn: () => T, fallback: T, scope = "sync"): T {
  try {
    return fn();
  } catch (err) {
    logSilent(scope, err);
    return fallback;
  }
}

/** ينفّذ async بلا رمي — يُعيد fallback عند أي استثناء. */
export async function guardAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  scope = "async",
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    logSilent(scope, err);
    return fallback;
  }
}

/** يلفّ worker message handler — يمنع crash من رسالة فاسدة. */
export function guardWorkerHandler(
  handler: (data: unknown) => void,
): (ev: MessageEvent) => void {
  return (ev: MessageEvent) => {
    guardSync(() => handler(ev.data), undefined, "worker");
  };
}

/** يلفّ Promise<void> للـ native bridge — لا reject للواجهة. */
export function guardNativeBridge(p: Promise<unknown>, scope = "native"): void {
  void p.catch((err) => logSilent(scope, err));
}

const RECOVERABLE = new Set([
  "ChunkLoadError",
  "AbortError",
  "TimeoutError",
]);

function isRecoverableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return true;
  const name = "name" in err ? String((err as { name: string }).name) : "";
  if (RECOVERABLE.has(name)) return true;
  const msg = "message" in err ? String((err as { message: string }).message) : "";
  return /loading chunk|network|fetch|timeout|abort/i.test(msg);
}

/**
 * يركّب معالجات window error / unhandledrejection — مرة واحدة.
 * يمنع propagation للأخطاء القابلة للاسترداد.
 */
export function installZeroCrashGuards(): void {
  if (globalInstalled || typeof window === "undefined") return;
  globalInstalled = true;

  window.addEventListener(
    "error",
    (ev) => {
      if (!isRecoverableError(ev.error ?? ev.message)) return;
      logSilent("window.error", ev.error ?? ev.message);
      ev.preventDefault();
    },
    true,
  );

  window.addEventListener("unhandledrejection", (ev) => {
    if (!isRecoverableError(ev.reason)) return;
    logSilent("unhandledrejection", ev.reason);
    ev.preventDefault();
  });

  scheduleNonCriticalWork(() => {
    guardSync(
      () => {
        document.documentElement.dataset.zeroCrash = "armed";
      },
      undefined,
      "zero-crash-mark",
    );
  });
}

export function resetZeroCrashGuardsForTests(): void {
  globalInstalled = false;
}
