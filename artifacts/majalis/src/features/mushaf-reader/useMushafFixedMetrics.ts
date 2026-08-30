import { useLayoutEffect, type RefObject } from "react";
import {
  MUSHAF_FIT_MAX_PX,
  MUSHAF_FIT_MIN_PX,
  resolveUniformMushafFontSize,
} from "@/features/mushaf-madinah/fitPageFontSize";

const HEADER_H = 36;
const FOOTER_H = 32;
const SIDE_PAD = 12;
const LINE_HEIGHT = "1.85";
/** QPC لا يدعم أوزانًا حقيقية — أي وزن >400 يفعّل faux-bold ويوسّع الحروف فيفيض السطر */
const FONT_WEIGHT = "400";

/**
 * مقاسات ثابتة قبل العرض — بلا ملاءمة خط بعد الرسم وبلا قفزات CLS.
 * يُستدعى مرة عند التركيب وعند تغيّر حجم النافذة فقط.
 * لا يُعاد حسابه عند قلب الصفحة.
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

      const bodyW = Math.max(120, Math.min(w - SIDE_PAD * 2, 28 * 16));
      const bodyH = Math.max(160, h - HEADER_H - FOOTER_H);
      const bodyTop = HEADER_H;

      const size = Math.max(
        MUSHAF_FIT_MIN_PX,
        Math.min(MUSHAF_FIT_MAX_PX, resolveUniformMushafFontSize(bodyW, bodyH)),
      );

      root.style.setProperty("--mushaf-page-width", `${w}px`);
      root.style.setProperty("--mushaf-page-height", `${h}px`);
      root.style.setProperty("--mushaf-header-height", `${HEADER_H}px`);
      root.style.setProperty("--mushaf-footer-height", `${FOOTER_H}px`);
      root.style.setProperty("--mushaf-body-top", `${bodyTop}px`);
      root.style.setProperty("--mushaf-body-height", `${bodyH}px`);
      root.style.setProperty("--mushaf-body-width", `${bodyW}px`);
      root.style.setProperty("--mushaf-font-size", `${size}px`);
      root.style.setProperty("--mushaf-line-height", LINE_HEIGHT);
      root.style.setProperty("--mushaf-font-weight", FONT_WEIGHT);
      root.style.setProperty("--nm-qpc-size", `${size}px`);
      root.style.setProperty("--mm-qpc-size", `${size}px`);
      root.style.setProperty("--nm-line-height", LINE_HEIGHT);
      root.setAttribute("data-mushaf-metrics", "1");
    };

    apply();
    const onResize = () => apply();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [enabled, rootRef]);
}
