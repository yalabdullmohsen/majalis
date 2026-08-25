import { useEffect, useState } from "react";

export type MushafResourceGate = {
  /** خط QPC للصفحة الحالية محمّل ومتحقق */
  isFontLoaded: boolean;
  /** بيانات تخطيط الصفحة جاهزة في الذاكرة */
  isPageDataReady: boolean;
  /** يُسمح بتركيب MushafPage */
  canMountPage: boolean;
  /** يُسمح بتركيب الصفحات المجاورة خارج الشاشة بعد استقرار الصفحة النشطة */
  allowOffscreenPrefetch: boolean;
};

/**
 * بوابة موارد المصحف: لا تركيب نص حتى الخط + البيانات،
 * ولا prefetch مجاور حتى استقرار ملاءمة الصفحة النشطة (data-mm-fit=1).
 */
export function useMushafResourceGate(
  fontReady: boolean,
  layoutReady: boolean,
  pageNumber: number,
): MushafResourceGate {
  const isFontLoaded = fontReady;
  const isPageDataReady = layoutReady;
  const canMountPage = isFontLoaded && isPageDataReady;
  const [allowOffscreenPrefetch, setAllowOffscreenPrefetch] = useState(false);

  useEffect(() => {
    setAllowOffscreenPrefetch(false);
    if (!canMountPage) return;

    let cancelled = false;
    let mo: MutationObserver | null = null;
    let raf = 0;
    let poll = 0;

    const tryArm = () => {
      if (cancelled) return;
      const node = document.querySelector<HTMLElement>(
        '[data-pane="current"] .mm-page, .mm-viewport [data-testid="mushaf-page"]',
      );
      if (node?.dataset.mmFit === "1") {
        setAllowOffscreenPrefetch(true);
        return true;
      }
      return false;
    };

    raf = requestAnimationFrame(() => {
      if (tryArm()) return;
      const node = document.querySelector<HTMLElement>(
        '[data-pane="current"] .mm-page, .mm-viewport [data-testid="mushaf-page"]',
      );
      if (node && typeof MutationObserver !== "undefined") {
        mo = new MutationObserver(() => {
          if (tryArm()) mo?.disconnect();
        });
        mo.observe(node, { attributes: true, attributeFilter: ["data-mm-fit"] });
      }
      // احتياط إن تأخر تركيب الصفحة
      poll = window.setInterval(() => {
        if (tryArm()) window.clearInterval(poll);
      }, 50);
      window.setTimeout(() => {
        if (!cancelled) {
          window.clearInterval(poll);
          // بعد مهلة قصيرة اسمح بالـprefetch حتى لا يُعطَّل التقليب إن فشل المراقب
          setAllowOffscreenPrefetch(true);
        }
      }, 900);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      mo?.disconnect();
      if (poll) window.clearInterval(poll);
    };
  }, [canMountPage, pageNumber]);

  return {
    isFontLoaded,
    isPageDataReady,
    canMountPage,
    allowOffscreenPrefetch,
  };
}
