/**
 * تجربة قراءة تفاعلية — مسارات مستثناة ومحددات العناصر.
 * لا يُطبَّق على المصحف ولا على عارض القرآن الغمري.
 */

const MUSHAF_PREFIX = "/mushaf";

/** مسارات يُعطَّل عليها تركيز القراءة بالكامل. */
const EXCLUDED_PATH_PREFIXES = [
  MUSHAF_PREFIX,
  "/quran/mushaf",
  "/quran/recitation-test-ai",
  "/quran-engine",
  "/tafsir",
  "/demo-ayah-reader",
  "/mushaf-v2-preview",
] as const;

/** عناصر DOM لا تُراقَب أبداً (حتى خارج مسار المصحف). */
export const READING_FOCUS_DOM_EXCLUDE =
  ".mm-viewport, .mushaf-page-frame, [data-mushaf-root], [data-quran-viewer], [data-no-reading-focus], .quran-ayah, .ayah-text, .mm-page, .mm-page-shell";

/** بطاقات وأقسام وكتل مقالات — العناصر الأساسية فقط. */
export const READING_FOCUS_TARGET_SELECTOR = [
  "[data-reading-focus]",
  ".ui-card",
  ".mj-card",
  ".card",
  ".hub-card",
  ".home-lesson-card",
  ".home-library-card",
  ".home-stat-card",
  ".home-miracle-card",
  ".home-fawaid-card",
  ".home-qa-card",
  ".home-daily-wird__card",
  ".fqh-hub-card",
  ".twh-hub-card",
  ".lessons-v2-card",
  ".page-shell > section",
  ".page-shell > article",
  ".content-hub-page section",
  ".highlighted-content > p",
  ".reading-text > p",
].join(",");

export const READING_FOCUS_ACTIVE_CLASS = "app-focus-active";
export const READING_FOCUS_NEAR_CLASS = "app-focus-near";
export const READING_FOCUS_IDLE_CLASS = "app-focus-idle";

/** حد أقصى للعناصر المراقَبة في الصفحة الواحدة. */
export const READING_FOCUS_MAX_TARGETS = 72;

export function normalizeReadingPath(pathname: string): string {
  const p = pathname.replace(/\/+$/, "") || "/";
  return p;
}

export function isReadingFocusExcludedPath(pathname: string): boolean {
  const p = normalizeReadingPath(pathname);
  return EXCLUDED_PATH_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`),
  );
}

export function isReadingFocusExcludedElement(el: Element): boolean {
  return !!el.closest(READING_FOCUS_DOM_EXCLUDE);
}

function elementDepth(el: Element): number {
  let d = 0;
  let node: Element | null = el;
  while (node?.parentElement) {
    d += 1;
    node = node.parentElement;
  }
  return d;
}

/** يُفضَّل البطاقة الداخلية على القسم الخارجي لتقليل التداخل. */
export function dedupeNestedReadingTargets(elements: HTMLElement[]): HTMLElement[] {
  const sorted = [...elements].sort((a, b) => elementDepth(b) - elementDepth(a));
  const kept: HTMLElement[] = [];
  for (const el of sorted) {
    if (!kept.some((k) => k.contains(el))) kept.push(el);
  }
  return kept;
}

export function collectReadingFocusTargets(root: ParentNode): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(READING_FOCUS_TARGET_SELECTOR);
  const filtered: HTMLElement[] = [];
  for (const el of nodes) {
    if (isReadingFocusExcludedElement(el)) continue;
    filtered.push(el);
  }
  return dedupeNestedReadingTargets(filtered).slice(0, READING_FOCUS_MAX_TARGETS);
}

export function setReadingFocusState(el: HTMLElement, state: "active" | "near" | "idle"): void {
  el.classList.remove(
    READING_FOCUS_ACTIVE_CLASS,
    READING_FOCUS_NEAR_CLASS,
    READING_FOCUS_IDLE_CLASS,
  );
  if (state === "active") el.classList.add(READING_FOCUS_ACTIVE_CLASS);
  else if (state === "near") el.classList.add(READING_FOCUS_NEAR_CLASS);
  else el.classList.add(READING_FOCUS_IDLE_CLASS);
}
