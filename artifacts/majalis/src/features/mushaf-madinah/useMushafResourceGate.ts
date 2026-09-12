import { useEffect, useRef, useState } from "react";

export type MushafResourceGate = {
  isFontLoaded: boolean;
  isPageDataReady: boolean;
  canMountPage: boolean;
  /**
   * Prefetch المجاور يبقى مفعّلاً بعد أول جاهزية في الجلسة —
   * لا يُطفأ عند وميض canMountPage أثناء التقليب (يمنع تفكيك الصفحات المجاورة).
   */
  allowOffscreenPrefetch: boolean;
};

/**
 * بوابة موارد: لا نص حتى الخط + البيانات.
 * Prefetch المجاور يثبت بعد أول canMountPage ولا يُلغى عند التقليب.
 */
export function useMushafResourceGate(
  fontReady: boolean,
  layoutReady: boolean,
  _pageNumber: number,
): MushafResourceGate {
  const isFontLoaded = fontReady;
  const isPageDataReady = layoutReady;
  const canMountPage = isFontLoaded && isPageDataReady;
  const stickyPrefetchRef = useRef(false);
  const [allowOffscreenPrefetch, setAllowOffscreenPrefetch] = useState(false);

  useEffect(() => {
    if (!canMountPage) return;
    if (stickyPrefetchRef.current) {
      if (!allowOffscreenPrefetch) setAllowOffscreenPrefetch(true);
      return;
    }
    const raf = requestAnimationFrame(() => {
      stickyPrefetchRef.current = true;
      setAllowOffscreenPrefetch(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [canMountPage, allowOffscreenPrefetch]);

  return {
    isFontLoaded,
    isPageDataReady,
    canMountPage,
    allowOffscreenPrefetch: allowOffscreenPrefetch || stickyPrefetchRef.current,
  };
}
