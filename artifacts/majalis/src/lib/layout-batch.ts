/**
 * Layout read/write batching — reduce forced synchronous layouts.
 * Keeps paint work on compositor-friendly patterns (measure then mutate).
 * Logic-only — no CSS/DOM structure changes.
 */

export type LayoutBox = {
  width: number;
  height: number;
  scrollWidth: number;
  clientWidth: number;
  clientHeight: number;
};

/** Read geometry in one shot (single forced layout per call). */
export function measureBox(el: HTMLElement): LayoutBox {
  return {
    width: el.offsetWidth,
    height: el.offsetHeight,
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    clientHeight: el.clientHeight,
  };
}

/**
 * Binary-search font size to fit width without linear thrashing.
 * Writes fontSize then reads scrollWidth — minimized iterations via caller.
 * Separates initial max probe from search.
 */
export function fitFontSizeToWidth(
  el: HTMLElement,
  containerWidth: number,
  maxPx: number,
  iterations: number,
): { size: number; centered: boolean } {
  if (containerWidth <= 0) return { size: maxPx, centered: true };
  el.style.fontSize = `${maxPx}px`;
  // One read after max probe
  if (el.scrollWidth <= containerWidth) {
    return { size: maxPx, centered: true };
  }
  let lo = 1;
  let hi = maxPx;
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    el.style.fontSize = `${mid}px`;
    if (el.scrollWidth <= containerWidth) lo = mid;
    else hi = mid;
  }
  el.style.fontSize = `${lo}px`;
  return { size: lo, centered: false };
}

/**
 * Schedule work after layout — double-rAF so style writes from previous
 * frame are committed before measuring (compositor-friendly).
 */
export function afterLayout(fn: () => void): void {
  if (typeof requestAnimationFrame !== "function") {
    setTimeout(fn, 0);
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}

/**
 * Batch: run all reads, then all writes — classic layout thrash fix.
 */
export function batchReadWrite<T>(
  read: () => T,
  write: (measured: T) => void,
): void {
  const measured = read();
  write(measured);
}
