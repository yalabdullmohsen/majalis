import { useLayoutEffect, type RefObject } from "react";
import { MUSHAF_WORD_GAP_MAX_PX } from "./layout-bands";

const MIN_PX = 12;
const STEP = 0.25;

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

/** كشف تراكب الحبر خارج خانة السطر (overflow المرئي لا يزيد scrollHeight). */
function slotInkOverflows(pageEl: HTMLElement): boolean {
  for (const slot of pageEl.querySelectorAll<HTMLElement>(".mm-slot")) {
    const kind = slot.getAttribute("data-kind");
    if (!kind || kind === "empty") continue;
    const slotBox = slot.getBoundingClientRect();
    if (slotBox.height < 2) continue;
    for (const ink of slot.querySelectorAll<HTMLElement>(
      ".mm-ayah-line, .mm-basmala, .mm-surah-ornament",
    )) {
      const box = ink.getBoundingClientRect();
      if (box.bottom > slotBox.bottom + 1.5 || box.top < slotBox.top - 1.5) return true;
    }
  }
  return false;
}

/**
 * قيد أ: أعرض سطر مرسوم ≤ العرض المتاح (overflowX === 0).
 * قيد ب: مجموع ارتفاعات الأسطر ≤ نطاق المحتوى.
 */
function overflowsConstraints(pageEl: HTMLElement, body: HTMLElement | null): boolean {
  for (const line of pageEl.querySelectorAll<HTMLElement>(".mm-ayah-line, .mm-basmala")) {
    if (lineOverflows(line)) return true;
  }
  if (bodyOverflows(body)) return true;
  if (slotInkOverflows(pageEl)) return true;
  return false;
}

/**
 * بعد أقصى مقياس آمن: أغلق فجوة السطر بـ word-spacing فقط (سقف ١٥px).
 * ممنوع letter-spacing — يفك اتصال الحروف العربية.
 */
function stretchLines(pageEl: HTMLElement): void {
  for (const line of pageEl.querySelectorAll<HTMLElement>(".mm-ayah-line")) {
    if (line.dataset.centered === "1") {
      line.style.removeProperty("word-spacing");
      continue;
    }
    line.style.removeProperty("word-spacing");
    const slack = line.clientWidth - line.scrollWidth;
    if (slack <= 2) continue;
    const words = line.querySelectorAll(".mm-ayah-line__word, .mm-ayah-hit--end");
    const gaps = Math.max(1, words.length - 1);
    const perGap = Math.min(MUSHAF_WORD_GAP_MAX_PX, slack / gaps);
    if (perGap > 0.25) line.style.wordSpacing = `${perGap.toFixed(2)}px`;
  }
}

/**
 * ملاءمة مقياس خط الصفحة ببحث ثنائي بدقة 0.25px.
 * يمنع التجاوز الأفقي والبتر الرأسي دون transform/scale على الحاوية.
 * بلا فرع برقم صفحة — القيدان أ+ب على كل الصفحات.
 */
export function fitMushafPageFont(pageEl: HTMLElement, _opts: FitOpts = {}): number {
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
  const hiBound = Math.max(cssSize + 8, 42);

  const overflows = (size: number): boolean => {
    pageEl.style.setProperty("--mm-qpc-size", `${size}px`);
    return overflowsConstraints(pageEl, body);
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

  const stillOverflow = overflowsConstraints(pageEl, body);

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

async function waitPageFont(fontFamily: string): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await document.fonts.load(`1em ${fontFamily}`);
    await document.fonts.ready;
  } catch {
    /* تجاهل — الملاءمة تستخدم المقاييس المتاحة */
  }
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
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const node = pageRef.current;
      if (!node) return;
      void waitPageFont(fontFamily).then(() => {
        if (cancelled || !pageRef.current) return;
        try {
          fitMushafPageFont(pageRef.current, { opening });
        } catch (err) {
          if (import.meta.env.DEV) console.error(err);
        }
      });
    };
    run();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(run) : null;
    ro?.observe(el);
    window.addEventListener("orientationchange", run);
    return () => {
      cancelled = true;
      ro?.disconnect();
      window.removeEventListener("orientationchange", run);
    };
  }, [ready, pageRef, pageNumber, fontFamily, selectedVerseKey]);
}
