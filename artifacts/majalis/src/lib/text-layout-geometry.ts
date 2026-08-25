/**
 * هندسة تخطيط النص: ارتفاع السطر، قياس مُخزَّن، وتمرير متزامن مع التلاوة.
 */
import { getPowerSaverState } from "@/lib/power-saver-engine";
import { readMemorySnapshot } from "@/lib/memory-pressure";

/** مسافة عمودية كافية للتشكيل العلوي/السفلي عند كل مقاييس الخط */
export const UTHMANI_LINE_HEIGHT_RATIO = 1.85;
export const MUSHAF_LINE_HEIGHT_RATIO = 1.85;

export function quranLineHeightPx(fontSizePx: number, ratio = UTHMANI_LINE_HEIGHT_RATIO): number {
  const size = Number.isFinite(fontSizePx) ? fontSizePx : 20;
  return size * ratio;
}

export type TextBand = { left: number; top: number; width: number; height: number };

type BandCacheEntry = {
  bands: TextBand[];
  scrollLeft: number;
  scrollTop: number;
  at: number;
};

const bandCache = new Map<string, BandCacheEntry>();
const BAND_CACHE_TTL_MS = 140;
const BAND_CACHE_MAX = 64;

export function clearTextMeasureCache(): void {
  bandCache.clear();
}

function trimBandCache(): void {
  if (bandCache.size <= BAND_CACHE_MAX) return;
  const oldest = [...bandCache.entries()].sort((a, b) => a[1].at - b[1].at);
  for (let i = 0; i < oldest.length - BAND_CACHE_MAX; i++) {
    bandCache.delete(oldest[i]![0]);
  }
}

export function getCachedTextBands(
  cacheKey: string,
  scrollLeft: number,
  scrollTop: number,
  compute: () => TextBand[],
): TextBand[] {
  const now = Date.now();
  const hit = bandCache.get(cacheKey);
  if (
    hit &&
    now - hit.at < BAND_CACHE_TTL_MS &&
    hit.scrollLeft === scrollLeft &&
    hit.scrollTop === scrollTop
  ) {
    return hit.bands;
  }
  const bands = compute();
  bandCache.set(cacheKey, { bands, scrollLeft, scrollTop, at: now });
  trimBandCache();
  return bands;
}

/** ملف تعريف أجهزة ضعيفة — يخفّض تأثيرات النص الثقيلة */
export function isLowEndTextProfile(): boolean {
  if (typeof navigator === "undefined") return false;
  try {
    const dm = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (typeof dm === "number" && dm > 0 && dm <= 2) return true;
  } catch {
    /* ignore */
  }
  if (getPowerSaverState().mode === "aggressive") return true;
  const snap = readMemorySnapshot();
  if (snap.level === "critical" || snap.level === "moderate") return true;
  if (snap.deviceMemoryGb != null && snap.deviceMemoryGb <= 3) return true;
  return false;
}

function readLineHeightPx(el: HTMLElement, fallback = 28): number {
  if (typeof window === "undefined") return fallback;
  const parsed = Number.parseFloat(window.getComputedStyle(el).lineHeight);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  const fs = Number.parseFloat(window.getComputedStyle(el).fontSize);
  if (Number.isFinite(fs) && fs > 0) return quranLineHeightPx(fs);
  return fallback;
}

/**
 * تمرير سلس يُثبت موضع الآية النشطة على شبكة ارتفاع السطر — بلا قفزات مفاجئة.
 */
export function scrollAyahIntoViewCentered(
  scroller: HTMLElement,
  target: HTMLElement,
  opts?: { lineHeightPx?: number; behavior?: ScrollBehavior },
): void {
  if (typeof window === "undefined") return;
  const lineH = opts?.lineHeightPx ?? readLineHeightPx(target);
  const scrollerRect = scroller.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const targetCenter =
    targetRect.top - scrollerRect.top + scroller.scrollTop + targetRect.height / 2;
  const viewportCenter = scroller.clientHeight / 2;
  let nextTop = targetCenter - viewportCenter;
  nextTop = Math.round(nextTop / lineH) * lineH;
  const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  nextTop = Math.min(maxScroll, Math.max(0, nextTop));
  const behavior =
    opts?.behavior ??
    (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
  scroller.scrollTo({ top: nextTop, behavior });
}
