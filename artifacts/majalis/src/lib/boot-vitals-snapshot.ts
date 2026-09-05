/**
 * لقطة Web Vitals بعد استقرار الهيكل — للمقارنة قبل/بعد إصلاحات الإقلاع.
 * لا يغيّر الواجهة؛ يسجّل فقط في console (dev) و RUM عند التوفر.
 */
import { isAppShellStable, whenAppShellStable } from "@/lib/app-shell-stability";

export type BootVitalsSnapshot = {
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  tbtApprox: number | null;
  atMs: number;
};

const CLS_TARGET = 0.03;
const TBT_TARGET = 100;

function paintMs(name: string): number | null {
  try {
    const entries = performance.getEntriesByName(name, "paint");
    const last = entries[entries.length - 1];
    return last ? Math.round(last.startTime) : null;
  } catch {
    return null;
  }
}

function latestLcp(): number | null {
  try {
    const entries = performance.getEntriesByType("largest-contentful-paint");
    const last = entries[entries.length - 1] as PerformanceEntry | undefined;
    return last ? Math.round(last.startTime) : null;
  } catch {
    return null;
  }
}

function clsScore(): number | null {
  try {
    let cls = 0;
    const entries = performance.getEntriesByType("layout-shift") as Array<
      PerformanceEntry & { value?: number; hadRecentInput?: boolean }
    >;
    for (const e of entries) {
      if (e.hadRecentInput) continue;
      cls += e.value ?? 0;
    }
    return Number(cls.toFixed(4));
  } catch {
    return null;
  }
}

/** تقريب TBT من long tasks خلال أول 5s بعد FCP */
function approxTbt(): number | null {
  try {
    const fcp = paintMs("first-contentful-paint") ?? 0;
    const windowEnd = fcp + 5_000;
    let tbt = 0;
    const tasks = performance.getEntriesByType("longtask") as PerformanceEntry[];
    for (const t of tasks) {
      if (t.startTime > windowEnd) continue;
      const blocking = Math.max(0, t.duration - 50);
      tbt += blocking;
    }
    return Math.round(tbt);
  } catch {
    return null;
  }
}

export function collectBootVitalsSnapshot(): BootVitalsSnapshot {
  return {
    fcp: paintMs("first-contentful-paint"),
    lcp: latestLcp(),
    cls: clsScore(),
    tbtApprox: approxTbt(),
    atMs: Math.round(performance.now()),
  };
}

export function logBootVitalsSnapshot(label = "startup-shell"): BootVitalsSnapshot {
  const snap = collectBootVitalsSnapshot();
  const okCls = snap.cls == null || snap.cls <= CLS_TARGET;
  const okTbt = snap.tbtApprox == null || snap.tbtApprox < TBT_TARGET;
  try {
    console.info(`[boot-vitals:${label}]`, {
      ...snap,
      targets: { cls: CLS_TARGET, tbt: TBT_TARGET },
      pass: { cls: okCls, tbt: okTbt },
    });
  } catch {
    /* ignore */
  }
  return snap;
}

/** بعد استقرار الهيكل — لقطة واحدة للإقلاع */
export function scheduleBootVitalsSnapshot(): () => void {
  if (typeof window === "undefined") return () => undefined;
  if (isAppShellStable()) {
    const t = window.setTimeout(() => logBootVitalsSnapshot("after-shell-stable"), 800);
    return () => window.clearTimeout(t);
  }
  return whenAppShellStable(() => {
    window.setTimeout(() => logBootVitalsSnapshot("after-shell-stable"), 800);
  }, 700);
}
