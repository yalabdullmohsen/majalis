/**
 * Intent-based speculative prefetch — warm routes/JSON in the 100–300ms
 * window before click/tap completes (hover, touchstart, focus).
 * Logic-only — no UI/CSS.
 */

import { preconnectOrigin, prewarmTextApis, prewarmUrl } from "@/lib/resource-prewarm";

export type SpeculativePrefetchOptions = {
  /** Min dwell before prefetch fires (ms). Default 100. */
  minIntentMs?: number;
  /** Cancel if pointer leaves before this (ms). Default 300. */
  maxIntentMs?: number;
  /** Root to observe. Default document. */
  root?: ParentNode | null;
};

const warmedRoutes = new Set<string>();
const warmedJson = new Set<string>();

/** Map pathname → low-priority JSON / dynamic import warmers. */
export function resolvePrefetchTargets(href: string): {
  path: string;
  jsonUrls: string[];
  importFactories: Array<() => Promise<unknown>>;
} {
  let path = href;
  try {
    const u = new URL(href, typeof location !== "undefined" ? location.origin : "https://local");
    path = u.pathname;
  } catch {
    /* keep raw */
  }

  const jsonUrls: string[] = [];
  const importFactories: Array<() => Promise<unknown>> = [];

  // Surah / mushaf
  const mushafPage = /^\/mushaf\/page\/(\d+)/.exec(path);
  const mushafSurah = /^\/mushaf\/(\d+)/.exec(path);
  if (mushafPage) {
    const n = mushafPage[1];
    jsonUrls.push(`/data/quran-v2/page-${n}.json`);
    importFactories.push(() => import("@/views/MushafPageView"));
  } else if (mushafSurah) {
    const n = mushafSurah[1];
    jsonUrls.push(`/data/quran/surah-${n}.json`);
    importFactories.push(() => import("@/views/MushafPageView"));
  } else if (path.startsWith("/quran") || path === "/quran-hub") {
    importFactories.push(() => import("@/views/QuranHubPage"));
    jsonUrls.push("/data/quran/surah-list.json");
  }

  // Fiqh chapters
  if (path.startsWith("/fiqh")) {
    importFactories.push(() => import("@/views/FiqhPage"));
    if (/^\/fiqh\/[^/]+/.test(path)) {
      importFactories.push(() => import("@/views/FiqhTopicPage"));
    }
  }

  // Matn / library volumes
  if (path.startsWith("/library") || path.startsWith("/matn") || path.startsWith("/books")) {
    importFactories.push(() => import("@/views/LibraryPage"));
    if (/^\/library\/[^/]+/.test(path)) {
      importFactories.push(() => import("@/views/LibraryDetailPage"));
    }
  }

  // Hadith feeds
  if (path.startsWith("/hadith")) {
    importFactories.push(() => import("@/views/HadithPage"));
  }

  return { path, jsonUrls, importFactories };
}

export function speculativePrefetchHref(href: string): void {
  const { path, jsonUrls, importFactories } = resolvePrefetchTargets(href);
  if (!path || path === "/") return;

  prewarmTextApis();

  if (!warmedRoutes.has(path)) {
    warmedRoutes.add(path);
    for (const factory of importFactories) {
      void factory().catch(() => undefined);
    }
  }

  for (const url of jsonUrls) {
    if (warmedJson.has(url)) continue;
    warmedJson.add(url);
    try {
      const abs = new URL(url, typeof location !== "undefined" ? location.origin : "https://local");
      preconnectOrigin(abs.origin);
      prewarmUrl(abs.href, { mode: "same-origin" });
    } catch {
      prewarmUrl(url, { mode: "same-origin" });
    }
  }
}

function closestNavAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  const a = target.closest("a[href]") as HTMLAnchorElement | null;
  if (!a) return null;
  const href = a.getAttribute("href") || "";
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return null;
  }
  // Same-origin relative or absolute
  try {
    const u = new URL(href, location.origin);
    if (u.origin !== location.origin) return null;
  } catch {
    return null;
  }
  return a;
}

/**
 * Document-level intent observer — attach once from app bootstrap.
 * Returns dispose function.
 */
export function startSpeculativePrefetchObserver(
  opts: SpeculativePrefetchOptions = {},
): () => void {
  if (typeof document === "undefined") return () => undefined;

  const minIntentMs = opts.minIntentMs ?? 100;
  const maxIntentMs = opts.maxIntentMs ?? 300;
  const root: ParentNode = opts.root ?? document;

  const timers = new WeakMap<HTMLAnchorElement, number>();

  const arm = (a: HTMLAnchorElement) => {
    const existing = timers.get(a);
    if (existing != null) window.clearTimeout(existing);
    const href = a.getAttribute("href") || a.href;
    const t = window.setTimeout(() => {
      timers.delete(a);
      speculativePrefetchHref(href);
    }, minIntentMs);
    timers.set(a, t);
    // Hard cancel window
    window.setTimeout(() => {
      const cur = timers.get(a);
      if (cur === t) {
        window.clearTimeout(t);
        timers.delete(a);
      }
    }, maxIntentMs + 50);
  };

  const disarm = (a: HTMLAnchorElement) => {
    const t = timers.get(a);
    if (t != null) {
      window.clearTimeout(t);
      timers.delete(a);
    }
  };

  const onPointerOver = (ev: Event) => {
    const a = closestNavAnchor(ev.target);
    if (a) arm(a);
  };
  const onPointerOut = (ev: Event) => {
    const a = closestNavAnchor(ev.target);
    if (a) disarm(a);
  };
  const onTouchStart = (ev: Event) => {
    const a = closestNavAnchor(ev.target);
    if (a) arm(a);
  };
  const onFocusIn = (ev: Event) => {
    const a = closestNavAnchor(ev.target);
    if (a) arm(a);
  };

  root.addEventListener("pointerover", onPointerOver, { passive: true, capture: true });
  root.addEventListener("pointerout", onPointerOut, { passive: true, capture: true });
  root.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
  root.addEventListener("focusin", onFocusIn, { capture: true });

  return () => {
    root.removeEventListener("pointerover", onPointerOver, true);
    root.removeEventListener("pointerout", onPointerOut, true);
    root.removeEventListener("touchstart", onTouchStart, true);
    root.removeEventListener("focusin", onFocusIn, true);
  };
}

export function clearSpeculativePrefetchStateForTests(): void {
  warmedRoutes.clear();
  warmedJson.clear();
}
