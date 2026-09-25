import { useLayoutEffect, useRef, type RefObject } from "react";
import { mushafPerfInc } from "./mushaf-turn-telemetry";
import {
  resolveSunnahMushafSignaturePreset,
  resolveSignatureFontSizePx,
  resolveTabletPageMaxWidthPx,
  resolveTabletSignatureFontSizePx,
  SUNNAH_MUSHAF_SIGNATURE_PRESET_ID,
} from "./sunnah-mushaf-signature-preset";

const SIGNATURE = resolveSunnahMushafSignaturePreset();
/** ثوابت Geometry — أسماء ثابتة للبوابات؛ القيم من Signature */
const HEADER_H = 36;
const FOOTER_H = 40;
const SIDE_PAD = SIGNATURE.contentInsets.sidePx;
const LINE_HEIGHT = "1.85";
/** QPC لا يدعم أوزانًا حقيقية — أي وزن >400 يفعّل faux-bold ويوسّع الحروف فيفيض السطر */
const FONT_WEIGHT = "400";
/** لا نعيد حساب الخط إلا إذا تغيّر العرض بهذا القدر (فتح الرصيف يغيّر الارتفاع فقط) */
const WIDTH_LOCK_PX = 4;
/** سقف متن هاتفي — اللوح (≥768×600) يوسّع الحبر حسب الارتفاع بلا عمود 480 */
const PHONE_BODY_CAP_PX = 30 * 16;
const TABLET_MIN_WIDTH_PX = 768;
/** يستبعد landscape الهاتف (~390 ارتفاعًا) مع الإبقاء على iPad landscape */
const TABLET_MIN_HEIGHT_PX = 600;

function isTabletViewport(viewportW: number, viewportH: number): boolean {
  return viewportW >= TABLET_MIN_WIDTH_PX && viewportH >= TABLET_MIN_HEIGHT_PX;
}

/**
 * متن الصفحة: هاتف بسقف 480؛ لوح = عرض الحبر الآمن بعد اختيار الخط من الارتفاع
 * حتى لا تبقى ورقة بعرض الشاشة مع عمود حبر هاتفي في المنتصف.
 */
function resolveBodyAndPageWidthPx(
  viewportW: number,
  viewportH: number,
  bodyH: number,
): { bodyW: number; pageW: number; size: number } {
  const available = Math.max(120, viewportW - SIDE_PAD * 2);
  if (!isTabletViewport(viewportW, viewportH)) {
    const bodyW = Math.max(120, Math.min(available, PHONE_BODY_CAP_PX));
    const size = resolveSignatureFontSizePx(bodyW, bodyH);
    return { bodyW, pageW: viewportW, size };
  }
  /* لوح: خط من الارتفاع/العرض (مسار منفصل عن سقف الهاتف 24) ثم غلاف ≈ الحبر */
  const size = resolveTabletSignatureFontSizePx(available, bodyH);
  const pageW = resolveTabletPageMaxWidthPx(viewportW, size, SIDE_PAD);
  const bodyW = Math.max(120, pageW - SIDE_PAD * 2);
  return { bodyW, pageW, size };
}

/** توافق البوابات — متن اللوح بلا سقف 480 */
export function resolveBodyWidthPx(viewportW: number, viewportH: number): number {
  const bodyH = Math.max(160, viewportH - HEADER_H - FOOTER_H);
  return resolveBodyAndPageWidthPx(viewportW, viewportH, bodyH).bodyW;
}

