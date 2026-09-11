import { useLayoutEffect, useRef, type RefObject } from "react";
import {
  MUSHAF_FIT_MAX_PX,
  MUSHAF_FIT_MIN_PX,
  resolveUniformMushafFontSize,
} from "@/features/mushaf-madinah/fitPageFontSize";

const HEADER_H = 36;
const FOOTER_H = 40;
const SIDE_PAD = 8;
const LINE_HEIGHT = "1.85";
/** QPC لا يدعم أوزانًا حقيقية — أي وزن >400 يفعّل faux-bold ويوسّع الحروف فيفيض السطر */
const FONT_WEIGHT = "400";
/** لا نعيد حساب الخط إلا إذا تغيّر العرض بهذا القدر (فتح الرصيف يغيّر الارتفاع فقط) */
const WIDTH_LOCK_PX = 4;

/**
 * مصدر القياس الوحيد لمصحف الإنتاج (`NewMushafReader`).
 * يضبط مرة واحدة: عرض الصفحة، حجم الخط، ارتفاع السطر، المساحة السفلية، safe-area.
 * لا يتغيّر أثناء قلب الصفحة؛ يُعاد الحساب فقط عند تغيّر عرض الحاوية.
 * ارتفاع المتن (--mushaf-body-height) يُقفل مع العرض حتى لا يمدّد شريط الأسفل شبكة الآيات.
 */
export function useStableMushafLayout(
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  const lockedWidthRef = useRef(0);
  const lockedSizeRef = useRef(0);
  const lockedBodyHRef = useRef(0);

  useLayoutEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;

    const applyGeometry = (w: number, h: number, size: number, bodyH: number) => {
      const bodyW = Math.max(120, Math.min(w - SIDE_PAD * 2, 28 * 16));
      /* ثابت — المشغّل overlay؛ لا نقرأ --reader-bottom-stack حتى لا يتغيّر المقياس */
      const bottomSafe = "0px";
      root.style.setProperty("--mushaf-page-width", `${w}px`);
      root.style.setProperty("--mushaf-page-height", `${h}px`);
      root.style.setProperty("--mushaf-header-height", `${HEADER_H}px`);
      root.style.setProperty("--mushaf-footer-height", `${FOOTER_H}px`);
      root.style.setProperty("--mushaf-body-top", `${HEADER_H}px`);
      root.style.setProperty("--mushaf-body-height", `${bodyH}px`);
      root.style.setProperty("--mushaf-body-width", `${bodyW}px`);
      root.style.setProperty("--mushaf-font-size", `${size}px`);
      root.style.setProperty("--mushaf-line-height", LINE_HEIGHT);
      root.style.setProperty("--mushaf-letter-spacing", "0");
      root.style.setProperty("--mushaf-font-weight", FONT_WEIGHT);
      root.style.setProperty("--mushaf-bottom-safe-space", bottomSafe);
      root.style.setProperty("--nm-qpc-size", `${size}px`);
      root.style.setProperty("--mm-qpc-size", `${size}px`);
      root.style.setProperty("--nm-line-height", LINE_HEIGHT);
      root.setAttribute("data-mushaf-metrics", "1");
      root.setAttribute("data-mushaf-font-locked", "1");
      root.setAttribute("data-mushaf-layout-source", "stable");
    };

    const apply = () => {
      const w = Math.round(root.clientWidth || 0);
      const h = Math.round(root.clientHeight || 0);
      if (w < 80 || h < 120) return;

      const measuredBodyH = Math.max(160, h - HEADER_H - FOOTER_H);

      /* أثناء قلب الصفحة: لا تُعاد حساب مقاس الخط ولا ارتفاع المتن */
      if (root.getAttribute("data-pager-settled") === "0" && lockedSizeRef.current > 0) {
        applyGeometry(
          w,
          h,
          lockedSizeRef.current,
          lockedBodyHRef.current > 0 ? lockedBodyHRef.current : measuredBodyH,
        );
        return;
      }

      const widthChanged =
        lockedWidthRef.current === 0 ||
        Math.abs(w - lockedWidthRef.current) >= WIDTH_LOCK_PX;

      if (!widthChanged && lockedSizeRef.current > 0) {
        /* ثبات العرض: حدّث المساحة السفلية فقط — بلا تمديد شبكة الآيات */
        applyGeometry(
          w,
          h,
          lockedSizeRef.current,
          lockedBodyHRef.current > 0 ? lockedBodyHRef.current : measuredBodyH,
        );
        return;
      }

      const bodyW = Math.max(120, Math.min(w - SIDE_PAD * 2, 28 * 16));
      const bodyH = measuredBodyH;
      const base = resolveUniformMushafFontSize(bodyW, bodyH);
      const size = Math.max(
        MUSHAF_FIT_MIN_PX,
        Math.min(MUSHAF_FIT_MAX_PX, Math.round(base * 1.05)),
      );

      lockedWidthRef.current = w;
      lockedSizeRef.current = size;
      lockedBodyHRef.current = bodyH;
      applyGeometry(w, h, size, bodyH);
    };

    apply();
    const onResize = () => apply();
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [enabled, rootRef]);
}

/** توافق مع الاسم السابق — نفس المصدر الوحيد. */
export const useMushafFixedMetrics = useStableMushafLayout;
