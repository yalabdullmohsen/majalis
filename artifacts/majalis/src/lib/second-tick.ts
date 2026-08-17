/**
 * مؤقّت ثانية واحد على مستوى التطبيق.
 * - نبضة واحدة لكل المشتركين (لا setInterval لكل مستهلك).
 * - يتوقف عند document.hidden ويعيد المزامنة فور العودة.
 * - المستمعون يحسبون من Date.now() / الهدف — لا عدّ تراكمي هنا.
 */

export type SecondTickListener = (nowMs: number) => void;

const listeners = new Set<SecondTickListener>();
let timerId: number | null = null;
let visibilityBound = false;
let appStateUnbind: (() => void) | null = null;

function clearTimer() {
  if (timerId != null) {
    window.clearTimeout(timerId);
    timerId = null;
  }
}

function notify() {
  const now = Date.now();
  for (const listener of listeners) {
    try {
      listener(now);
    } catch {
      /* لا تُسقط باقي المشتركين */
    }
  }
}

function scheduleNext() {
  clearTimer();
  if (listeners.size === 0) return;
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    return;
  }
  timerId = window.setTimeout(() => {
    timerId = null;
    notify();
    scheduleNext();
  }, 1_000);
}

function onVisibilityChange() {
  if (typeof document === "undefined") return;
  if (document.visibilityState === "hidden") {
    clearTimer();
    return;
  }
  notify();
  scheduleNext();
}

function ensureVisibilityBinding() {
  if (visibilityBound || typeof document === "undefined") return;
  visibilityBound = true;
  document.addEventListener("visibilitychange", onVisibilityChange);

  void import("@capacitor/app")
    .then(({ App }) =>
      App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          notify();
          scheduleNext();
        } else {
          clearTimer();
        }
      }),
    )
    .then((handle) => {
      appStateUnbind = () => {
        void handle.remove();
      };
    })
    .catch(() => {
      /* ويب */
    });
}

/** للاختبارات فقط */
export function __secondTickDebug() {
  return {
    listenerCount: listeners.size,
    timerActive: timerId != null,
  };
}

/** للاختبارات فقط — يصفّر الحالة */
export function __resetSecondTickForTests() {
  clearTimer();
  listeners.clear();
  if (visibilityBound && typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }
  visibilityBound = false;
  appStateUnbind?.();
  appStateUnbind = null;
}

/**
 * اشترك في نبضة الثانية الموحّدة.
 * يُستدعى المستمع فور الاشتراك (مزامنة فورية) ثم كل ثانية أثناء الظهور.
 */
export function subscribeSecondTick(listener: SecondTickListener): () => void {
  listeners.add(listener);
  ensureVisibilityBinding();
  listener(Date.now());
  scheduleNext();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearTimer();
    }
  };
}
