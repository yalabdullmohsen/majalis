import { useLayoutEffect, type RefObject } from "react";
import {
  MUSHAF_FIT_MIN_PX,
  assertMushafPageFontReady,
  getCachedFontSize,
  isMushafPageFontReady,
  isMushafOpeningPage,
  mushafOpeningFitCacheKey,
  mushafUniformFitCacheKey,
  normalizeMushafFontFamily,
  fitPageFontSize,
  resolveOpeningMushafFontSize,
  resolveUniformMushafFontSize,
  setCachedFontSize,
  MUSHAF_FIT_MAX_PX,
  MUSHAF_FIT_OPENING_MAX_PX,
} from "./fitPageFontSize";
import {
  MUSHAF_LINE_FILL_RATIO,
  MUSHAF_WORD_GAP_HARD_MAX_PX,
} from "./layout-bands";

function readFamily(pageEl: HTMLElement, fallback: string): string {
  try {
    const fromVar = pageEl.style?.getPropertyValue?.("--mm-qpc-family")?.trim().replace(/['"]/g, "");
    if (fromVar) return fromVar;
  } catch {
    /* عنصر اختبار بلا style كامل */
  }
  try {
    const computed = getComputedStyle(pageEl)
      .getPropertyValue("--mm-qpc-family")
      .trim()
      .replace(/['"]/g, "");
    if (computed) return computed;
  } catch {
    /* عنصر غير موصول */
  }
  return normalizeMushafFontFamily(fallback);
}

function applySize(pageEl: HTMLElement, size: number): void {
  pageEl.style.setProperty("--mm-qpc-size", `${size}px`);
  pageEl.style.setProperty("--mushaf-font-size", `${size}px`);
}

function readPageNumber(pageEl: HTMLElement, fallback = 0): number {
  const raw = pageEl.getAttribute?.("data-page");
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** حجم هندسي فوري (كاش أو حساب) بلا قياس محتوى — يمنع قفزة الإطار الأول. */
function applyGeometrySizeHint(pageEl: HTMLElement, familyHint: string, pageNumber = 0): boolean {
  const body = pageEl.querySelector<HTMLElement>(".mm-page__body");
  const containerPx = Math.round(body?.clientWidth || pageEl.clientWidth || 0);
  const blockHeightPx = Math.round(body?.clientHeight || 0);
  if (!containerPx) return false;
  const family = normalizeMushafFontFamily(familyHint || readFamily(pageEl, "qpc-v2"));
  const page = pageNumber || readPageNumber(pageEl);
  const opening = isMushafOpeningPage(page);
  const maxPx = opening ? MUSHAF_FIT_OPENING_MAX_PX : MUSHAF_FIT_MAX_PX;
  const key = opening
    ? mushafOpeningFitCacheKey(page, containerPx, blockHeightPx)
    : mushafUniformFitCacheKey(containerPx, blockHeightPx, family);
  const cached = getCachedFontSize(key);
  const geo = opening
    ? resolveOpeningMushafFontSize(containerPx, blockHeightPx, 8)
    : resolveUniformMushafFontSize(containerPx, blockHeightPx);
  const size = Math.max(
    MUSHAF_FIT_MIN_PX,
    Math.min(maxPx, cached != null ? Math.min(cached, geo) : geo),
  );
  applySize(pageEl, size);
  return true;
}

/**
 * يضبط مقياس الخط من هندسة الحاوية.
 * الصفحات العادية: حجم موحّد عند نفس العرض.
 * صفحتا الافتتاح (١–٢): قياس مستقل لأكبر حجم ممكن بلا قص.
 */
export function fitMushafPageFont(
  pageEl: HTMLElement,
  opts: { family?: string; pageNumber?: number } = {},
): number {
  const body = pageEl.querySelector<HTMLElement>(".mm-page__body");
  const containerPx = Math.round(body?.clientWidth || pageEl.clientWidth || 0);
  const blockHeightPx = Math.round(body?.clientHeight || 0);
  const family = normalizeMushafFontFamily(opts.family || readFamily(pageEl, "qpc-v2"));
  const pageNumber = opts.pageNumber ?? readPageNumber(pageEl);
  const opening = isMushafOpeningPage(pageNumber);
  const maxPx = opening ? MUSHAF_FIT_OPENING_MAX_PX : MUSHAF_FIT_MAX_PX;

  if (!containerPx) {
    applySize(pageEl, MUSHAF_FIT_MIN_PX);
    return MUSHAF_FIT_MIN_PX;
  }

  assertMushafPageFontReady(family);

  const lines = [...pageEl.querySelectorAll<HTMLElement>(".mm-ayah-line, .mm-basmala")]
    .map((el) => (el.textContent ?? "").replace(/\s+/g, ""))
    .filter(Boolean);

  const lineCount = opening
    ? Math.max(lines.length, 1)
    : Math.max(lines.length, 15);

  const key = opening
    ? mushafOpeningFitCacheKey(pageNumber, containerPx, blockHeightPx)
    : mushafUniformFitCacheKey(containerPx, blockHeightPx, family);

  const geo = opening
    ? resolveOpeningMushafFontSize(containerPx, blockHeightPx, lineCount)
    : resolveUniformMushafFontSize(containerPx, blockHeightPx);

  let contentCap = geo;
  if (lines.length > 0) {
    try {
      contentCap = fitPageFontSize(lines, containerPx, family, undefined, {
        maxPx,
        blockHeightPx: blockHeightPx || undefined,
        lineCount,
      });
    } catch {
      contentCap = MUSHAF_FIT_MIN_PX;
    }
  }

  /** سقف الصفحة الحالية ∩ الهندسة؛ للافتتاح كاش مستقل لا يضغطه صفحات كثيفة. */
  let size = Math.min(geo, contentCap);
  const cached = getCachedFontSize(key);
  if (cached != null) size = Math.min(cached, size);
  size = Math.max(MUSHAF_FIT_MIN_PX, Math.min(maxPx, size));

  applySize(pageEl, size);
  setCachedFontSize(key, size);
  return size;
}

async function waitPageFont(fontFamily: string): Promise<string> {
  const family = normalizeMushafFontFamily(fontFamily);
  if (typeof document === "undefined" || !document.fonts) {
    throw new Error(`الخط ${family} لم يُحمَّل`);
  }
  const spec = `16px "${family}"`;
  await document.fonts.load(spec);
  await document.fonts.ready;
  if (!document.fonts.check(spec) && !document.fonts.check(`16px ${family}`)) {
    throw new Error(`الخط ${family} لم يُحمَّل`);
  }
  return family;
}

/** ضبط justify للأسطر دون تغيير حجم الخط — الأسطر القصيرة تُوسَّط بلا تمديد. */
function measureLineContentWidth(line: HTMLElement): number {
  const wordEls = [...line.querySelectorAll<HTMLElement>(".mm-ayah-line__word")];
  if (wordEls.length === 0) return line.scrollWidth;
  // overflow-x:clip يُخفي الفيض عن scrollWidth — نقيس من حدود الكلمات الفعلية
  const rects = wordEls.map((w) => w.getBoundingClientRect());
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  const span = right - left;
  return span > 0 ? span : line.scrollWidth;
}

function applyLineFillRules(live: HTMLElement): void {
  const lines = [...live.querySelectorAll<HTMLElement>(".mm-ayah-line")];
  // قياس العرض الطبيعي دائمًا بوضع التعبئة معطّلًا (مركز + فجوة ثابتة)
  for (const line of lines) {
    line.dataset.fill = "false";
  }
  for (const line of lines) {
    if (line.dataset.centered === "true") {
      line.dataset.fill = "false";
      continue;
    }
    const avail = line.clientWidth;
    if (!avail) {
      line.dataset.fill = "false";
      continue;
    }

    const natural = measureLineContentWidth(line);
    const ratio = natural / avail;
    if (ratio < MUSHAF_LINE_FILL_RATIO) {
      line.dataset.fill = "false";
      continue;
    }

    // جرّب التوزيع المتوازن ثم ارفضه إن تجاوزت فجوة الكلمات الحد الصلب
    line.dataset.fill = "true";
    const wordEls = [...line.querySelectorAll<HTMLElement>(".mm-ayah-line__word")];
    if (wordEls.length < 2) {
      line.dataset.fill = "false";
      continue;
    }
    const rects = wordEls.map((w) => w.getBoundingClientRect());
    rects.sort((a, b) => a.left - b.left);

    let maxGap = 0;
    for (let i = 0; i < rects.length - 1; i++) {
      const a = rects[i]!;
      const b = rects[i + 1]!;
      const gap = b.left - a.right;
      if (gap > maxGap) maxGap = gap;
    }

    // على العروض الضيّقة (iPhone) سقف أدنى قليلًا لتقليل التمزّق البصري
    const hardMax =
      avail < 360 ? MUSHAF_WORD_GAP_HARD_MAX_PX - 4 : MUSHAF_WORD_GAP_HARD_MAX_PX;
    line.dataset.fill = maxGap <= hardMax + 0.5 ? "true" : "false";
  }
}

export function useMushafPageFontFit(
  pageRef: RefObject<HTMLElement | null>,
  ready: boolean,
  pageNumber: number,
  fontFamily: string,
): void {
  useLayoutEffect(() => {
    if (!ready) return;
    const el = pageRef.current;
    if (!el) return;
    let cancelled = false;
    let lastGeom = "";

    const markFit = (node: HTMLElement, ok: boolean) => {
      node.dataset.mmFit = ok ? "1" : "0";
    };

    const applyFit = (node: HTMLElement, family: string) => {
      try {
        fitMushafPageFont(node, { family, pageNumber });
        markFit(node, true);
      } catch (err) {
        if (import.meta.env.DEV) console.error(err);
        node.style.setProperty("--mm-qpc-size", `${MUSHAF_FIT_MIN_PX}px`);
        markFit(node, true);
      }
      requestAnimationFrame(() => {
        if (cancelled || !pageRef.current) return;
        applyLineFillRules(pageRef.current);
      });
    };

    const run = (force: boolean) => {
      if (cancelled) return;
      const node = pageRef.current;
      if (!node) return;
      const body = node.querySelector<HTMLElement>(".mm-page__body");
      const width = Math.round(body?.clientWidth || node.clientWidth || 0);
      const height = Math.round(body?.clientHeight || 0);
      if (!width) {
        /* بلا عرض بعد — أبقِ ظاهرًا بحجم أدنى بدل إخفاء يسبب قفزة عند التقليب */
        applySize(node, MUSHAF_FIT_MIN_PX);
        markFit(node, true);
        return;
      }
      /* الصفحات العادية: العرض فقط — فتح الشيت/الرصيف لا يعيد قياس الخط.
         صفحتا الافتتاح تعتمد على الارتفاع لهندسة خاصة. */
      const opening = isMushafOpeningPage(pageNumber);
      const geom = opening ? `${width}x${height}` : `w${width}`;
      if (!force && geom === lastGeom) return;
      lastGeom = geom;
      const family = normalizeMushafFontFamily(fontFamily);
      applyGeometrySizeHint(node, family, pageNumber);
      markFit(node, true);
      if (isMushafPageFontReady(family)) {
        applyFit(node, family);
        return;
      }
      void waitPageFont(fontFamily)
        .then((loadedFamily) => {
          if (cancelled || !pageRef.current) return;
          applyFit(pageRef.current, loadedFamily);
        })
        .catch((err) => {
          if (import.meta.env.DEV) console.error(err);
          if (pageRef.current) {
            pageRef.current.style.setProperty("--mm-qpc-size", `${MUSHAF_FIT_MIN_PX}px`);
            markFit(pageRef.current, true);
          }
        });
    };

    /* إطار أول متزامن: حجم هندسي + إظهار فوري — بلا إخفاء ولا انتظار إطارَين */
    applyGeometrySizeHint(el, fontFamily, pageNumber);
    markFit(el, true);
    run(true);
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => run(false)) : null;
    ro?.observe(el);
    const onOrient = () => {
      lastGeom = "";
      run(true);
    };
    window.addEventListener("orientationchange", onOrient);
    const vv = window.visualViewport;
    /* resize فقط — scroll من visualViewport كان يعيد القياس أثناء التقليب فيقفز النص */
    const onVv = () => {
      lastGeom = "";
      run(true);
    };
    vv?.addEventListener("resize", onVv);
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    fonts?.addEventListener?.("loadingdone", onOrient);
    return () => {
      cancelled = true;
      ro?.disconnect();
      window.removeEventListener("orientationchange", onOrient);
      vv?.removeEventListener("resize", onVv);
      fonts?.removeEventListener?.("loadingdone", onOrient);
    };
  }, [ready, pageRef, pageNumber, fontFamily]);
}

export { isMushafPageFontReady };
