/**
 * Vector graphic (SVG) & font-glyph memory lifecycle cleanup.
 * Forces release of detached SVG subtrees / icon nodes after view switches.
 * Logic-only — no CSS/DOM visual structure changes for live UI.
 */

const pendingDetach: Set<Element> = new Set();
let flushScheduled = false;

function scheduleFlush(): void {
  if (flushScheduled) return;
  flushScheduled = true;
  const run = () => {
    flushScheduled = false;
    flushDetachedVectors();
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(run, { timeout: 1_200 });
  } else {
    setTimeout(run, 0);
  }
}

/**
 * Remove all child nodes from an SVG/container that is no longer mounted,
 * then drop references so the GC can reclaim path data / glyph outlines.
 */
export function detachVectorSubtree(root: Element | null | undefined): void {
  if (!root) return;
  try {
    // Only clean if already detached from document
    if (root.isConnected) {
      pendingDetach.add(root);
      scheduleFlush();
      return;
    }
    while (root.firstChild) {
      root.removeChild(root.firstChild);
    }
    if (typeof (root as SVGElement).innerHTML === "string") {
      try {
        (root as SVGElement).innerHTML = "";
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

/** Queue a live node for cleanup once it becomes disconnected. */
export function scheduleVectorCleanup(root: Element | null | undefined): void {
  if (!root) return;
  pendingDetach.add(root);
  scheduleFlush();
}

/** Process queued nodes — safe to call repeatedly. */
export function flushDetachedVectors(): number {
  let cleaned = 0;
  for (const el of [...pendingDetach]) {
    if (el.isConnected) continue;
    pendingDetach.delete(el);
    try {
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
      cleaned += 1;
    } catch {
      pendingDetach.delete(el);
    }
  }
  // Drop connected nodes that stayed mounted — stop tracking
  for (const el of [...pendingDetach]) {
    if (el.isConnected) pendingDetach.delete(el);
  }
  return cleaned;
}

/**
 * Wrap a dynamic SVG render host: on unmount/view switch, detach vectors.
 * Usage from hooks: const cleanup = trackSvgHost(ref.current); return cleanup;
 */
export function trackSvgHost(host: Element | null | undefined): () => void {
  if (!host) return () => undefined;
  return () => {
    scheduleVectorCleanup(host);
    // Immediate attempt if already detached
    if (!host.isConnected) detachVectorSubtree(host);
  };
}

/**
 * Best-effort release of Object URLs / ImageBitmap used for calligraphy layers.
 */
export function revokeGraphicResources(urls: Array<string | null | undefined>): void {
  for (const u of urls) {
    if (!u || !u.startsWith("blob:")) continue;
    try {
      URL.revokeObjectURL(u);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Hint: drop unused document fonts that match page-prefixed families
 * (e.g. qpc-page-*) when far from current page — caller supplies family list.
 */
export function releaseFontFaces(families: string[]): number {
  if (typeof document === "undefined" || !document.fonts) return 0;
  let removed = 0;
  try {
    const toDelete: FontFace[] = [];
    document.fonts.forEach((face) => {
      if (families.includes(face.family) || families.includes(`"${face.family}"`)) {
        toDelete.push(face);
      }
    });
    for (const face of toDelete) {
      try {
        document.fonts.delete(face);
        removed += 1;
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
  return removed;
}

export function resetVectorCleanupForTests(): void {
  pendingDetach.clear();
  flushScheduled = false;
}
