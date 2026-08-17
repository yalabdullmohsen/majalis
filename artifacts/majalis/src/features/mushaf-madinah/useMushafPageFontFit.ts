import { useLayoutEffect, type RefObject } from "react";
import {
  fitPageFontSize,
  getCachedFontSize,
  mushafFitCacheKey,
  setCachedFontSize,
} from "./fitPageFontSize";

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
 * فحص لاحق واحد بعد ملاءمة القماش — ليس بحثًا ثنائيًا على DOM.
 */
function overflowsConstraints(pageEl: HTMLElement, body: HTMLElement | null): boolean {
  for (const line of pageEl.querySelectorAll<HTMLElement>(".mm-ayah-line, .mm-basmala")) {
    if (lineOverflows(line)) return true;
  }
  if (bodyOverflows(body)) return true;
  if (slotInkOverflows(pageEl)) return true;
  return false;
}

function collectLineStrings(pageEl: HTMLElement): string[] {
  return [...pageEl.querySelectorAll<HTMLElement>(".mm-ayah-line, .mm-basmala")]
    .map((el) => (el.textContent ?? "").replace(/\s+/g, ""))
    .filter(Boolean);
}

function readFamily(pageEl: HTMLElement, fallback: string): string {
  try {
    const fromVar = pageEl.style?.getPropertyValue?.("--mm-qpc-family")?.trim().replace(/['"]/g, "");
    if (fromVar) return fromVar;
  } catch {
    /* عنصر اختبار بلا style كامل */
  }
  try {
    const computed = getComputedStyle(pageEl).getPropertyValue("--mm-qpc-family").trim().replace(/['"]/g, "");
    if (computed) return computed;
  } catch {
    /* عنصر غير موصول */
  }
  return fallback;
}

/**
 * ملاءمة مقياس خط الصفحة ببحث ثنائي على canvas (لا على DOM).
 * يمنع التجاوز الأفقي دون transform/scale على الحاوية.
 */
export function fitMushafPageFont(
  pageEl: HTMLElement,
  opts: { family?: string; pageNumber?: number } = {},
): number {
  const body = pageEl.querySelector<HTMLElement>(".mm-page__body");
  const containerPx = Math.round(body?.clientWidth || pageEl.clientWidth || 0);
  const lines = collectLineStrings(pageEl);
  const family = opts.family || readFamily(pageEl, "qpc-v2");
  const pageNumber = opts.pageNumber ?? Number(pageEl.getAttribute?.("data-page") || 0);

  if (!containerPx || lines.length === 0) {
    pageEl.style.setProperty("--mm-qpc-size", "12px");
    return 12;
  }

  const key = mushafFitCacheKey(pageNumber, containerPx, family);
  const cached = getCachedFontSize(key);
  const opening = pageNumber === 1 || pageNumber === 2;
  const size = cached ?? fitPageFontSize(lines, containerPx, family, undefined, opening ? 56 : 40);
  if (cached == null) setCachedFontSize(key, size);
  pageEl.style.setProperty("--mm-qpc-size", `${size}px`);

  if (overflowsConstraints(pageEl, body) && import.meta.env.DEV) {
    console.error("[mushaf] ink overflow after canvas fit", {
      pageNumber,
      size,
      containerPx,
    });
  }

  return size;
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
    let cancelled = false;
    let lastWidth = -1;

    const run = (force: boolean) => {
      if (cancelled) return;
      const node = pageRef.current;
      if (!node) return;
      const body = node.querySelector<HTMLElement>(".mm-page__body");
      const width = Math.round(body?.clientWidth || node.clientWidth || 0);
      if (!force && width === lastWidth) return;
      lastWidth = width;
      void waitPageFont(fontFamily).then(() => {
        if (cancelled || !pageRef.current) return;
        try {
          fitMushafPageFont(pageRef.current, { family: fontFamily, pageNumber });
        } catch (err) {
          if (import.meta.env.DEV) console.error(err);
        }
      });
    };

    run(true);
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => run(false))
        : null;
    ro?.observe(el);
    const onOrient = () => {
      lastWidth = -1;
      run(true);
    };
    window.addEventListener("orientationchange", onOrient);
    return () => {
      cancelled = true;
      ro?.disconnect();
      window.removeEventListener("orientationchange", onOrient);
    };
  }, [ready, pageRef, pageNumber, fontFamily, selectedVerseKey]);
}
