import { useEffect, useState } from "react";

export type MushafResourceGate = {
  isFontLoaded: boolean;
  isPageDataReady: boolean;
  canMountPage: boolean;
  /** بعد جاهزية الخط+البيانات فورًا — بلا انتظار ملاءمة لاحقة */
  allowOffscreenPrefetch: boolean;
};

/**
 * بوابة موارد: لا نص حتى الخط + البيانات.
 * Prefetch المجاور فور canMountPage (المقاس ثابت مسبقًا).
 */
export function useMushafResourceGate(
  fontReady: boolean,
  layoutReady: boolean,
  _pageNumber: number,
): MushafResourceGate {
  const isFontLoaded = fontReady;
  const isPageDataReady = layoutReady;
  const canMountPage = isFontLoaded && isPageDataReady;
  const [allowOffscreenPrefetch, setAllowOffscreenPrefetch] = useState(false);

  useEffect(() => {
    if (!canMountPage) {
      setAllowOffscreenPrefetch(false);
      return;
    }
    /* إطار واحد بعد التركيب ثم اسمح بالمجاور — بلا setTimeout تجميلي */
    const raf = requestAnimationFrame(() => {
      setAllowOffscreenPrefetch(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [canMountPage]);

  return {
    isFontLoaded,
    isPageDataReady,
    canMountPage,
    allowOffscreenPrefetch,
  };
}
