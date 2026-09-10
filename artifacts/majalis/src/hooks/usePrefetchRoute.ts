/**
 * تحميل مسبق لوجهة البطاقة عند الظهور/اللمس — انتقال يبدو فوريًا.
 */
import { useCallback, useEffect, useRef } from "react";
import { prefetchRoute } from "@/lib/prefetch-route";

/** دفء المسار عند pointer/focus + عند دخول العنصر للشاشات */
export function usePrefetchRoute(href: string) {
  const warm = useCallback(() => {
    const path = (href || "").trim();
    if (!path || path.startsWith("#")) return;
    prefetchRoute(path);
  }, [href]);

  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          warm();
          io.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [warm]);

  return {
    ref,
    warm,
    onPointerEnter: warm,
    onPointerDown: warm,
    onFocus: warm,
  };
}
