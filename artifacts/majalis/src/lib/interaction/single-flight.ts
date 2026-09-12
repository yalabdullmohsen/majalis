/**
 * Single-flight — يمنع تنفيذ نفس الإجراء مرتين عند الضغط السريع.
 * لا يستخدم setTimeout لإحساس زائف؛ القفل يُرفع بعد انتهاء الوعد أو sync.
 */

type FlightKey = string;

const inflight = new Map<FlightKey, Promise<unknown>>();

export function isInFlight(key: FlightKey): boolean {
  return inflight.has(key);
}

export async function runSingleFlight<T>(
  key: FlightKey,
  task: () => T | Promise<T>,
): Promise<T | undefined> {
  if (inflight.has(key)) return undefined;
  const run = Promise.resolve().then(task);
  inflight.set(key, run);
  try {
    return await run;
  } finally {
    if (inflight.get(key) === run) inflight.delete(key);
  }
}

/** نسخة متزامنة للإجراءات الفورية (تنقّل / تبديل حالة) */
export function runSingleFlightSync(key: FlightKey, task: () => void): boolean {
  if (inflight.has(key)) return false;
  const marker = Promise.resolve();
  inflight.set(key, marker);
  try {
    task();
    return true;
  } finally {
    queueMicrotask(() => {
      if (inflight.get(key) === marker) inflight.delete(key);
    });
  }
}

/** للاختبارات */
export function resetSingleFlightForTests(): void {
  inflight.clear();
}
