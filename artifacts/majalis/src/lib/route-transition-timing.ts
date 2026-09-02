/** قياس مدة انتقال المسار — للمراقبة الداخلية فقط (RUM). */
let lastStartMs = 0;
let lastPath = "";

export function recordRouteTransitionStart(path: string): void {
  lastStartMs = performance.now();
  lastPath = path;
}

export function recordRouteTransitionEnd(path: string): number | null {
  if (!lastStartMs || lastPath !== path) return null;
  const ms = Math.round(performance.now() - lastStartMs);
  lastStartMs = 0;
  lastPath = "";
  return ms;
}

export function peekLastRouteTransitionMs(): number | null {
  if (!lastStartMs) return null;
  return Math.round(performance.now() - lastStartMs);
}
