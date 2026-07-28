/**
 * Smart Deep-Linking Generator for Verses & Texts.
 * Encodes verse IDs / Matn line anchors into shareable URLs and
 * parses hash/query on load to navigate, scroll, and highlight.
 */

import { scrollActiveAyahIntoView } from "@/lib/quran-audio-resume";

export type DeepLinkTargetKind = "ayah" | "matn" | "adhkar";

export type DeepLinkTarget = {
  kind: DeepLinkTargetKind;
  /** Quran: surah number; Matn/Adhkar: slug or content id */
  resourceId: string;
  /** Ayah number or matn line (1-based) */
  anchor?: number;
  /** Optional adhkar/matn item id */
  itemId?: string;
};

export type ParsedDeepLink = DeepLinkTarget & {
  path: string;
  search: string;
  hash: string;
};

export type DeepLinkApplyResult = {
  ok: boolean;
  target: ParsedDeepLink | null;
  scrolled: boolean;
  highlighted: boolean;
};

const HIGHLIGHT_ATTR = "data-deep-link-highlight";
const HIGHLIGHT_CLASS = "majalis-deep-link-target";

/** Build a shareable path for a mushaf ayah. */
export function buildAyahDeepLink(surah: number, ayah: number, opts?: { useHash?: boolean }): string {
  const s = Math.max(1, Math.min(114, Math.floor(surah)));
  const a = Math.max(1, Math.floor(ayah));
  if (opts?.useHash) return `/mushaf/${s}#ayah-${a}`;
  return `/mushaf/${s}?ayah=${a}`;
}

/** Build a shareable path for a matn/article line anchor. */
export function buildMatnDeepLink(
  slugOrPath: string,
  line: number,
  opts?: { itemId?: string },
): string {
  const base = slugOrPath.startsWith("/") ? slugOrPath.split("?")[0]! : `/${slugOrPath.replace(/^\//, "")}`;
  const params = new URLSearchParams();
  if (opts?.itemId) params.set("id", opts.itemId);
  params.set("line", String(Math.max(1, Math.floor(line))));
  const q = params.toString();
  return `${base}?${q}#matn-line-${Math.max(1, Math.floor(line))}`;
}

/** Build adhkar deep link with category + item. */
export function buildAdhkarDeepLink(categorySlug: string, itemId?: string): string {
  const params = new URLSearchParams();
  if (categorySlug) params.set("cat", categorySlug);
  if (itemId) params.set("id", itemId);
  const q = params.toString();
  return q ? `/adhkar?${q}` : "/adhkar";
}

export function encodeDeepLink(target: DeepLinkTarget): string {
  if (target.kind === "ayah") {
    const surah = Number(target.resourceId) || 1;
    return buildAyahDeepLink(surah, target.anchor ?? 1);
  }
  if (target.kind === "adhkar") {
    return buildAdhkarDeepLink(target.resourceId, target.itemId);
  }
  return buildMatnDeepLink(target.resourceId, target.anchor ?? 1, { itemId: target.itemId });
}

/**
 * Parse path + search + hash into a deep-link target.
 * Accepts `/mushaf/2?ayah=255`, `/mushaf/2#ayah-255`, `#ayah-255`,
 * `?line=12#matn-line-12`, `/adhkar?cat=morning&id=…`.
 */
