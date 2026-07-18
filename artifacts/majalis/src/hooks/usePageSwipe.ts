import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

/**
 * سحب أفقي RTL بين الصفحات (المرحلة 8). في تخطيط RTL: السحب لليسار
 * (حركة الإصبع من اليمين لليسار) يعني "الصفحة التالية" في ترتيب المصحف
 * (تمامًا كتقليب صفحات كتاب عربي ورقي)، والسحب لليمين يعني "السابقة".
 *
 * إيماءة بسيطة بلا مكتبة خارجية إضافية (لا أثر على حجم الحزمة) — تتبّع
 * إزاحة المؤشر/اللمس الأفقية عبر Pointer Events (يعمل للمس والفأرة معًا)
 * وتُطلق onNext/onPrev عند تجاوز حد أدنى، مع دعم "الإفلات المرن" بصريًا
 * (offset تُستهلَك للـtransform أثناء السحب).
 */
export function usePageSwipe(opts: {
  onNext: () => void;
  onPrev: () => void;
  /** مسافة أدنى بالبكسل لاعتبارها سحبًا حقيقيًا لا نقرة عرضية. */
  threshold?: number;
  disabled?: boolean;
}) {
  const { onNext, onPrev, threshold = 55, disabled = false } = opts;
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const pointerId = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (disabled) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    pointerId.current = e.pointerId;
    setDragging(true);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (disabled || startX.current === null || pointerId.current !== e.pointerId) return;
    const dx = e.clientX - startX.current;
    const dy = startY.current !== null ? e.clientY - startY.current : 0;
    // تجاهل السحب شبه العمودي (تمرير الصفحة رأسيًا) — لا نعطّل التمرير الطبيعي
    if (Math.abs(dy) > Math.abs(dx) * 1.3) return;
    setDragOffset(dx);
  };

  const endDrag = (e: ReactPointerEvent) => {
    if (disabled || startX.current === null || pointerId.current !== e.pointerId) {
      resetDrag();
      return;
    }
    const dx = e.clientX - startX.current;
    if (dx <= -threshold) {
      onNext(); // سحب لليسار ← التالية
    } else if (dx >= threshold) {
      onPrev(); // سحب لليمين ← السابقة
    }
    resetDrag();
  };

  const resetDrag = () => {
    startX.current = null;
    startY.current = null;
    pointerId.current = null;
    setDragOffset(0);
    setDragging(false);
  };

  return {
    dragOffset,
    dragging,
    swipeHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onPointerLeave: (e: ReactPointerEvent) => { if (dragging) endDrag(e); },
    },
  };
}
