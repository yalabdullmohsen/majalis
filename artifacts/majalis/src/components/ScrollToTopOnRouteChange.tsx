import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "wouter";
import { recordNavigationVisit } from "@/lib/navigation-back";

const STORAGE_PREFIX = "scroll-pos:";

function storageKey(path: string): string {
  return `${STORAGE_PREFIX}${path}`;
}

function readStoredY(path: string): number {
  try {
    const raw = sessionStorage.getItem(storageKey(path));
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeStoredY(path: string, y: number): void {
  try {
    sessionStorage.setItem(storageKey(path), String(Math.max(0, Math.round(y))));
  } catch {
    /* quota / private mode */
  }
}

function scrollRoots(): HTMLElement[] {
  const roots: HTMLElement[] = [];
  if (typeof document === "undefined") return roots;
  roots.push(document.documentElement);
  if (document.body) roots.push(document.body);
  document.querySelectorAll<HTMLElement>(".app-shell, main[data-scroll-root], [data-scroll-root]").forEach((el) => {
    roots.push(el);
  });
  return roots;
}

/** يصفّر (أو يستعيد) تمرير النافذة وكل حاوية تمرير داخلية معروفة. */
export function applyRouteScroll(y: number): void {
  const top = Math.max(0, y);
  const instant = { top, left: 0, behavior: "instant" as ScrollBehavior };
  window.scrollTo(instant);
  for (const el of scrollRoots()) {
    el.scrollTop = top;
    if (typeof el.scrollTo === "function") el.scrollTo(instant);
  }
}

/**
 * مسار جديد → أعلى الصفحة فورًا.
 * رجوع المتصفح فقط → استعادة الموضع من sessionStorage.
 */
export function ScrollToTopOnRouteChange() {
  const [location] = useLocation();
  const isPopRef = useRef(false);
  const lastLocationRef = useRef(location);

  useEffect(() => {
    if (typeof history !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    const onPopState = () => {
      isPopRef.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useLayoutEffect(() => {
    const leavingLocation = lastLocationRef.current;
    const isPop = isPopRef.current;
    recordNavigationVisit(location, isPop ? "pop" : "push");
    if (leavingLocation !== location) {
      writeStoredY(leavingLocation, window.scrollY);
    }
    lastLocationRef.current = location;
    isPopRef.current = false;

    if (isPop) {
      applyRouteScroll(readStoredY(location));
      return;
    }
    applyRouteScroll(0);
  }, [location]);

  return null;
}

/** اسم سابق — نفس المكوّن. */
export const ScrollResetOnNav = ScrollToTopOnRouteChange;
