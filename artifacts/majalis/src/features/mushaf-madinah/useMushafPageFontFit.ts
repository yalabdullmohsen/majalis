import { useLayoutEffect, type RefObject } from "react";
import {
  MUSHAF_FIT_MAX_PX,
  MUSHAF_FIT_MIN_PX,
  assertMushafPageFontReady,
  fitPageFontSize,
  getCachedFontSize,
  isMushafPageFontReady,
  mushafFitCacheKey,
  normalizeMushafFontFamily,
  setCachedFontSize,
} from "./fitPageFontSize";
import { MUSHAF_INK_X_END_MIN, MUSHAF_WORD_GAP_HARD_MAX_PX } from "./layout-bands";

function lineOverflows(line: HTMLElement): boolean {
  return line.scrollWidth > line.clientWidth + 1;
}

function bodyOverflows(body: HTMLElement | null): boolean {
  return !!body && body.scrollHeight > body.clientHeight + 2;
}

function pageOverflows(pageEl: HTMLElement): boolean {
  return pageEl.scrollWidth > pageEl.clientWidth + 1;
}

/** كشف تراكب الحبر خارج خانة السطر (overflow المرئي لا يزيد scrollHeight). */
function slotInkOverflows(pageEl: HTMLElement): boolean {
  for (const slot of pageEl.querySelectorAll<HTMLElement>(".mm-slot")) {
    const kind = slot.getAttribute("data-kind");
    if (kind === "empty") continue;
    const slotBox = slot.getBoundingClientRect();
    if (slotBox.height < 2) continue;
    for (const ink of slot.querySelectorAll<HTMLElement>(
      ".mm-ayah-line, .mm-basmala, .mm-surah-frame",
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
  if (pageOverflows(pageEl)) return true;
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
  return normalizeMushafFontFamily(fallback);
}

function applySize(pageEl: HTMLElement, size: number): void {
  pageEl.style.setProperty("--mm-qpc-size", `${size}px`);
}

function shrinkUntilFit(pageEl: HTMLElement, body: HTMLElement | null, start: number): number {
  let size = start;
  applySize(pageEl, size);
  while (size > MUSHAF_FIT_MIN_PX && overflowsConstraints(pageEl, body)) {
    size -= 1;
    applySize(pageEl, size);
  }
  return size;
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
  const blockHeightPx = Math.round(body?.clientHeight || 0);
  const lines = collectLineStrings(pageEl);
  const family = normalizeMushafFontFamily(opts.family || readFamily(pageEl, "qpc-v2"));
  const pageNumber = opts.pageNumber ?? Number(pageEl.getAttribute?.("data-page") || 0);

  if (!containerPx || lines.length === 0) {
    applySize(pageEl, MUSHAF_FIT_MIN_PX);
    return MUSHAF_FIT_MIN_PX;
  }

  assertMushafPageFontReady(family);

  const key = mushafFitCacheKey(pageNumber, containerPx, family);
  const cached = getCachedFontSize(key);
  let size: number;
  try {
    size =
      cached ??
      fitPageFontSize(lines, containerPx, family, undefined, {
        maxPx: MUSHAF_FIT_MAX_PX,
        blockHeightPx: blockHeightPx || undefined,
        lineCount: Math.max(lines.length, pageNumber <= 2 ? lines.length : 15),
      });
  } catch (err) {
    if (import.meta.env.DEV) console.error("[mushaf] fit failed", err);
    size = MUSHAF_FIT_MIN_PX;
  }

  size = shrinkUntilFit(pageEl, body, size);
  setCachedFontSize(key, size);

  if (overflowsConstraints(pageEl, body) && import.meta.env.DEV) {
    console.error("[mushaf] ink overflow after canvas fit", {
      pageNumber,
      size,
      containerPx,
      fontReady: isMushafPageFontReady(family),
    });
  }

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
      void waitPageFont(fontFamily)
        .then((family) => {
          if (cancelled || !pageRef.current) return;
          try {
            fitMushafPageFont(pageRef.current, { family, pageNumber });
          } catch (err) {
            if (import.meta.env.DEV) console.error(err);
            pageRef.current.style.setProperty("--mm-qpc-size", `${MUSHAF_FIT_MIN_PX}px`);
          }
          requestAnimationFrame(() => {
            if (cancelled || !pageRef.current) return;
            const live = pageRef.current;
            const liveBody = live.querySelector<HTMLElement>(".mm-page__body");
            const current = Number.parseFloat(live.style.getPropertyValue("--mm-qpc-size")) || MUSHAF_FIT_MIN_PX;
            const next = shrinkUntilFit(live, liveBody, current);
            setCachedFontSize(mushafFitCacheKey(pageNumber, width, family), next);

            // ضبط justify مشروط:
            // - نقيّد space-between (data-fill=true) فقط للأسطر التي امتلاؤها قريب من المرجع.
            // - ثم نتحقق فعلياً من max word-gap عبر bbox حتى لا ينتج over-justification يتجاوز hardMax.
            const lines = [...live.querySelectorAll<HTMLElement>(".mm-ayah-line")];
            for (const line of lines) {
              if (line.dataset.centered === "true") continue;
              // نبدأ بـ flex-start (لا نطبّق space-between) قبل القياس.
              line.dataset.fill = "false";
            }
            for (const line of lines) {
              if (line.dataset.centered === "true") continue;
              const avail = line.clientWidth;
              if (!avail) continue;

              const natural = line.scrollWidth;
              const ratio = natural / avail;

              // إذا لم يصل naturalWidth للعتبة، نتركها flex-start.
              if (ratio < MUSHAF_INK_X_END_MIN) {
                line.dataset.fill = "false";
                continue;
              }

              // جرّب space-between ثم احسب max word-gap فعلياً من bbox.
              line.dataset.fill = "true";
              const wordEls = [...line.querySelectorAll<HTMLElement>(".mm-ayah-line__word")];
              const rects = wordEls.map((w) => w.getBoundingClientRect());
              rects.sort((a, b) => a.left - b.left);

              let maxGap = 0;
              for (let i = 0; i < rects.length - 1; i++) {
                const a = rects[i]!;
                const b = rects[i + 1]!;
                const gap = b.left - a.right;
                if (gap > maxGap) maxGap = gap;
              }

              const shouldFill = maxGap <= MUSHAF_WORD_GAP_HARD_MAX_PX + 0.5;
              line.dataset.fill = shouldFill ? "true" : "false";
            }
          });
        })
        .catch((err) => {
          if (import.meta.env.DEV) console.error(err);
          if (pageRef.current) {
            pageRef.current.style.setProperty("--mm-qpc-size", `${MUSHAF_FIT_MIN_PX}px`);
          }
        });
    };

    run(true);
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => run(false)) : null;
    ro?.observe(el);
    const onOrient = () => {
      lastWidth = -1;
      run(true);
    };
    window.addEventListener("orientationchange", onOrient);
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    fonts?.addEventListener?.("loadingdone", onOrient);
    return () => {
      cancelled = true;
      ro?.disconnect();
      window.removeEventListener("orientationchange", onOrient);
      fonts?.removeEventListener?.("loadingdone", onOrient);
    };
  }, [ready, pageRef, pageNumber, fontFamily, selectedVerseKey]);
}
