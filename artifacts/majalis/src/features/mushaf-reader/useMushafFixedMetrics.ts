import { useLayoutEffect, type RefObject } from "react";
import {
  MUSHAF_FIT_MAX_PX,
  MUSHAF_FIT_MIN_PX,
  resolveUniformMushafFontSize,
} from "@/features/mushaf-madinah/fitPageFontSize";

/**
 * مقاسات ثابتة قبل العرض — بلا ملاءمة خط بعد الرسم وبلا قفزات CLS.
 * يُستدعى مرة عند التركيب وعند تغيّر حجم النافذة فقط.
 */
export function useMushafFixedMetrics(
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useLayoutEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;

    const apply = () => {
      const w = Math.round(root.clientWidth || 0);
      const h = Math.round(root.clientHeight || 0);
      if (w < 80 || h < 120) return;

      const sidePad = 16;
      const headerH = 36;
      const footerH = 32;
      const bodyW = Math.max(120, Math.min(w - sidePad * 2, 28 * 16));
      const bodyH = Math.max(160, h - headerH - footerH);

      const size = Math.max(
        MUSHAF_FIT_MIN_PX,
        Math.min(MUSHAF_FIT_MAX_PX, resolveUniformMushafFontSize(bodyW, bodyH)),
      );

      root.style.setProperty("--mushaf-page-width", `${w}px`);
      root.style.setProperty("--mushaf-page-height", `${h}px`);
      root.style.setProperty("--mushaf-body-width", `${bodyW}px`);
      root.style.setProperty("--mushaf-font-size", `${size}px`);
      root.style.setProperty("--nm-qpc-size", `${size}px`);
      root.style.setProperty("--mm-qpc-size", `${size}px`);
      root.setAttribute("data-mushaf-metrics", "1");
    };

    apply();
    const onResize = () => apply();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [enabled, rootRef]);
}
