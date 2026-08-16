import { useLayoutEffect, type RefObject } from "react";

const MIN_PX = 13;
const MAX_ITERS = 14;

/**
 * يضبط --mm-qpc-size على صفحة المصحف حتى لا تفيض الأسطر أفقياً ولا تُقصّ الشبكة عمودياً.
 * بلا transform/scale على الحاوية — تغيير حجم الخط فقط.
 */
export function fitMushafPageFont(pageEl: HTMLElement): void {
  pageEl.style.removeProperty("--mm-qpc-size");
  const probe =
    pageEl.querySelector<HTMLElement>(".mm-ayah-line") ||
    pageEl.querySelector<HTMLElement>(".mm-basmala");
  let size = probe ? parseFloat(getComputedStyle(probe).fontSize) || 20 : 20;
  const body = pageEl.querySelector<HTMLElement>(".mm-page__body");

  for (let i = 0; i < MAX_ITERS; i++) {
    pageEl.style.setProperty("--mm-qpc-size", `${size}px`);
    let overflowX = false;
    for (const line of pageEl.querySelectorAll<HTMLElement>(".mm-ayah-line, .mm-basmala")) {
      if (line.scrollWidth > line.clientWidth + 1) {
        overflowX = true;
        break;
      }
    }
    const overflowY = Boolean(body && body.scrollHeight > body.clientHeight + 2);
    if (!overflowX && !overflowY) return;
    if (size <= MIN_PX) return;
    size = Math.max(MIN_PX, size - 1);
  }
}

/** مفتاح إعادة الملاءمة — رقم الصفحة + الخط + حالة التحديد */
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

    const run = () => fitMushafPageFont(el);
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
