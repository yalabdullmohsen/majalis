/**
 * ملاءمة حجم خط الصفحة على قماش (canvas) — بلا إعادة تدفق DOM.
 * المفتاح: (page, containerWidth, fontFamily) — الإصدار v2 يُبطل تخزين الانفجار.
 */

export type MeasureTextFn = (fontPx: number, text: string, family: string) => number;

export const MUSHAF_FIT_MIN_PX = 12;
export const MUSHAF_FIT_MAX_PX = 34;
export const MUSHAF_FIT_LINE_RATIO = 1.75;
const LS_KEY = "mushaf-fitPageFontSize-v2";

const mem = new Map<string, number>();

export type FitPageFontSizeOpts = {
  maxPx?: number;
  blockHeightPx?: number;
  lineCount?: number;
};

/** يزيل اقتباس CSS حتى لا يصبح canvas `24px ""qpc-v2-p2""`. */
export function normalizeMushafFontFamily(family: string): string {
  return family.replace(/^["'\s]+|["'\s]+$/g, "");
}

export function mushafFontCheckSpec(family: string): string {
  return `16px "${normalizeMushafFontFamily(family)}"`;
}

export function isMushafPageFontReady(family: string): boolean {
  if (typeof document === "undefined" || !document.fonts?.check) return true;
  const fam = normalizeMushafFontFamily(family);
  if (!fam) return false;
  try {
    return document.fonts.check(`16px "${fam}"`) || document.fonts.check(`16px ${fam}`);
  } catch {
    return false;
  }
}

export function assertMushafPageFontReady(family: string): void {
  if (typeof document === "undefined" || !document.fonts?.check) return;
  if (!isMushafPageFontReady(family)) {
    throw new Error(`الخط ${normalizeMushafFontFamily(family)} لم يُحمَّل`);
  }
}

function defaultMeasure(fontPx: number, text: string, family: string): number {
  assertMushafPageFontReady(family);
  if (typeof document === "undefined") return text.length * fontPx * 0.55;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return text.length * fontPx * 0.55;
  const fam = normalizeMushafFontFamily(family);
  ctx.font = `${fontPx}px "${fam}"`;
  return ctx.measureText(text).width;
}

/** مفتاح قديم (لكل صفحة) — يُبقى للتوافق مع اختبارات القياس التركيبية. */
export function mushafFitCacheKey(page: number, containerWidth: number, family: string): string {
  return `${page}|${Math.round(containerWidth)}|${normalizeMushafFontFamily(family)}`;
}

/**
 * مفتاح موحّد لكل صفحات المصحف عند نفس عرض/ارتفاع الحاوية.
 * يمنع اختلاف --mm-qpc-size بين صفحة وأخرى (سبب عدم تناسق ١٢٦–١٢٨).
 */
export function mushafUniformFitCacheKey(
  containerWidth: number,
  blockHeightPx: number,
  _family: string = "",
): string {
  /* الحجم موحّد من الهندسة فقط — لا نُفرّق حسب خط الصفحة (qpc-v2-pN). */
  return `uniform-v1|${Math.round(containerWidth)}|${Math.round(blockHeightPx)}`;
}

/**
 * حجم خط موحّد من هندسة الحاوية فقط — بلا قياس محتوى الصفحة.
 * ١٥ سطرًا × نسبة ارتفاع السطر، مع سقف عرض تقريبي لمصحف المدينة.
 */
export function resolveUniformMushafFontSize(
  containerWidthPx: number,
  blockHeightPx: number,
): number {
  if (containerWidthPx <= 0) return MUSHAF_FIT_MIN_PX;
  const byHeight =
    blockHeightPx > 0
      ? Math.floor(blockHeightPx / 15 / MUSHAF_FIT_LINE_RATIO)
      : MUSHAF_FIT_MAX_PX;
  /** سعة أفقية تقريبية لسطر المصحف عند مقاس التصميم */
  const byWidth = Math.floor(containerWidthPx / 19.5);
  return Math.max(
    MUSHAF_FIT_MIN_PX,
    Math.min(MUSHAF_FIT_MAX_PX, byHeight, byWidth),
  );
}

function inFitRange(v: number): boolean {
  return Number.isFinite(v) && v >= MUSHAF_FIT_MIN_PX && v <= MUSHAF_FIT_MAX_PX;
}

export function getCachedFontSize(key: string): number | null {
  const hit = mem.get(key);
  if (typeof hit === "number" && inFitRange(hit)) return hit;
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const v = obj[key];
    if (typeof v === "number" && inFitRange(v)) {
      mem.set(key, v);
      return v;
    }
  } catch {
    /* تخزين محظور أو تالف */
  }
  return null;
}

export function setCachedFontSize(key: string, size: number): void {
  if (!inFitRange(size)) return;
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

export function clearMushafFitCacheForTests(): void {
  mem.clear();
}

function resolveOpts(opts?: number | FitPageFontSizeOpts): FitPageFontSizeOpts {
  if (typeof opts === "number") return { maxPx: opts };
  return opts ?? {};
}

/** أكبر حجم خط لا يتجاوز العرض ولا ارتفاع الكتلة، داخل [12, 34]. */
export function fitPageFontSize(
  lines: string[],
  containerPx: number,
  family: string,
  measure: MeasureTextFn = defaultMeasure,
  opts?: number | FitPageFontSizeOpts,
): number {
  if (containerPx <= 0 || lines.length === 0) return MUSHAF_FIT_MIN_PX;
  const options = resolveOpts(opts);
  const cap = Math.min(
    MUSHAF_FIT_MAX_PX,
    Math.max(MUSHAF_FIT_MIN_PX, options.maxPx ?? MUSHAF_FIT_MAX_PX),
  );
  let lo = MUSHAF_FIT_MIN_PX;
  let hi = cap;
  let best = MUSHAF_FIT_MIN_PX;
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

  const lineCount = Math.max(options.lineCount ?? lines.length, 1);
  let fitByHeight = cap;
  if (typeof options.blockHeightPx === "number" && options.blockHeightPx > 0) {
    fitByHeight = Math.floor(options.blockHeightPx / lineCount / MUSHAF_FIT_LINE_RATIO);
  }
  const fontSize = Math.min(best, fitByHeight, cap);
  if (fontSize < MUSHAF_FIT_MIN_PX) {
    throw new Error("تعذّر ضبط الصفحة");
  }
  return fontSize;
}
