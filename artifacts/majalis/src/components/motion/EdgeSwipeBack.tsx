import { useEffect } from "react";
import { useLocation } from "wouter";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { goBackOrFallback } from "@/lib/navigation-back";

const EDGE_PX = 22;
const MIN_DX = 64;
const MAX_DY = 42;

/**
 * سحب من حافة الشاشة للرجوع (RTL: الحافة اليسرى البصرية = نهاية الشاشة).
 * يُعطَّل في المسارات الغامرة (مصحف) لتجنب تعارض تقليب الصفحات.
 */
export function EdgeSwipeBack() {
  const [location] = useLocation();

  useEffect(() => {
    if (isImmersiveChromePath(location) || location === "/") return;

    let startX: number | null = null;
    let startY: number | null = null;
    let tracking = false;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (document.body.classList.contains("app-sheet-open")) return;
      const t = e.touches[0];
      const rtl = document.documentElement.dir !== "ltr";
      const fromEdge = rtl ? t.clientX >= window.innerWidth - EDGE_PX : t.clientX <= EDGE_PX;
      if (!fromEdge) return;
      startX = t.clientX;
      startY = t.clientY;
      tracking = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking || startX == null || startY == null || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dy > MAX_DY) {
        tracking = false;
        return;
      }
      const rtl = document.documentElement.dir !== "ltr";
      const inward = rtl ? dx < -MIN_DX : dx > MIN_DX;
      if (inward) {
        tracking = false;
        goBackOrFallback(location);
      }
    };

    const onEnd = () => {
      tracking = false;
      startX = null;
      startY = null;
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [location]);

  return null;
}
