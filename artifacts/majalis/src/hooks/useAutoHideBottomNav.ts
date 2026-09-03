/**
 * إخفاء/إظهار القائمة السفلية تلقائيًا حسب اتجاه التمرير.
 * يعيد: isHidden · showNav · hideNav
 *
 * عتبة 24px لتقليل التذبذب · يحترم المودال/البحث/الحقول ·
 * يستمع لتمرير window والحاويات الداخلية (capture).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { resolveShouldHideChrome } from "./useScrollDirection";

const TOP_SHOW_PX = 24;
const DELTA_PX = 24;
const BOTTOM_EDGE_SHOW_PX = 28;

export type AutoHideBottomNavApi = {
  isHidden: boolean;
  showNav: () => void;
  hideNav: () => void;
};

function isTextFieldActive(): boolean {
  const ae = document.activeElement;
  if (!ae || !(ae instanceof HTMLElement)) return false;
  if (ae.isContentEditable) return true;
  const tag = ae.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return Boolean(
    ae.closest("input, textarea, select, [contenteditable='true'], [role='search'], [role='combobox']"),
  );
}

function isOverlayBlockingHide(): boolean {
  if (document.body.classList.contains("mobile-nav-body-lock")) return true;
  if (document.body.classList.contains("side-nav-open")) return true;
  if (document.body.classList.contains("app-sheet-open")) return true;
  if (document.body.classList.contains("filter-sheet-open")) return true;
  if (document.querySelector('[aria-modal="true"]')) return true;
  if (document.querySelector(".app-sheet-overlay, .mm-ayah-bar, .mm-reciter-sheet")) return true;
  if (document.querySelector(".global-search-modal, [data-global-search-open='true']")) return true;
  return false;
}

function isChromeFocused(): boolean {
  const ae = document.activeElement;
  if (!ae || !(ae instanceof Element)) return false;
  return Boolean(ae.closest(".navbar-v3, .bottom-nav, .bottom-nav--v2, .mj-chrome-scrollable"));
}

function readScrollY(target: EventTarget | null): number {
  if (
    !target ||
    target === window ||
    target === document ||
    target === document.documentElement ||
    target === document.body
  ) {
    return window.scrollY || document.documentElement.scrollTop || 0;
  }
  if (target instanceof Element) {
    const style = window.getComputedStyle(target);
    const canScrollY =
      (style.overflowY === "auto" || style.overflowY === "scroll" || style.overflow === "auto") &&
      target.scrollHeight > target.clientHeight + 1;
    if (canScrollY) return target.scrollTop;
  }
  return window.scrollY || document.documentElement.scrollTop || 0;
}

export function useAutoHideBottomNav(options?: {
  forceShow?: boolean;
  /** عند تغيّر المسار أظهر القائمة */
  routeKey?: string;
}): AutoHideBottomNavApi {
  const forceShowProp = Boolean(options?.forceShow);
  const routeKey = options?.routeKey ?? "";
  const [isHidden, setIsHidden] = useState(false);
  const hiddenRef = useRef(false);
  const lastYByTarget = useRef(new WeakMap<object, number>());
  const rafRef = useRef(0);

  const showNav = useCallback(() => {
    hiddenRef.current = false;
    setIsHidden(false);
  }, []);

  const hideNav = useCallback(() => {
    if (forceShowProp || isTextFieldActive() || isOverlayBlockingHide()) return;
    hiddenRef.current = true;
    setIsHidden(true);
  }, [forceShowProp]);

  useEffect(() => {
    showNav();
  }, [routeKey, showNav]);

  useEffect(() => {
    if (forceShowProp) showNav();
  }, [forceShowProp, showNav]);

  useEffect(() => {
    const forceShowNow = () =>
      forceShowProp || isTextFieldActive() || isOverlayBlockingHide() || isChromeFocused();

    const apply = (scrollY: number, deltaY: number) => {
      const resolved = resolveShouldHideChrome({
        scrollY,
        deltaY,
        currentlyHidden: hiddenRef.current,
        forceShow: forceShowNow(),
      });
      if (hiddenRef.current === resolved.shouldHideChrome) return;
      hiddenRef.current = resolved.shouldHideChrome;
      setIsHidden(resolved.shouldHideChrome);
    };

    const onScroll = (e: Event) => {
      const target = e.target;
      const key = (target as object) || window;
      const y = readScrollY(target);
      const prev = lastYByTarget.current.get(key);
      const lastY = prev ?? y;
      const deltaY = y - lastY;
      if (Math.abs(deltaY) >= DELTA_PX || y < TOP_SHOW_PX || forceShowNow()) {
        lastYByTarget.current.set(key, y);
      }
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = 0;
        apply(y, deltaY);
      });
    };

    const onForceShow = () => {
      lastYByTarget.current = new WeakMap();
      showNav();
    };

    const onTapShow = (e: MouseEvent | TouchEvent) => {
      if (forceShowNow()) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest("input, textarea, select, button, a, [role='button'], [role='link']")) return;
      if (target.closest(".navbar-v3, .bottom-nav, .bottom-nav--v2")) return;
      showNav();
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const fromBottom = window.innerHeight - t.clientY;
      if (fromBottom <= BOTTOM_EDGE_SHOW_PX) showNav();
    };

    let resizeRaf = 0;
    const onResize = () => {
      if (resizeRaf) return;
      resizeRaf = window.requestAnimationFrame(() => {
        resizeRaf = 0;
        onForceShow();
      });
    };

    // capture: يلتقط تمرير الحاويات الداخلية + window
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("focusin", onForceShow);
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("click", onTapShow, { passive: true, capture: true });

    const mo = new MutationObserver(() => {
      if (forceShowNow()) onForceShow();
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"], subtree: false });

    apply(window.scrollY || 0, 0);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("focusin", onForceShow);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("click", onTapShow, true);
      mo.disconnect();
    };
  }, [forceShowProp, showNav]);

  return {
    isHidden: forceShowProp ? false : isHidden,
    showNav,
    hideNav,
  };
}
