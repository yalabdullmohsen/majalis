/**
 * Virtualized text scroll-anchor stability — preserve scroll position across
 * DOM chunk recycling without touching CSS / Tailwind / layout classes.
 * Logic-only.
 */

export type ScrollAnchorSnapshot = {
  scrollY: number;
  scrollHeight: number;
  anchorTop: number | null;
};

function scrollRoot(): Element | null {
  if (typeof document === "undefined") return null;
  return document.scrollingElement || document.documentElement;
}

/** Capture window scroll + optional anchor element top (for chunk recycle). */
export function captureScrollAnchor(anchorEl?: Element | null): ScrollAnchorSnapshot {
  const root = scrollRoot();
  const scrollY = typeof window !== "undefined" ? window.scrollY || window.pageYOffset || 0 : 0;
  const scrollHeight = root?.scrollHeight ?? 0;
  let anchorTop: number | null = null;
  if (anchorEl && typeof (anchorEl as HTMLElement).getBoundingClientRect === "function") {
    try {
      anchorTop = (anchorEl as HTMLElement).getBoundingClientRect().top;
    } catch {
      anchorTop = null;
    }
  }
  return { scrollY, scrollHeight, anchorTop };
}

/**
 * Restore scroll so the user's reading position does not jump when adjacent
 * text chunks mount/unmount on high-refresh-rate displays.
 */
export function restoreScrollAnchor(
  before: ScrollAnchorSnapshot,
  anchorEl?: Element | null,
): void {
  if (typeof window === "undefined") return;

  const apply = () => {
    if (anchorEl && before.anchorTop != null) {
      try {
        const nowTop = (anchorEl as HTMLElement).getBoundingClientRect().top;
        const delta = nowTop - before.anchorTop;
        if (Math.abs(delta) > 0.5) {
          window.scrollTo({ top: window.scrollY + delta, left: 0, behavior: "instant" as ScrollBehavior });
          return;
        }
      } catch {
        /* fall through */
      }
    }

    const root = scrollRoot();
    const afterHeight = root?.scrollHeight ?? before.scrollHeight;
    const growth = afterHeight - before.scrollHeight;
    // Content appended below: keep scrollY. Content inserted above: compensate.
    if (growth !== 0 && before.scrollY > 0) {
      // Prefer absolute lock to previous scrollY unless growth is above viewport
      window.scrollTo({ top: before.scrollY, left: 0, behavior: "instant" as ScrollBehavior });
    } else {
      window.scrollTo({ top: before.scrollY, left: 0, behavior: "instant" as ScrollBehavior });
    }
  };

  // Double-rAF: first frame applies DOM, second settles layout on 120Hz screens
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      requestAnimationFrame(apply);
    });
  } else {
    apply();
  }
}

/**
 * Run a state update that may recycle DOM nodes while keeping scroll stable.
 * `mutate` should be synchronous (e.g. setState scheduler kick).
 */
export function withScrollAnchorStability(
  mutate: () => void,
  anchorEl?: Element | null,
): void {
  const snap = captureScrollAnchor(anchorEl);
  mutate();
  restoreScrollAnchor(snap, anchorEl);
}

/**
 * Compute whether a scroll jump would exceed the flicker threshold (px).
 * Used by tests / monitors — pure.
 */
export function scrollJumpExceeded(
  beforeY: number,
  afterY: number,
  thresholdPx = 2,
): boolean {
  return Math.abs(afterY - beforeY) > thresholdPx;
}
