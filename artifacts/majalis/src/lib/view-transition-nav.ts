/**
 * View Transitions API — تنقّل ناعم عند الدعم، مع تخطّي المصحف والحركة المخفّضة.
 * لا يعتمد على Next.js.
 */
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { reducedMotionPreferred } from "@/lib/spatial-nav";

const VT_MS = 150;

let skipCssMotionOnce = false;

/** بعد VT ناجح: لا تُطبَّق حركة CSS الموازية على #main-content. */
export function markSkipCssRouteMotion(): void {
  skipCssMotionOnce = true;
}

export function consumeSkipCssRouteMotion(): boolean {
  if (!skipCssMotionOnce) return false;
  skipCssMotionOnce = false;
  return true;
}

export function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && typeof document.startViewTransition === "function";
}

export function shouldUseViewTransition(fromPath: string, toPath: string): boolean {
  if (!supportsViewTransitions()) return false;
  if (reducedMotionPreferred()) return false;
  if (isImmersiveChromePath(fromPath) || isImmersiveChromePath(toPath)) return false;
  return true;
}

/** مدة انتقال العرض (ms) — متوافقة مع معيار 120–180. */
export function viewTransitionDurationMs(): number {
  return VT_MS;
}

export function resolveSameOriginPath(href: string): string | null {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return null;
  }
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
