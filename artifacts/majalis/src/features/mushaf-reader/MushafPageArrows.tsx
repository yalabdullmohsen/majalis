import { memo, useCallback, useRef } from "react";
import { MUSHAF_PAGE_MAX, MUSHAF_PAGE_MIN } from "@/lib/quran-last-page";

type Props = {
  page: number;
  /** يظهر مع Reader Chrome فقط */
  visible: boolean;
  /** تفضيل المستخدم لإظهار الأسهم */
  enabled: boolean;
  /**
   * انشغال مؤقت (تسوية/جوار) — لا يخفي السهم؛ يمنع الضغط فقط.
   * كان ربط ذلك بـ disabled + CSS opacity:0 يجعل الأسهم «غير موجودة».
   */
  busy?: boolean;
  /**
   * RTL: next = page+1 (حافة inline-start / يمين الشاشة).
   * prev = page-1 (حافة inline-end / يسار الشاشة).
   */
  onNext: () => void;
  onPrev: () => void;
};

/**
 * أسهم تقليب المصحف — طبقة فوق الصفحة خارج Text Flow / Geometry.
 * لا Haptic · لا Loading · خطوة واحدة مع قفل ضغط مزدوج محلي إضافي.
 */
export const MushafPageArrows = memo(function MushafPageArrows({
  page,
  visible,
  enabled,
  busy = false,
  onNext,
  onPrev,
}: Props) {
  const guardRef = useRef(false);

  const runOnce = useCallback((fn: () => void) => {
    if (guardRef.current || busy) return;
    guardRef.current = true;
    try {
      fn();
    } finally {
      window.setTimeout(() => {
        guardRef.current = false;
      }, 240);
    }
  }, [busy]);

  if (!enabled) return null;

  const atFirst = page <= MUSHAF_PAGE_MIN;
  const atLast = page >= MUSHAF_PAGE_MAX;
  const show = visible;

  return (
    <div
      className="nm-page-arrows"
      data-testid="mushaf-page-arrows"
      data-visible={show ? "1" : "0"}
      data-busy={busy ? "1" : "0"}
      data-page={page}
      aria-hidden={!show}
    >
      {/* RTL: التالية أسفل يمين الشاشة (inline-start) */}
      <button
        type="button"
        className="nm-page-arrow nm-page-arrow--next"
        data-testid="mushaf-page-arrow-next"
        aria-label="الصفحة التالية"
        tabIndex={show && !atLast ? 0 : -1}
        disabled={atLast}
        aria-disabled={busy || !show || atLast ? true : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (atLast || !show || busy) return;
          runOnce(onNext);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="nm-page-arrow__hit" aria-hidden="true" />
        <span className="nm-page-arrow__icon" aria-hidden="true">
          ‹
        </span>
      </button>
      {/* RTL: السابقة أسفل يسار الشاشة (inline-end) */}
      <button
        type="button"
        className="nm-page-arrow nm-page-arrow--prev"
        data-testid="mushaf-page-arrow-prev"
        aria-label="الصفحة السابقة"
        tabIndex={show && !atFirst ? 0 : -1}
        disabled={atFirst}
        aria-disabled={busy || !show || atFirst ? true : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (atFirst || !show || busy) return;
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
