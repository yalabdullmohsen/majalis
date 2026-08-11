/**
 * تقييد قياسات بوابات المصحف بالصفحة النشطة + عيّنة PR (٢٥ صفحة).
 * MUSHAF_GATE_PAGES → قائمة صريحة
 * MUSHAF_GATE_FULL=1 → ١..٦٠٤ (ليلي)
 * وإلا → عيّنة ٢٥ ثابتة (١٤ مرجعية + ١١ عشوائية بذرة ثابتة)
 */
export const PR_FIXED_PAGES = [
  1, 2, 3, 7, 50, 228, 235, 283, 306, 588, 599, 600, 601, 604,
];
export const PR_SAMPLE_SEED = 20260811;
export const PR_SAMPLE_SIZE = 25;
export const ACTIVE_PAGE_SEL = '[data-page-state="active"]';
export const ACTIVE_LEAF_SEL = '[data-mushaf-active-leaf="1"]';

/** مولّد عشوائي حتمي (LCG) */
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export function buildPrSamplePages(seed = PR_SAMPLE_SEED, size = PR_SAMPLE_SIZE) {
  const fixed = [...PR_FIXED_PAGES];
  const used = new Set(fixed);
  const rand = mulberry32(seed);
  const extra = [];
  let guard = 0;
  while (extra.length + fixed.length < size && guard < 10_000) {
    guard += 1;
    const n = 1 + Math.floor(rand() * 604);
    if (used.has(n)) continue;
    used.add(n);
    extra.push(n);
  }
  return [...fixed, ...extra].sort((a, b) => a - b);
}

export function resolveGatePages() {
  const raw = process.env.MUSHAF_GATE_PAGES?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 604);
  }
  if (process.env.MUSHAF_GATE_FULL === "1") {
    return Array.from({ length: 604 }, (_, i) => i + 1);
  }
  return buildPrSamplePages();
}

/**
 * مصدر يُحقَن عبر addInitScript — يُعرَّف على window لأن Playwright
 * يلفّ السكربت فلا تكفي تصريحات function المحلية.
 */
export const ACTIVE_PAGE_BROWSER_SOURCE = `
window.__mushafActiveRoot = function __mushafActiveRoot() {
  return (
    document.querySelector('[data-page-state="active"]') ||
    document.querySelector('[data-mushaf-active-leaf="1"]') ||
    null
  );
};
window.__mushafIsExcluded = function __mushafIsExcluded(el) {
  if (!el || el.nodeType !== 1) return true;
  const active = window.__mushafActiveRoot();
  if (active && !active.contains(el) && el !== active) return true;
  let n = el;
  while (n && n.nodeType === 1) {
    if (n.getAttribute("data-page-state") === "active") break;
    if (n.getAttribute("aria-hidden") === "true") return true;
    if (n.style && n.style.visibility === "hidden") return true;
    try {
      const cs = getComputedStyle(n);
      if (cs.visibility === "hidden" || cs.display === "none") return true;
    } catch (_) { /* ignore */ }
    n = n.parentElement;
  }
  return false;
};
window.__mushafLinesRoot = function __mushafLinesRoot() {
  const a = window.__mushafActiveRoot();
  if (!a) return null;
  return a.querySelector(".mf2-lines");
};
window.__mushafQuery = function __mushafQuery(sel) {
  const a = window.__mushafActiveRoot();
  if (!a) return null;
  const el = a.querySelector(sel);
  return el && !window.__mushafIsExcluded(el) ? el : null;
};
window.__mushafQueryAll = function __mushafQueryAll(sel) {
  const a = window.__mushafActiveRoot();
  if (!a) return [];
  return [...a.querySelectorAll(sel)].filter((el) => !window.__mushafIsExcluded(el));
};
`;

/** منتقي انتظار Playwright للصفحة النشطة */
export const ACTIVE_LINES_WAIT_SEL =
  '[data-page-state="active"] .mf2-lines, [data-mushaf-active-leaf="1"] .mf2-lines';
