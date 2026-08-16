/**
 * جاهزية إقلاع التطبيق — بوابات محلية سريعة بلا انتظار شبكة/API.
 * Launch Screen يختفي عند اكتمال البوابات أو عند السقف الزمني.
 */

export type LaunchGate = "theme" | "shell" | "auth" | "prayerCache";

const ALL_GATES: readonly LaunchGate[] = ["theme", "shell", "auth", "prayerCache"];

const state: Record<LaunchGate, boolean> = {
  theme: false,
  shell: false,
  auth: false,
  prayerCache: false,
};

const listeners = new Set<() => void>();

function notify(): void {
  for (const cb of listeners) {
    try {
      cb();
    } catch {
      /* ignore */
    }
  }
}

export function markLaunchGate(gate: LaunchGate): void {
  if (state[gate]) return;
  state[gate] = true;
  notify();
}

export function isLaunchGateReady(gate: LaunchGate): boolean {
  return state[gate];
}

export function isAppLaunchReady(): boolean {
  return ALL_GATES.every((g) => state[g]);
}

/** اشترك في تغيّر الجاهزية — يُستدعى فورًا إن كانت جاهزة */
export function subscribeLaunchReady(cb: () => void): () => void {
  listeners.add(cb);
  if (isAppLaunchReady()) {
    try {
      cb();
    } catch {
      /* ignore */
    }
  }
  return () => {
    listeners.delete(cb);
  };
}

/** تهيئة متزامنة عند إقلاع الصدفة — بلا صلاحيات ولا fetch */
export function bootstrapLaunchReadinessSync(): void {
  markLaunchGate("theme");
  try {
    void localStorage.getItem("majalis-prayer-cache-v2");
  } catch {
    /* private mode */
  }
  markLaunchGate("prayerCache");
  // جلسة محلية إن وُجدت — لا ننتظر Supabase/شبكة
  try {
    const keys = Object.keys(localStorage);
    void keys.some((k) => /supabase|sb-|auth/i.test(k));
  } catch {
    /* ignore */
  }
  markLaunchGate("auth");
}

/** للاختبارات فقط */
export function __resetLaunchReadinessForTests(): void {
  for (const g of ALL_GATES) state[g] = false;
  listeners.clear();
}
