import { memo, useCallback, useRef } from "react";
import { MUSHAF_PAGE_MAX, MUSHAF_PAGE_MIN } from "@/lib/quran-last-page";

export type MushafPageNavigationProps = {
  page: number;
  /** يظهر مع Reader Chrome فقط (Tap → إظهار · مؤقت → إخفاء) */
  visible: boolean;
  /** تفضيل المستخدم لإظهار الأسهم */
  enabled: boolean;
  disabled?: boolean;
  /**
   * RTL ورقي — لا تعتمد الاتجاه بصريًا فقط:
   * - التالية = page+1 → حافة inline-start (يمين الشاشة في RTL)
   * - السابقة = page-1 → حافة inline-end (يسار الشاشة في RTL)
   */
  onNext: () => void;
  onPrev: () => void;
};

/**
 * MushafPageNavigation — بنية تقليب واحدة فقط.
 *
 * طرق الانتقال:
 * 1) Swipe — عبر MushafPager / useMushafPager (طبقة الإيماءة)
 * 2) سهم الصفحة السابقة
 * 3) سهم الصفحة التالية
 *
 * سهم واحد يمين + سهم واحد يسار: نفس الحجم واللون والشفافية والحركة.
 * خطوة واحدة · بلا Haptic · بلا remount · بلا قفز مزدوج.
 */
export const MushafPageNavigation = memo(function MushafPageNavigation({
  page,
  visible,
  enabled,
  disabled = false,
  onNext,
  onPrev,
}: MushafPageNavigationProps) {
  const guardRef = useRef(false);

  const runOnce = useCallback(
    (fn: () => void) => {
      if (guardRef.current || disabled) return;
      guardRef.current = true;
      try {
        fn();
      } finally {
        window.setTimeout(() => {
          guardRef.current = false;
        }, 320);
      }
    },
    [disabled],
  );

  if (!enabled) return null;

  const atFirst = page <= MUSHAF_PAGE_MIN;
  const atLast = page >= MUSHAF_PAGE_MAX;
  const show = visible && !disabled;

  return (
    <div
      className="nm-page-arrows nm-page-navigation"
      data-component="MushafPageNavigation"
      data-testid="mushaf-page-navigation"
      data-visible={show ? "1" : "0"}
      data-page={page}
      aria-hidden={!show}
    >
      {/* RTL: التالية على يمين الشاشة (inline-start) */}
      <button
        type="button"
        className="nm-page-arrow nm-page-arrow--next"
        data-testid="mushaf-page-arrow-next"
        aria-label="الصفحة التالية"
        tabIndex={show && !atLast ? 0 : -1}
        disabled={disabled || atLast || !show}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (atLast || !show) return;
          runOnce(onNext);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="nm-page-arrow__hit" aria-hidden="true" />
        <span className="nm-page-arrow__icon" aria-hidden="true">
          ‹
        </span>
      </button>
      {/* RTL: السابقة على يسار الشاشة (inline-end) */}
      <button
        type="button"
        className="nm-page-arrow nm-page-arrow--prev"
        data-testid="mushaf-page-arrow-prev"
        aria-label="الصفحة السابقة"
        tabIndex={show && !atFirst ? 0 : -1}
        disabled={disabled || atFirst || !show}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (atFirst || !show) return;
          runOnce(onPrev);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="nm-page-arrow__hit" aria-hidden="true" />
        <span className="nm-page-arrow__icon" aria-hidden="true">
          ›
        </span>
      </button>
    </div>
  );
});
