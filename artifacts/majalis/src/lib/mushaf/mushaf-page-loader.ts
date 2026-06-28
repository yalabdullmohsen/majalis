/** Lazy page loader with in-memory LRU cache and adjacent preload. */

const SVG_BASE = "https://api.islamic.app/v1/mushaf/page";
const PNG_BASE = "https://cdn.jsdelivr.net/gh/tarekeldeeb/madina_images@w1024/w1024_page";

const MAX_CACHE = 24;
const cache = new Map<number, string>();
const inflight = new Map<number, Promise<string>>();

function evictOldest() {
  if (cache.size <= MAX_CACHE) return;
  const first = cache.keys().next().value;
  if (first !== undefined) cache.delete(first);
}

export function mushafPageUrl(page: number, theme: "light" | "dark", width = 1200): string {
  return `${SVG_BASE}/${page}.svg?theme=${theme}&width=${width}`;
}

export function mushafPagePngUrl(page: number): string {
  return `${PNG_BASE}${String(page).padStart(3, "0")}.png`;
}

export async function loadMushafPageSvg(
  page: number,
  theme: "light" | "dark",
  width = 1200,
): Promise<string> {
  const key = page;
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    const url = mushafPageUrl(page, theme, width);
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`page ${page}: ${res.status}`);
    const svg = await res.text();
    cache.set(key, svg);
    evictOldest();
    return svg;
  })();

  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

export function preloadMushafPages(pages: number[], theme: "light" | "dark"): void {
  for (const p of pages) {
    if (p < 1 || p > 604 || cache.has(p)) continue;
    void loadMushafPageSvg(p, theme).catch(() => undefined);
  }
}

export function clearMushafPageCache(): void {
  cache.clear();
}