/**
 * مصدر القياس الوحيد لمصحف الإنتاج (`NewMushafReader`).
 * Preset ثابت حسب فئة الشاشة — بلا auto-fit لكل صفحة وبلا measure-and-resize.
 * لا يتغيّر أثناء قلب الصفحة أو ظهور Reader Chrome.
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

    const applyGeometry = (
      w: number,
      h: number,
      size: number,
      bodyH: number,
      bodyW: number,
      pageW: number,
    ) => {
      /* ثابت — المشغّل overlay؛ لا نقرأ --reader-bottom-stack حتى لا يتغيّر المقياس */
      const bottomSafe = "0px";
      root.style.setProperty("--mushaf-page-width", `${pageW}px`);
      root.style.setProperty("--mushaf-page-height", `${h}px`);
      root.style.setProperty("--mushaf-header-height", `${HEADER_H}px`);
      root.style.setProperty("--mushaf-footer-height", `${FOOTER_H}px`);
      root.style.setProperty("--mushaf-body-top", `${HEADER_H}px`);
      root.style.setProperty("--mushaf-body-height", `${bodyH}px`);
      root.style.setProperty("--mushaf-body-width", `${bodyW}px`);
      /*
       * الحشو الجانبي يجب أن يطابق Signature (sidePx) لا افتراض CSS (0.7rem).
       * وإلا يُحسب الخط على bodyW ثم يُخصم حشو أكبر داخل max-width=bodyW → lineOverflow.
       */
      root.style.setProperty("--mushaf-side-pad", `${SIDE_PAD}px`);
      root.style.setProperty("--nm-side-pad", `${SIDE_PAD}px`);
      /* غلاف الصفحة = عرض الحبر الآمن على اللوح؛ على الهاتف = عرض الشاشة */
      root.style.setProperty("--nm-page-max-w", `${pageW}px`);
      root.style.setProperty("--mm-page-max-w", `${pageW}px`);
      /* QPC يحمل تباعده؛ أي word-gap إضافي يفيض الأسطر الكثيفة (مثل ص598) */
      root.style.setProperty("--nm-word-gap", "0");
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
      root.setAttribute("data-mushaf-layout-source", "signature-bands");
      root.setAttribute("data-active-preset-id", SIGNATURE.presetId);
      root.setAttribute("data-active-preset-version", SIGNATURE.presetVersion);
      root.setAttribute("data-renderer-id", SIGNATURE.rendererId);
      root.setAttribute("data-font-id", SIGNATURE.fontId);
      root.setAttribute("data-font-version", SIGNATURE.fontVersion);
      root.setAttribute("data-font-size", String(size));
      root.setAttribute("data-line-height", LINE_HEIGHT);
      root.setAttribute("data-page-scale", String(SIGNATURE.pageScale));
      root.setAttribute("data-page-width", String(pageW));
      root.setAttribute("data-content-width", String(bodyW));
      root.setAttribute("data-horizontal-inset", String(SIDE_PAD));
      root.setAttribute("data-number-of-lines", String(SIGNATURE.linesPerPage));
      root.setAttribute("data-render-cache-version", SIGNATURE.renderCacheVersion);
      root.setAttribute("data-viewport-width", String(w));
      if (import.meta.env.DEV) {
        root.setAttribute("data-debug-signature", "1");
      }
    };

    const apply = () => {
      const w = Math.round(root.clientWidth || 0);
      const h = Math.round(root.clientHeight || 0);
      if (w < 80 || h < 120) return;

      const measuredBodyH = Math.max(160, h - HEADER_H - FOOTER_H);
      const resolved = resolveBodyAndPageWidthPx(w, h, measuredBodyH);

      /* أثناء قلب الصفحة: لا تُعاد حساب مقاس الخط ولا ارتفاع المتن */
      if (root.getAttribute("data-pager-settled") === "0" && lockedSizeRef.current > 0) {
        const bodyH =
          lockedBodyHRef.current > 0 ? lockedBodyHRef.current : measuredBodyH;
        const locked = resolveBodyAndPageWidthPx(w, h, bodyH);
        applyGeometry(
          w,
          h,
          lockedSizeRef.current,
          bodyH,
          locked.bodyW,
          locked.pageW,
        );
        return;
      }

      const widthChanged =
        lockedWidthRef.current === 0 ||
        Math.abs(w - lockedWidthRef.current) >= WIDTH_LOCK_PX;

      if (!widthChanged && lockedSizeRef.current > 0) {
        const bodyH =
          lockedBodyHRef.current > 0 ? lockedBodyHRef.current : measuredBodyH;
        const locked = resolveBodyAndPageWidthPx(w, h, bodyH);
        applyGeometry(
          w,
          h,
          lockedSizeRef.current,
          bodyH,
          locked.bodyW,
          locked.pageW,
        );
        return;
      }

      lockedWidthRef.current = w;
      lockedSizeRef.current = resolved.size;
      lockedBodyHRef.current = measuredBodyH;
      mushafPerfInc("geometryChange");
      applyGeometry(
        w,
        h,
        resolved.size,
        measuredBodyH,
        resolved.bodyW,
        resolved.pageW,
      );
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

void SUNNAH_MUSHAF_SIGNATURE_PRESET_ID;
