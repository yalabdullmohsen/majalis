/**
 * علامات أداء إقلاع — Development فقط.
 * لا تُعرض للمستخدم · لا تغيّر سلوك الإنتاج · لا تُضيف Delay.
 *
 * الاستخدام: markStartup("startup:js-start") في نقاط الإقلاع المعتمدة.
 */
export const STARTUP_MARKS = [
  "startup:native-end",
  "startup:js-start",
  "startup:root-mounted",
  "startup:theme-ready",
  "startup:fonts-ready",
  "startup:session-ready",
  "startup:cache-ready",
  "startup:shell-ready",
  "startup:content-ready",
  "startup:stable",
] as const;

export type StartupMarkName = (typeof STARTUP_MARKS)[number];

function isDevStartupInstrumentation(): boolean {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return true;
  } catch {
    /* ignore */
  }
  try {
    if (typeof window !== "undefined" && (window as unknown as { __SUNNAH_STARTUP_MARKS__?: boolean }).__SUNNAH_STARTUP_MARKS__) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** يسجّل performance.mark في DEV فقط — آمِن عند غياب Performance API. */
export function markStartup(name: StartupMarkName): void {
  if (!isDevStartupInstrumentation()) return;
  try {
    if (typeof performance === "undefined" || typeof performance.mark !== "function") return;
    performance.mark(name);
  } catch {
    /* ignore */
  }
}

/** يقيس مدة بين علامتين (DEV فقط). */
export function measureStartup(
  measureName: string,
  startMark: StartupMarkName,
  endMark: StartupMarkName,
): number | null {
  if (!isDevStartupInstrumentation()) return null;
  try {
    if (typeof performance === "undefined" || typeof performance.measure !== "function") return null;
    performance.measure(measureName, startMark, endMark);
    const entries = performance.getEntriesByName(measureName, "measure");
    const last = entries[entries.length - 1];
    return last ? last.duration : null;
  } catch {
    return null;
  }
}

/** لقطة جاهزية للتقرير التشخيصي (DEV/Admin فقط). */
export function readStartupMarksSnapshot(): Array<{ name: string; startTime: number }> {
  if (typeof performance === "undefined" || typeof performance.getEntriesByType !== "function") {
    return [];
  }
  try {
    return performance
      .getEntriesByType("mark")
      .filter((e) => e.name.startsWith("startup:"))
      .map((e) => ({ name: e.name, startTime: e.startTime }));
  } catch {
    return [];
  }
}
