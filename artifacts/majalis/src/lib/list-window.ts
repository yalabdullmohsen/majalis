/**
 * Virtual list window math — DOM recycling without layout changes.
 * Consumers slice data arrays; no CSS / Tailwind involved.
 */

export type ListWindow = {
  /** Inclusive start index into the full list */
  start: number;
  /** Exclusive end index */
  end: number;
  /** Items currently in the window */
  length: number;
  /** Spacer before window (item count) — for absolute positioning consumers */
  beforeCount: number;
  /** Spacer after window */
  afterCount: number;
};

/**
 * Compute a stable overscan window around the visible range.
 * `scrollTop` / `viewportHeight` / `itemHeight` in px.
 */
export function computeListWindow(opts: {
  total: number;
  scrollTop: number;
  viewportHeight: number;
  itemHeight: number;
  overscan?: number;
}): ListWindow {
  const total = Math.max(0, Math.floor(opts.total));
  const itemHeight = Math.max(1, opts.itemHeight);
  const overscan = Math.max(0, opts.overscan ?? 6);
  const viewport = Math.max(0, opts.viewportHeight);
  const scrollTop = Math.max(0, opts.scrollTop);

  if (total === 0) {
    return { start: 0, end: 0, length: 0, beforeCount: 0, afterCount: 0 };
  }

  const firstVisible = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(viewport / itemHeight) + 1;
  const start = Math.max(0, firstVisible - overscan);
  const end = Math.min(total, firstVisible + visibleCount + overscan);
  return {
    start,
    end,
    length: Math.max(0, end - start),
    beforeCount: start,
    afterCount: Math.max(0, total - end),
  };
}

/** Slice an array using a computed window (immutable). */
export function sliceWindowed<T>(items: readonly T[], win: ListWindow): T[] {
  return items.slice(win.start, win.end);
}
