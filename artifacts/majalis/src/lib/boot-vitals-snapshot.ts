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



export type HomeLayoutRect = {
  mainHeight: number | null;
  topChromeHeight: number | null;
  searchTop: number | null;
  sacredTop: number | null;
  dailyTop: number | null;
};

export type HomeStartupLayoutDiag = {
  firstRenderLayout: HomeLayoutRect | null;
  finalLayout: HomeLayoutRect | null;
  layoutShift: Array<{ value: number; sources: string[] }>;
  cls: number | null;
  themeApplyTime: number | null;
  fontLoadTime: number | null;
  homeDataLoadTime: number | null;
  safeAreaApplyTime: number | null;
  primaryShiftSource: string | null;
};

function rectOf(sel: string): number | null {
  try {
    const el = document.querySelector(sel);
    if (!el) return null;
    return Math.round(el.getBoundingClientRect().height);
  } catch {
    return null;
  }
}

function topOf(sel: string): number | null {
  try {
    const el = document.querySelector(sel);
    if (!el) return null;
    return Math.round(el.getBoundingClientRect().top + window.scrollY);
  } catch {
    return null;
  }
}

export function captureHomeLayoutRect(): HomeLayoutRect {
  return {
    mainHeight: rectOf("#main-content, main.app-main, .app-main"),
    topChromeHeight: rectOf(".app-top-chrome, .navbar-v3, header.navbar-v3"),
    searchTop: topOf(".hus, [role='search']"),
    sacredTop: topOf(".home-sacred-day, [data-testid='home-sacred-of-day']"),
    dailyTop: topOf(".daily-wird-card, [data-testid='daily-wird-card']"),
  };
}

function markTime(name: string): number | null {
  try {
    const marks = performance.getEntriesByName(name, "mark");
    const last = marks[marks.length - 1];
    return last ? Math.round(last.startTime) : null;
  } catch {
    return null;
  }
}

function layoutShiftBreakdown(): { shifts: HomeStartupLayoutDiag["layoutShift"]; primary: string | null } {
  const shifts: HomeStartupLayoutDiag["layoutShift"] = [];
  let primary: string | null = null;
  let best = 0;
  try {
    const entries = performance.getEntriesByType("layout-shift") as Array<
      PerformanceEntry & {
        value?: number;
        hadRecentInput?: boolean;
        sources?: Array<{ node?: Element | null }>;
      }
    >;
    for (const e of entries) {
      if (e.hadRecentInput) continue;
      const sources: string[] = [];
      for (const s of e.sources ?? []) {
        const node = s.node;
        if (!node || !(node instanceof Element)) continue;
        const id = node.id ? `#${node.id}` : "";
        const cls = typeof node.className === "string" && node.className ? `.${node.className.trim().split(/\s+/).slice(0, 3).join(".")}` : "";
        const tag = node.tagName.toLowerCase();
        sources.push(`${tag}${id}${cls}`);
      }
      const value = e.value ?? 0;
      shifts.push({ value: Number(value.toFixed(4)), sources });
      if (value > best) {
        best = value;
        primary = sources[0] ?? null;
      }
    }
  } catch {
    /* ignore */
  }
  return { shifts, primary };
}

function fontLoadTime(): number | null {
  try {
    // marks من محمّل الخطوط / splash — بلا انتظار اصطناعي
    return markTime("mj:fonts-ready") ?? markTime("fonts-ready");
  } catch {
    return null;
  }
}

/** تشخيص قفزة الرئيسية — يسجّل first/final layout وCLS ومصدر أول إزاحة */
export function collectHomeStartupLayoutDiag(
  firstRenderLayout: HomeLayoutRect | null = null,
): HomeStartupLayoutDiag {
  const { shifts, primary } = layoutShiftBreakdown();
  return {
    firstRenderLayout,
    finalLayout: captureHomeLayoutRect(),
    layoutShift: shifts,
    cls: clsScore(),
    themeApplyTime: markTime("mj:theme-applied") ?? markTime("theme-applied"),
    fontLoadTime: fontLoadTime(),
    homeDataLoadTime: markTime("mj:home-painted") ?? markTime("home-painted"),
    safeAreaApplyTime: markTime("mj:safe-area-ready") ?? markTime("safe-area-ready"),
    primaryShiftSource: primary,
  };
}

let firstHomeLayout: HomeLayoutRect | null = null;

/** التقط تخطيط أول إطار للرئيسية ثم لقطة نهائية بعد استقرار الهيكل */
export function scheduleHomeStartupLayoutDiag(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const captureFirst = () => {
    if (!firstHomeLayout) firstHomeLayout = captureHomeLayoutRect();
  };

  // أقرب فرصة بعد أول paint
  const raf = window.requestAnimationFrame(() => {
    window.requestAnimationFrame(captureFirst);
  });

  const finish = () => {
    const diag = collectHomeStartupLayoutDiag(firstHomeLayout);
    try {
      console.info("[home-startup-layout]", diag);
      (window as unknown as { __MJ_HOME_LAYOUT_DIAG__?: HomeStartupLayoutDiag }).__MJ_HOME_LAYOUT_DIAG__ = diag;
    } catch {
      /* ignore */
    }
  };

  if (isAppShellStable()) {
    const t = window.setTimeout(finish, 900);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }

  const cancelStable = whenAppShellStable(() => {
    window.setTimeout(finish, 900);
  }, 700);
  return () => {
    window.cancelAnimationFrame(raf);
    cancelStable();
  };
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
