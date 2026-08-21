import { normalizeArabic } from "@/shared/arabic-normalize";

const FLASH_MS = 2400;
const FOCUS_CLASS = "mj-focus-flash";

export function readFocusQuery(search: string): string {
  try {
    const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("focus");
    return (q ?? "").trim();
  } catch {
    return "";
  }
}

export function withFocusQuery(href: string, query: string): string {
  const q = query.trim();
  if (!q || !href.startsWith("/") || href.startsWith("//")) return href;
  if (/[?&]focus=/.test(href) || href.startsWith("/mushaf")) return href;
  const encoded = encodeURIComponent(q.slice(0, 80));
  return `${href}${href.includes("?") ? "&" : "?"}focus=${encoded}`;
}

function flash(el: HTMLElement): void {
  el.classList.add(FOCUS_CLASS);
  window.setTimeout(() => el.classList.remove(FOCUS_CLASS), FLASH_MS);
}

function findTextMatch(root: ParentNode, query: string): HTMLElement | null {
  const needle = normalizeArabic(query);
  if (!needle) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    const text = node.textContent ?? "";
    if (text && normalizeArabic(text).includes(needle)) {
      const parent = node.parentElement;
      if (parent && !parent.closest("nav, [aria-hidden='true']")) return parent;
    }
    node = walker.nextNode();
  }
  return null;
}

/** يمرّر إلى الهدف دون smooth (لتفادي اهتزاز) ويبرز لثوانٍ. */
export function applyFocusArrival(location: string): void {
  if (typeof document === "undefined") return;
  if (location.startsWith("/mushaf")) return;

  const hash = window.location.hash.replace(/^#/, "");
  const focus = readFocusQuery(window.location.search);
  const root =
    document.querySelector("main#main-content") ??
    document.querySelector("[data-scroll-root]") ??
    document.body;

  const target =
    (hash ? document.getElementById(hash) : null) ??
    (focus ? findTextMatch(root, focus) : null) ??
    (focus ? root.querySelector<HTMLElement>("h1, article, [data-focus-root]") : null);

  if (!target) return;

  target.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
  flash(target);
}
