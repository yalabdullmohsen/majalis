import { useLayoutEffect, type RefObject } from "react";

const MIN_PX = 12;
const STEP = 0.25;
const WORD_GAP_MAX_PX = 18;

type FitOpts = {
  /** صفحات الافتتاح تستخدم نطاقاً رأسياً أضيق */
  opening?: boolean;
};

function lineOverflows(line: HTMLElement): boolean {
  return line.scrollWidth > line.clientWidth + 1;
}

function bodyOverflows(body: HTMLElement | null): boolean {
  return !!body && body.scrollHeight > body.clientHeight + 2;
}

/**
 * بعد أقصى مقياس آمن: أغلق فجوة السطر بـ word-spacing فقط (سقف ١٨px).
 * ممنوع letter-spacing — يفك اتصال الحروف العربية.
 */
function stretchLines(pageEl: HTMLElement): void {
  for (const line of pageEl.querySelectorAll<HTMLElement>(".mm-ayah-line")) {
    if (line.classList.contains("mm-ayah-line--centered") || line.dataset.centered === "1") {
      line.style.removeProperty("word-spacing");
      continue;
    }
    line.style.removeProperty("word-spacing");
    const slack = line.clientWidth - line.scrollWidth;
    if (slack <= 2) continue;
    const words = line.querySelectorAll(".mm-ayah-line__word, .mm-ayah-hit--end");
    const gaps = Math.max(1, words.length - 1);
    const perGap = Math.min(WORD_GAP_MAX_PX, slack / gaps);
    if (perGap > 0.25) line.style.wordSpacing = `${perGap.toFixed(2)}px`;
  }
}

/**
 * ملاءمة مقياس خط الصفحة ببحث ثنائي بدقة 0.25px.
 * يمنع التجاوز الأفقي والبتر الرأسي دون transform/scale على الحاوية.
 */
export function fitMushafPageFont(pageEl: HTMLElement, opts: FitOpts = {}): number {
  pageEl.style.removeProperty("--mm-qpc-size");
  for (const line of pageEl.querySelectorAll<HTMLElement>(".mm-ayah-line, .mm-basmala")) {
    line.style.removeProperty("word-spacing");
  }
  const probe =
    pageEl.querySelector<HTMLElement>(".mm-ayah-line") ||
    pageEl.querySelector<HTMLElement>(".mm-basmala");
  const cssSize = probe ? parseFloat(getComputedStyle(probe).fontSize) || 20 : 20;
  const body = pageEl.querySelector<HTMLElement>(".mm-page__body");
  const loBound = MIN_PX;
  const hiBound = Math.max(cssSize + 8, opts.opening ? 28 : 36);

  const overflows = (size: number): boolean => {
    pageEl.style.setProperty("--mm-qpc-size", `${size}px`);
    for (const line of pageEl.querySelectorAll<HTMLElement>(".mm-ayah-line, .mm-basmala")) {
      if (lineOverflows(line)) return true;
    }
    return bodyOverflows(body);
  };

  let lo: number;
  let hi: number;
  if (overflows(cssSize)) {
    lo = loBound;
    hi = cssSize;
  } else {
    let grow = cssSize;
    while (grow + STEP <= hiBound && !overflows(grow + STEP)) {
      grow += STEP;
    }
    lo = grow;
    hi = Math.min(hiBound, grow + STEP);
  }

  let best = lo;
  while (hi - lo > STEP / 2) {
    const mid = Math.round(((lo + hi) / 2) * 4) / 4;
    if (overflows(mid)) {
      hi = mid - STEP;
    } else {
      best = mid;
      lo = mid + STEP;
    }
  }
  while (best > loBound && overflows(best)) best -= STEP;
  pageEl.style.setProperty("--mm-qpc-size", `${best}px`);
  stretchLines(pageEl);

  const stillOverflow =
    [...pageEl.querySelectorAll<HTMLElement>(".mm-ayah-line, .mm-basmala")].some(lineOverflows) ||
    bodyOverflows(body);

  if (stillOverflow) {
    const detail = {
      scrollHeight: body?.scrollHeight,
      clientHeight: body?.clientHeight,
    };
    if (import.meta.env.DEV) {
      throw new Error(`[mushaf] ink overflow after fit ${JSON.stringify(detail)}`);
    }
    console.error("[mushaf] ink overflow after fit", detail);
  }

  return best;
}

export function useMushafPageFontFit(
  pageRef: RefObject<HTMLElement | null>,
  ready: boolean,
  pageNumber: number,
  fontFamily: string,
  selectedVerseKey: string | null,
): void {
  useLayoutEffect(() => {
    if (!ready) return;
    const el = pageRef.current;
    if (!el) return;
    const opening = pageNumber === 1 || pageNumber === 2;
    const run = () => {
      try {
        fitMushafPageFont(el, { opening });
      } catch (err) {
        if (import.meta.env.DEV) console.error(err);
      }
    };
    run();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(run) : null;
    ro?.observe(el);
    window.addEventListener("orientationchange", run);
    return () => {
      ro?.disconnect();
      window.removeEventListener("orientationchange", run);
    };
  }, [ready, pageRef, pageNumber, fontFamily, selectedVerseKey]);
}
