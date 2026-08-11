/**
 * إيماءة رجوع من الحافة (RTL: الحافة اليمنى) — تتبع 1:1 عبر transform على main،
 * تكتمل عند ٣٥٪ أو سرعة ≥0.4 px/ms، وإلا ترتدّ.
 */
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { MOTION_NAV, prefersReducedMotion } from "@/design/motion";
import { goBackOrFallback } from "@/lib/navigation-back";

const IMMERSIVE =
  /^\/(mushaf|quran\/reader|prayer-times|adhan|tasbeeh|car-mode|family-mode)(\/|$)/i;

export function useEdgeBackGesture(opts?: { disabled?: boolean }) {
  const [location] = useLocation();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startT = useRef(0);
  const tracking = useRef(false);
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (opts?.disabled) return;
    if (IMMERSIVE.test(location)) return;
    if (prefersReducedMotion()) return;

    const main = document.getElementById("main-content");
    mainRef.current = main;

    const resetMain = () => {
      const el = mainRef.current;
      if (!el) return;
      el.style.willChange = "";
      el.style.transition = "";
      el.style.transform = "";
      el.style.filter = "";
    };

    const cancel = () => {
      tracking.current = false;
      startX.current = null;
      resetMain();
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const rtl = document.documentElement.dir !== "ltr";
      const fromEdge = rtl
        ? e.clientX >= window.innerWidth - MOTION_NAV.edgeWidthPx
        : e.clientX <= MOTION_NAV.edgeWidthPx;
      if (!fromEdge) return;
      startX.current = e.clientX;
      startY.current = e.clientY;
      startT.current = performance.now();
      tracking.current = true;
      if (main) {
        main.style.willChange = "transform";
        main.style.transition = "none";
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!tracking.current || startX.current == null) return;
      const dx = e.clientX - startX.current;
      const dy = Math.abs(e.clientY - (startY.current ?? e.clientY));
      if (dy > 48 && Math.abs(dx) < dy) {
        cancel();
        return;
      }
      const rtl = document.documentElement.dir !== "ltr";
      const progress = rtl ? Math.min(0, dx) : Math.max(0, dx);
      const abs = Math.abs(progress);
      if (main) {
        main.style.transform = `translateX(${rtl ? -abs : abs}px)`;
        main.style.filter = `brightness(${1 - (abs / window.innerWidth) * (1 - MOTION_NAV.backBrightness)})`;
      }
    };

    const finish = (e: PointerEvent) => {
      if (!tracking.current || startX.current == null) {
        cancel();
        return;
      }
      const dx = e.clientX - startX.current;
      const elapsed = Math.max(1, performance.now() - startT.current);
      const rtl = document.documentElement.dir !== "ltr";
      const delta = rtl ? -dx : dx;
      const velocity = delta / elapsed;
      const ratio = delta / window.innerWidth;
      const complete =
        ratio >= MOTION_NAV.edgeCompleteRatio || velocity >= MOTION_NAV.edgeVelocity;

      if (main) {
        main.style.transition =
          "transform var(--mj-motion-fast) var(--mj-ease-accelerate), filter var(--mj-motion-fast) var(--mj-ease-accelerate)";
      }

      if (complete) {
        if (main) {
          main.style.transform = `translateX(${rtl ? -window.innerWidth * 0.35 : window.innerWidth * 0.35}px)`;
        }
        window.setTimeout(() => {
          goBackOrFallback(location, "/");
          resetMain();
        }, 100);
      } else {
        if (main) {
          main.style.transform = "translateX(0)";
          main.style.filter = "";
        }
        window.setTimeout(resetMain, 180);
      }
      tracking.current = false;
      startX.current = null;
    };

    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerup", finish, { passive: true });
    document.addEventListener("pointercancel", cancel, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", cancel);
      resetMain();
    };
  }, [location, opts?.disabled]);
}
