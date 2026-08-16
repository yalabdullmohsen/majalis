/**
 * اتجاه التمرير لإخفاء/إظهار كروم التنقّل (هيدر + شريط سفلي) على الجوال.
 * لا يحدّث state في كل بكسل — عبر rAF + عتبة 10px.
 */
import { useEffect, useState } from "react";

export type ScrollDirectionState = {
  isScrollingDown: boolean;
  shouldHideChrome: boolean;
  scrollY: number;
};

const TOP_SHOW_PX = 24;
const DELTA_PX = 10;

export function resolveShouldHideChrome(input: {
  scrollY: number;
  deltaY: number;
  currentlyHidden: boolean;
  forceShow: boolean;
}): Pick<ScrollDirectionState, "isScrollingDown" | "shouldHideChrome"> {
  if (input.forceShow || input.scrollY < TOP_SHOW_PX) {
    return { isScrollingDown: false, shouldHideChrome: false };
  }
  if (input.deltaY > DELTA_PX) {
    return { isScrollingDown: true, shouldHideChrome: true };
  }
  if (input.deltaY < -DELTA_PX) {
    return { isScrollingDown: false, shouldHideChrome: false };
  }
  return {
    isScrollingDown: input.currentlyHidden,
    shouldHideChrome: input.currentlyHidden,
  };
}

function isTextFieldActive(): boolean {
  const ae = document.activeElement;
  if (!ae || !(ae instanceof HTMLElement)) return false;
  if (ae.isContentEditable) return true;
  const tag = ae.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return Boolean(ae.closest("input, textarea, select, [contenteditable='true'], [role='search']"));
}

function isOverlayBlockingHide(): boolean {
  if (document.body.classList.contains("mobile-nav-body-lock")) return true;
  if (document.body.classList.contains("side-nav-open")) return true;
  if (document.querySelector('[aria-modal="true"]')) return true;
  if (document.querySelector(".global-search-modal, [data-global-search-open='true']")) return true;
  return false;
}

function isChromeFocused(): boolean {
  const ae = document.activeElement;
  if (!ae || !(ae instanceof Element)) return false;
  return Boolean(ae.closest(".navbar-v3, .bottom-nav, .bottom-nav--v2, .mj-chrome-scrollable"));
}

export function useScrollDirection(options?: { forceShow?: boolean }): ScrollDirectionState {
  const forceShowProp = Boolean(options?.forceShow);
  const [state, setState] = useState<ScrollDirectionState>(() => ({
    isScrollingDown: false,
    shouldHideChrome: false,
    scrollY: typeof window !== "undefined" ? window.scrollY : 0,
  }));

  useEffect(() => {
    let lastY = window.scrollY;
    let hidden = false;
    let raf = 0;
    let lastEmitted = { isScrollingDown: false, shouldHideChrome: false, scrollY: lastY };

    const forceShowNow = () =>
      forceShowProp || isTextFieldActive() || isOverlayBlockingHide() || isChromeFocused();

    const emit = (next: ScrollDirectionState) => {
      if (
        next.isScrollingDown === lastEmitted.isScrollingDown &&
        next.shouldHideChrome === lastEmitted.shouldHideChrome &&
        Math.abs(next.scrollY - lastEmitted.scrollY) < 1
      ) {
        return;
      }
      lastEmitted = next;
      setState(next);
    };

    const tick = () => {
      raf = 0;
      const y = window.scrollY || window.pageYOffset || 0;
      const deltaY = y - lastY;
      const resolved = resolveShouldHideChrome({
        scrollY: y,
        deltaY,
        currentlyHidden: hidden,
        forceShow: forceShowNow(),
      });
      if (Math.abs(deltaY) >= DELTA_PX || y < TOP_SHOW_PX || forceShowNow()) {
        lastY = y;
      }
      hidden = resolved.shouldHideChrome;
      emit({
        isScrollingDown: resolved.isScrollingDown,
        shouldHideChrome: resolved.shouldHideChrome,
        scrollY: y,
      });
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(tick);
    };

    const onForceShow = () => {
      hidden = false;
      lastY = window.scrollY;
      emit({
        isScrollingDown: false,
        shouldHideChrome: false,
        scrollY: window.scrollY,
      });
    };

    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("focusin", onForceShow);
    window.addEventListener("focusout", onScroll);
    window.addEventListener("resize", onScroll, { passive: true });

    const mo = new MutationObserver(() => {
      if (forceShowNow()) onForceShow();
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"], subtree: false });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("focusin", onForceShow);
      window.removeEventListener("focusout", onScroll);
      window.removeEventListener("resize", onScroll);
      mo.disconnect();
    };
  }, [forceShowProp]);

  return state;
}