export function parseDeepLink(
  input?: string | { pathname?: string; search?: string; hash?: string },
): ParsedDeepLink | null {
  try {
    let pathname = "";
    let search = "";
    let hash = "";

    if (typeof input === "string") {
      const url = new URL(input, "https://majalis.local");
      pathname = url.pathname;
      search = url.search;
      hash = url.hash;
    } else if (input) {
      pathname = input.pathname || "";
      search = input.search || "";
      hash = input.hash || "";
    } else if (typeof window !== "undefined") {
      pathname = window.location.pathname;
      search = window.location.search;
      hash = window.location.hash;
    } else {
      return null;
    }

    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const hashBody = hash.replace(/^#/, "");

    const mushafMatch = pathname.match(/\/mushaf\/(\d+)/);
    const ayahFromQuery = Number(params.get("ayah") || params.get("aya") || 0);
    const ayahFromHash = hashBody.match(/^ayah-(\d+)$/i);
    const ayah = ayahFromQuery || (ayahFromHash ? Number(ayahFromHash[1]) : 0);

    if (mushafMatch || ayah > 0) {
      const surah =
        Number(mushafMatch?.[1] || params.get("surah") || 0) ||
        (mushafMatch ? Number(mushafMatch[1]) : 0);
      if (surah > 0 && ayah > 0) {
        return {
          kind: "ayah",
          resourceId: String(surah),
          anchor: ayah,
          path: mushafMatch ? `/mushaf/${surah}` : pathname || `/mushaf/${surah}`,
          search: ayahFromQuery ? `?ayah=${ayah}` : "",
          hash: `#ayah-${ayah}`,
        };
      }
      if (surah > 0) {
        return {
          kind: "ayah",
          resourceId: String(surah),
          path: `/mushaf/${surah}`,
          search: "",
          hash: "",
        };
      }
    }

    const lineFromQuery = Number(params.get("line") || 0);
    const lineFromHash = hashBody.match(/^matn-line-(\d+)$/i);
    const line = lineFromQuery || (lineFromHash ? Number(lineFromHash[1]) : 0);
    if (line > 0 || hashBody.startsWith("matn-line-")) {
      return {
        kind: "matn",
        resourceId: pathname || "/",
        anchor: line || 1,
        itemId: params.get("id") || undefined,
        path: pathname || "/",
        search: search || "",
        hash: `#matn-line-${line || 1}`,
      };
    }

    if (pathname.includes("/adhkar") || params.has("cat")) {
      return {
        kind: "adhkar",
        resourceId: params.get("cat") || "",
        itemId: params.get("id") || undefined,
        path: "/adhkar",
        search: search || "",
        hash: hash || "",
      };
    }

    return null;
  } catch {
    return null;
  }
}

function clearPreviousHighlights(root: ParentNode): void {
  try {
    root.querySelectorAll(`[${HIGHLIGHT_ATTR}]`).forEach((el) => {
      el.removeAttribute(HIGHLIGHT_ATTR);
      el.classList.remove(HIGHLIGHT_CLASS);
    });
  } catch {
    /* ignore */
  }
}

function highlightElement(el: HTMLElement): void {
  clearPreviousHighlights(document);
  el.setAttribute(HIGHLIGHT_ATTR, "1");
  el.classList.add(HIGHLIGHT_CLASS);
}

function findMatnLineEl(line: number, container?: HTMLElement | null): HTMLElement | null {
  const root = container ?? document;
  const el =
    root.querySelector(`[data-matn-line="${line}"]`) ||
    root.querySelector(`[data-line="${line}"]`) ||
    document.getElementById(`matn-line-${line}`) ||
    document.getElementById(`line-${line}`);
  return el instanceof HTMLElement ? el : null;
}

function findAdhkarEl(itemId: string, container?: HTMLElement | null): HTMLElement | null {
  const root = container ?? document;
  const el =
    root.querySelector(`[data-adhkar-id="${itemId}"]`) ||
    document.getElementById(`adhkar-${itemId}`) ||
    document.getElementById(itemId);
  return el instanceof HTMLElement ? el : null;
}

/**
 * Apply a parsed deep link: scroll + highlight target in the DOM.
 * Does not change routes — callers navigate first, then call this.
 */
export function applyDeepLinkTarget(
  target: ParsedDeepLink | DeepLinkTarget,
  opts?: { container?: HTMLElement | null; behavior?: ScrollBehavior },
): DeepLinkApplyResult {
  const parsed: ParsedDeepLink =
    "path" in target
      ? target
      : {
          ...target,
          path: "",
          search: "",
          hash: "",
        };

  try {
    if (typeof document === "undefined") {
      return { ok: false, target: parsed, scrolled: false, highlighted: false };
    }

    if (parsed.kind === "ayah" && parsed.anchor) {
      const scrolled = scrollActiveAyahIntoView(parsed.anchor, {
        container: opts?.container,
        behavior: opts?.behavior ?? "smooth",
      });
      const root = opts?.container ?? document;
      const el =
        root.querySelector(`[data-ayah="${parsed.anchor}"]`) ||
        root.querySelector(`[data-ayah-number="${parsed.anchor}"]`) ||
        document.getElementById(`ayah-${parsed.anchor}`);
      if (el instanceof HTMLElement) highlightElement(el);
      return {
        ok: scrolled || Boolean(el),
        target: parsed,
        scrolled,
        highlighted: el instanceof HTMLElement,
      };
    }

    if (parsed.kind === "matn" && parsed.anchor) {
      const el = findMatnLineEl(parsed.anchor, opts?.container);
      if (!el) return { ok: false, target: parsed, scrolled: false, highlighted: false };
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: opts?.behavior ?? "smooth" });
      highlightElement(el);
      return { ok: true, target: parsed, scrolled: true, highlighted: true };
    }

    if (parsed.kind === "adhkar" && parsed.itemId) {
      const el = findAdhkarEl(parsed.itemId, opts?.container);
      if (!el) return { ok: false, target: parsed, scrolled: false, highlighted: false };
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: opts?.behavior ?? "smooth" });
      highlightElement(el);
      return { ok: true, target: parsed, scrolled: true, highlighted: true };
    }

    return { ok: false, target: parsed, scrolled: false, highlighted: false };
  } catch {
    return { ok: false, target: parsed, scrolled: false, highlighted: false };
  }
}

/** Parse current location and apply scroll/highlight. */
export function applyDeepLinkFromLocation(
  opts?: { container?: HTMLElement | null; behavior?: ScrollBehavior },
): DeepLinkApplyResult {
  const target = parseDeepLink();
  if (!target) return { ok: false, target: null, scrolled: false, highlighted: false };
  return applyDeepLinkTarget(target, opts);
}

export const DEEP_LINK_HIGHLIGHT_ATTR = HIGHLIGHT_ATTR;
export const DEEP_LINK_HIGHLIGHT_CLASS = HIGHLIGHT_CLASS;
