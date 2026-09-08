import { useEffect } from "react";
import { flushSync } from "react-dom";
import { useLocation } from "wouter";
import {
  markSkipCssRouteMotion,
  resolveSameOriginPath,
  shouldUseViewTransition,
} from "@/lib/view-transition-nav";

/**
 * يعترض نقرات الروابط الداخلية ويغلّفها بـ View Transitions API عند الدعم.
 * المصحف والحركة المخفّضة ومفاتيح المعدّل → مسار عادي بدون VT.
 */
export function ViewTransitionNav() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download") || anchor.dataset.noVt === "1") return;

      const next = resolveSameOriginPath(anchor.getAttribute("href") || "");
      if (!next) return;

      const from = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next === from) return;
      if (!shouldUseViewTransition(from, next)) return;

      event.preventDefault();
      event.stopPropagation();

      const run = () => {
        flushSync(() => {
          setLocation(next);
        });
      };

      markSkipCssRouteMotion();
      try {
        const vt = document.startViewTransition!(run);
        void vt.finished.catch(() => {
          /* اكتمال أو إلغاء — لا شيء */
        });
      } catch {
        run();
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [setLocation]);

  return null;
}
