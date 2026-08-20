/**
 * منفذ تنقّل واحد — push للشاشات · replace لحالة UI (شرائح · تبويبات · فلاتر).
 * ممنوع setLocation المباشر خارج هذا الملف (بوابة lint).
 */
export type NavigationMode = "screen" | "state";

type NavigateFn = (path: string, opts?: { replace?: boolean }) => void;

let boundNavigate: NavigateFn | null = null;

export function bindNavigation(navigate: NavigateFn): void {
  boundNavigate = navigate;
}

export function currentAppHref(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/** تجاهل التنقّل إلى نفس الرابط حرفياً */
export function isSameHref(a: string, b: string): boolean {
  return a === b;
}

/**
 * @param path مسار كامل يشمل ?query إن وُجد
 * @param mode screen → push · state → replace دائماً
 */
export function navigateTo(path: string, opts: { mode?: NavigationMode } = {}): void {
  const mode = opts.mode ?? "screen";
  const target = path.startsWith("/") ? path : `/${path}`;
  const current = currentAppHref();
  if (isSameHref(current, target)) return;

  const replace = mode === "state";
  if (boundNavigate) {
    boundNavigate(target, { replace });
    return;
  }
  if (typeof window === "undefined") return;
  if (replace) window.history.replaceState({}, "", target);
  else window.history.pushState({}, "", target);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/** رجوع برمجي — يُستخدم من goBackOrFallback */
export function navigateBackTarget(path: string): void {
  navigateTo(path, { mode: "state" });
}
