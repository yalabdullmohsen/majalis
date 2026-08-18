/**
 * تمرير جذر الوثيقة وحاويات التمرير الداخلية إلى الأعلى.
 * كثير من صفحات الأقسام تمرَّر داخل .app-shell / main لا في window.
 */
const ROOT_SELECTORS = [
  ".app-shell",
  "main#main-content",
  "main[data-scroll-root]",
  "[data-scroll-root]",
] as const;

export type ScrollSnapshot = {
  windowY: number;
  roots: Record<string, number>;
};

export function scrollDocumentToTop(): void {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  for (const sel of ROOT_SELECTORS) {
    const el = document.querySelector(sel);
    if (el instanceof HTMLElement) el.scrollTop = 0;
  }
}

export function captureScrollSnapshot(): ScrollSnapshot {
  const roots: Record<string, number> = {};
  for (const sel of ROOT_SELECTORS) {
    const el = document.querySelector(sel);
    if (el instanceof HTMLElement) roots[sel] = el.scrollTop;
  }
  return { windowY: window.scrollY, roots };
}

export function restoreScrollSnapshot(snap: ScrollSnapshot | undefined): void {
  const y = snap?.windowY ?? 0;
  window.scrollTo(0, y);
  if (!snap) return;
  for (const [sel, top] of Object.entries(snap.roots)) {
    const el = document.querySelector(sel);
    if (el instanceof HTMLElement) el.scrollTop = top;
  }
}

export function maxScrollY(): number {
  let y = window.scrollY;
  for (const sel of ROOT_SELECTORS) {
    const el = document.querySelector(sel);
    if (el instanceof HTMLElement) y = Math.max(y, el.scrollTop);
  }
  return y;
}
