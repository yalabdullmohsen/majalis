/**
 * حارس تنقّل خفيف — يمنع النقر السريع المزدوج من فتح نفس المسار مرتين
 * أو إطلاق انتقالات متتالية قبل استقرار الأولى.
 */
let lastNavAt = 0;
let lastNavHref = "";

const DEFAULT_GAP_MS = 380;

export function shouldAllowNavigation(
  href: string,
  gapMs: number = DEFAULT_GAP_MS,
): boolean {
  const now = Date.now();
  const normalized = href.split("?")[0] || href;
  if (normalized === lastNavHref && now - lastNavAt < gapMs) {
    return false;
  }
  lastNavAt = now;
  lastNavHref = normalized;
  return true;
}

/** للاختبارات فقط */
export function __resetNavClickGuardForTests(): void {
  lastNavAt = 0;
  lastNavHref = "";
}
