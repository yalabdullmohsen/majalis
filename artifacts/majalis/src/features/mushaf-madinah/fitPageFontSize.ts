/**
 * ملاءمة حجم خط الصفحة على قماش (canvas) — بلا إعادة تدفق DOM.
 * المفتاح: (page, containerWidth, family)
 */

export type MeasureTextFn = (fontPx: number, text: string, family: string) => number;

const MIN_PX = 12;
const MAX_PX = 40;
const LS_KEY = "mushaf-fitPageFontSize-v1";

const mem = new Map<string, number>();

function defaultMeasure(fontPx: number, text: string, family: string): number {
  if (typeof document === "undefined") return text.length * fontPx * 0.55;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return text.length * fontPx * 0.55;
  ctx.font = `${fontPx}px "${family}"`;
  return ctx.measureText(text).width;
}

export function mushafFitCacheKey(page: number, containerWidth: number, family: string): string {
  return `${page}|${Math.round(containerWidth)}|${family}`;
}

export function getCachedFontSize(key: string): number | null {
  const hit = mem.get(key);
  if (typeof hit === "number") return hit;
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const v = obj[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      mem.set(key, v);
      return v;
    }
  } catch {
    /* تخزين محظور أو تالف */
  }
  return null;
}

export function setCachedFontSize(key: string, size: number): void {
  mem.set(key, size);
  try {
    if (typeof localStorage === "undefined") return;
    const raw = localStorage.getItem(LS_KEY);
    const obj = (raw ? JSON.parse(raw) : {}) as Record<string, number>;
    obj[key] = size;
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch {
    /* تجاهل */
  }
}

/** أكبر حجم خط لا يتجاوز فيه أعرض سطر عرض الحاوية. */
export function fitPageFontSize(
  lines: string[],
  containerPx: number,
  family: string,
  measure: MeasureTextFn = defaultMeasure,
): number {
  if (containerPx <= 0 || lines.length === 0) return MIN_PX;
  let lo = MIN_PX;
  let hi = MAX_PX;
  let best = MIN_PX;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const widest = Math.max(...lines.map((l) => measure(mid, l, family)));
    if (widest <= containerPx) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}
