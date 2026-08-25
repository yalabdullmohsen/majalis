import { useLayoutEffect, type RefObject } from "react";
import {
  MUSHAF_FIT_MIN_PX,
  assertMushafPageFontReady,
  getCachedFontSize,
  isMushafPageFontReady,
  mushafUniformFitCacheKey,
  normalizeMushafFontFamily,
  fitPageFontSize,
  resolveUniformMushafFontSize,
  setCachedFontSize,
  MUSHAF_FIT_MAX_PX,
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

/**
 * يضبط مقياس الخط من هندسة الحاوية فقط — نفس الحجم لكل الصفحات عند نفس العرض.
 * لا قياس لمحتوى الأسطر ولا shrink حسب الصفحة (سبب اختلاف ١٢٦/١٢٧/١٢٨).
 */
export function fitMushafPageFont(
  pageEl: HTMLElement,
  opts: { family?: string; pageNumber?: number } = {},
): number {
  const body = pageEl.querySelector<HTMLElement>(".mm-page__body");
  const containerPx = Math.round(body?.clientWidth || pageEl.clientWidth || 0);
  const blockHeightPx = Math.round(body?.clientHeight || 0);
  const family = normalizeMushafFontFamily(opts.family || readFamily(pageEl, "qpc-v2"));
  const pageNumber = opts.pageNumber ?? Number(pageEl.getAttribute?.("data-page") || 0);

  if (!containerPx) {
    applySize(pageEl, MUSHAF_FIT_MIN_PX);
    return MUSHAF_FIT_MIN_PX;
  }

  assertMushafPageFontReady(family);

  const key = mushafUniformFitCacheKey(containerPx, blockHeightPx, family);
  const geo = resolveUniformMushafFontSize(containerPx, blockHeightPx);
  const lines = [...pageEl.querySelectorAll<HTMLElement>(".mm-ayah-line, .mm-basmala")]
    .map((el) => (el.textContent ?? "").replace(/\s+/g, ""))
    .filter(Boolean);

  let contentCap = geo;
  if (lines.length > 0) {
    try {
      contentCap = fitPageFontSize(lines, containerPx, family, undefined, {
        maxPx: MUSHAF_FIT_MAX_PX,
        blockHeightPx: blockHeightPx || undefined,
        lineCount: Math.max(lines.length, pageNumber <= 2 ? lines.length : 15),
      });
    } catch {
      contentCap = MUSHAF_FIT_MIN_PX;
    }
  }

  /** سقف الصفحة الحالية ∩ الهندسة، ثم تخزين موحّد لا يزيد أبدًا (تصغير مشترك فقط). */
  let size = Math.min(geo, contentCap);
  const cached = getCachedFontSize(key);
  if (cached != null) size = Math.min(cached, size);
  size = Math.max(MUSHAF_FIT_MIN_PX, Math.min(MUSHAF_FIT_MAX_PX, size));

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

    const natural = line.scrollWidth;
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

    line.dataset.fill = maxGap <= MUSHAF_WORD_GAP_HARD_MAX_PX + 0.5 ? "true" : "false";
  }
}

export function useMushafPageFontFit(
  pageRef: RefObject<HTMLElement | null>,
  ready: boolean,
  pageNumber: number,
  fontFamily: string,
  _selectedVerseKey: string | null = null,
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
      const geom = `${width}x${height}`;
      if (!force && geom === lastGeom) return;
      lastGeom = geom;
      const family = normalizeMushafFontFamily(fontFamily);
      if (isMushafPageFontReady(family)) {
        applyFit(node, family);
        return;
      }
      markFit(node, false);
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

    // إطار أول بلا قياس ديناميكي — أخفِ النص (data-mm-fit=0) حتى fonts + هندسة مستقرة.
    markFit(el, false);
    let firstFrameId = 0;
    firstFrameId = requestAnimationFrame(() => {
      firstFrameId = requestAnimationFrame(() => {
        if (!cancelled) run(true);
      });
    });
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => run(false)) : null;
    ro?.observe(el);
    const onOrient = () => {
      lastGeom = "";
      run(true);
    };
    window.addEventListener("orientationchange", onOrient);
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    fonts?.addEventListener?.("loadingdone", onOrient);
    return () => {
      cancelled = true;
      cancelAnimationFrame(firstFrameId);
      ro?.disconnect();
      window.removeEventListener("orientationchange", onOrient);
      fonts?.removeEventListener?.("loadingdone", onOrient);
    };
  }, [ready, pageRef, pageNumber, fontFamily]);
}

export { isMushafPageFontReady };
