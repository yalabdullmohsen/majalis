import { useEffect } from "react";
import { useLocation } from "wouter";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { goBackOrFallback } from "@/lib/navigation-back";
import { reducedMotionPreferred, skipNextRouteMotion } from "@/lib/spatial-nav";

/** حافة يسار الشاشة (نمط Instagram) لبدء السحب التفاعلي. */
const EDGE_PX = 28;
const LOCK_DX = 10;
const MAX_DY_LOCK = 36;
const COMMIT_RATIO = 0.32;
const SCRIM_MAX = 0.38;
const SPRING = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease";

/**
 * سحب تفاعلي من الحافة اليسرى للرجوع — يتبع الإصبع (transform فقط)،
 * ثم يُكمل أو يُلغى بزنبرك. معطّل في المسارات الغامرة والشيتات.
 */
export function EdgeSwipeBack() {
  const [location] = useLocation();

  useEffect(() => {
    if (isImmersiveChromePath(location) || location === "/" || reducedMotionPreferred()) {
      return;
    }

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let locked = false;
    let dx = 0;
    let scrim: HTMLDivElement | null = null;
    let main: HTMLElement | null = null;

    const ensureScrim = () => {
      if (scrim) return scrim;
      const el = document.createElement("div");
      el.className = "mj-edge-swipe-scrim";
      el.setAttribute("aria-hidden", "true");
      document.body.appendChild(el);
      scrim = el;
      return el;
    };

    const apply = (x: number, withTransition: boolean) => {
      if (!main) return;
      const w = Math.max(1, window.innerWidth);
      const clamped = Math.max(0, Math.min(w, x));
      const progress = clamped / w;
      if (withTransition) {
        main.style.transition = SPRING;
        if (scrim) scrim.style.transition = "opacity 280ms ease";
      } else {
        main.style.transition = "none";
        if (scrim) scrim.style.transition = "none";
      }
      main.style.transform = `translate3d(${clamped}px, 0, 0)`;
      main.style.willChange = "transform";
      main.classList.add("mj-edge-swiping");
      const s = ensureScrim();
      s.style.opacity = String(SCRIM_MAX * (1 - progress));
    };

    const resetVisual = (animate: boolean) => {
      if (!main) return;
      if (animate) {
        main.style.transition = SPRING;
        main.style.transform = "translate3d(0, 0, 0)";
        if (scrim) {
          scrim.style.transition = "opacity 220ms ease";
          scrim.style.opacity = "0";
        }
        window.setTimeout(() => {
          if (!main) return;
          main.style.transform = "";
          main.style.transition = "";
          main.style.willChange = "";
          main.classList.remove("mj-edge-swiping");
          removeScrim();
        }, 340);
      } else {
        main.style.transform = "";
        main.style.transition = "";
        main.style.willChange = "";
        main.classList.remove("mj-edge-swiping");
        removeScrim();
      }
    };

    const removeScrim = () => {
      if (scrim?.parentNode) scrim.parentNode.removeChild(scrim);
      scrim = null;
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (document.body.classList.contains("app-sheet-open")) return;
      if (document.documentElement.classList.contains("chrome-immersive")) return;
      const t = e.touches[0];
      if (t.clientX > EDGE_PX) return;
      startX = t.clientX;
      startY = t.clientY;
      tracking = true;
      locked = false;
      dx = 0;
      main = document.getElementById("main-content");
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking || !main || e.touches.length !== 1) return;
      const t = e.touches[0];
      const rawDx = t.clientX - startX;
      const rawDy = Math.abs(t.clientY - startY);

      if (!locked) {
        if (rawDy > MAX_DY_LOCK && rawDy > Math.abs(rawDx)) {
          tracking = false;
          return;
        }
        if (rawDx < LOCK_DX) return;
        locked = true;
        ensureScrim();
      }

      dx = Math.max(0, rawDx);
      if (e.cancelable) e.preventDefault();
      apply(dx, false);
    };

    const finishCommit = () => {
      skipNextRouteMotion();
      goBackOrFallback(location);
      window.setTimeout(() => {
        if (!main) return;
        main.style.transition = "none";
        main.style.transform = "";
        main.style.willChange = "";
        main.classList.remove("mj-edge-swiping");
        removeScrim();
      }, 40);
    };

    const onEnd = () => {
      if (!tracking) return;
      const wasLocked = locked;
      tracking = false;
      locked = false;
      if (!wasLocked || !main) {
        dx = 0;
        return;
      }
      const w = Math.max(1, window.innerWidth);
      const ratio = dx / w;
      if (ratio >= COMMIT_RATIO || dx >= 120) {
        main.style.transition = SPRING;
        main.style.transform = `translate3d(${w}px, 0, 0)`;
        if (scrim) {
          scrim.style.transition = "opacity 240ms ease";
          scrim.style.opacity = "0";
        }
        window.setTimeout(finishCommit, 280);
      } else {
        resetVisual(true);
      }
      dx = 0;
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
      removeScrim();
      const el = document.getElementById("main-content");
      if (el) {
        el.style.transform = "";
        el.style.transition = "";
        el.style.willChange = "";
        el.classList.remove("mj-edge-swiping");
      }
    };
  }, [location]);

  return null;
}
