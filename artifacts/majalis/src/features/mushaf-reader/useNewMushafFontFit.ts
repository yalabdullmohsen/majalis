import { useLayoutEffect, type RefObject } from "react";
import {
  MUSHAF_FIT_MIN_PX,
  MUSHAF_FIT_MAX_PX,
  MUSHAF_FIT_OPENING_MAX_PX,
  getCachedFontSize,
  isMushafOpeningPage,
  isMushafPageFontReady,
  mushafOpeningFitCacheKey,
  mushafUniformFitCacheKey,
  normalizeMushafFontFamily,
  resolveOpeningMushafFontSize,
  resolveUniformMushafFontSize,
  setCachedFontSize,
  fitPageFontSize,
} from "@/features/mushaf-madinah/fitPageFontSize";
import { MUSHAF_LINE_FILL_RATIO } from "@/features/mushaf-madinah/layout-bands";

function applySize(pageEl: HTMLElement, size: number): void {
  pageEl.style.setProperty("--nm-qpc-size", `${size}px`);
  pageEl.style.setProperty("--mm-qpc-size", `${size}px`);
  pageEl.style.setProperty("--mushaf-font-size", `${size}px`);
}

/** ملاءمة خط الصفحة الجديدة — يمنع وميض التكبير بعد التحميل */
export function useNewMushafFontFit(
  pageRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  pageNumber: number,
  fontFamily: string,
): void {
  useLayoutEffect(() => {
    const pageEl = pageRef.current;
    if (!pageEl || !enabled) return;

    const family = normalizeMushafFontFamily(fontFamily);
    pageEl.style.setProperty("--nm-qpc-family", `"${family}"`);
    pageEl.style.setProperty("--mm-qpc-family", `"${family}"`);
    pageEl.setAttribute("data-mm-fit", "0");

    const body = pageEl.querySelector<HTMLElement>(".nm-page__body");
    const containerPx = Math.round(body?.clientWidth || pageEl.clientWidth || 0);
    const blockHeightPx = Math.round(body?.clientHeight || pageEl.clientHeight || 0);
    if (!containerPx) return;

    const opening = isMushafOpeningPage(pageNumber);
    const maxPx = opening ? MUSHAF_FIT_OPENING_MAX_PX : MUSHAF_FIT_MAX_PX;
    const key = opening
      ? mushafOpeningFitCacheKey(pageNumber, containerPx, blockHeightPx)
      : mushafUniformFitCacheKey(containerPx, blockHeightPx, family);
    const cached = getCachedFontSize(key);
    const geo = opening
      ? resolveOpeningMushafFontSize(containerPx, blockHeightPx, 8)
      : resolveUniformMushafFontSize(containerPx, blockHeightPx);
    let size = Math.max(
      MUSHAF_FIT_MIN_PX,
      Math.min(maxPx, cached != null ? Math.min(cached, geo) : geo),
    );
    applySize(pageEl, size);

    let cancelled = false;
    const finish = (finalSize: number) => {
      if (cancelled) return;
      applySize(pageEl, finalSize);
      setCachedFontSize(key, finalSize);
      pageEl.setAttribute("data-mm-fit", "1");
    };

    const runMeasure = () => {
      if (cancelled || !isMushafPageFontReady(family)) return false;
      const lines = Array.from(pageEl.querySelectorAll<HTMLElement>(".nm-line, .nm-basmala"));
      if (lines.length === 0) {
        finish(size);
        return true;
      }
      const texts = lines.map((el) => el.textContent ?? "");
      const measured = fitPageFontSize(texts, containerPx * MUSHAF_LINE_FILL_RATIO, family, undefined, {
        maxPx,
        blockHeightPx,
        lineCount: texts.length,
      });
      size = Math.max(MUSHAF_FIT_MIN_PX, Math.min(maxPx, Math.min(size, measured)));
      applySize(pageEl, size);

      /* تقليص إضافي إن بقي overflow أفقي بعد القياس */
      for (let guard = 0; guard < 24; guard++) {
        const overflow = lines.some((el) => el.scrollWidth > el.clientWidth + 1);
        if (!overflow) break;
        size = Math.max(MUSHAF_FIT_MIN_PX, size - 1);
        applySize(pageEl, size);
      }
      finish(size);
      return true;
    };

    if (runMeasure()) return;

    let tries = 0;
    const poll = window.setInterval(() => {
      tries += 1;
      if (runMeasure() || tries > 40) {
        window.clearInterval(poll);
        if (!cancelled && pageEl.getAttribute("data-mm-fit") !== "1") finish(size);
      }
    }, 40);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [enabled, fontFamily, pageNumber, pageRef]);
}
