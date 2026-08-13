import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "@/styles/components/app-bottom-sheet.css";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  snap?: "half" | "full";
  closeLabel?: string;
  footer?: ReactNode;
  className?: string;
  /** يرفع الطبقة فوق شيتات أخرى (مثل شيت الآية z≈10020) */
  elevated?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
};

/**
 * شيت سفلي موحّد — خمس طرق إغلاق:
 * سحب لأسفل · خلفية · زر سفلي · Escape/رجوع أندرويد · سحب من حافة الشاشة.
 *
 * Lifecycle: `onClose` يُحفظ في ref حتى لا يُعاد تشغيل أثر القفل/التاريخ
 * عند كل إعادة تصيير للأب (كانت تسبب سباق pushState/back وتجميد التنقّل
 * بعد فتح «المزيد»).
 */
export function AppBottomSheet({
  open,
  onClose,
  title,
  children,
  snap = "full",
  closeLabel = "إغلاق",
  footer,
  className = "",
  elevated = false,
  initialFocusRef,
}: Props) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const dragStartY = useRef<number | null>(null);
  const dragStartT = useRef<number>(0);
  const edgeStartX = useRef<number | null>(null);
  const edgeStartY = useRef<number | null>(null);
  const historyPushed = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const initialFocusRefStable = useRef(initialFocusRef);
  initialFocusRefStable.current = initialFocusRef;

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!open) {
      setDragOffset(0);
      closingRef.current = false;
      return;
    }
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    const prevScrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${prevScrollY}px`;
    document.body.style.width = "100%";
    document.body.classList.add("app-sheet-open", "filter-sheet-open");

    /* لا تركّز حقول إدخال/بحث عند الفتح — يمنع فتح الكيبورد على الجوال. */
    const requested = initialFocusRefStable.current?.current;
    const isTextField =
      requested instanceof HTMLInputElement ||
      requested instanceof HTMLTextAreaElement ||
      requested instanceof HTMLSelectElement;
    const focusTarget = requested && !isTextField ? requested : sheetRef.current;
    const frame = window.requestAnimationFrame(() => {
      focusTarget?.focus({ preventScroll: true });
    });

    const onPop = () => {
      historyPushed.current = false;
      requestClose();
    };
    if (!historyPushed.current) {
      window.history.pushState({ appSheet: true }, "");
      historyPushed.current = true;
    }
    window.addEventListener("popstate", onPop);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key !== "Tab" || !sheetRef.current) return;
      const nodes = sheetRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      document.body.classList.remove("app-sheet-open", "filter-sheet-open");
      window.scrollTo(0, prevScrollY);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      if (historyPushed.current) {
        historyPushed.current = false;
        // استبدال المدخل بدل الرجوع في التاريخ حتى لا يتعارض مع تنقّل الموجّه
        // أثناء بقاء الشيت مفتوحًا (سبب تجميد التبويبات السفلية).
        if (window.history.state && (window.history.state as { appSheet?: boolean }).appSheet) {
          window.history.replaceState(null, "");
        }
      }
      previouslyFocused.current?.focus?.({ preventScroll: true });
      closingRef.current = false;
    };
  }, [open, requestClose]);

  if (!open || typeof document === "undefined") return null;

  const dismissByDrag = (offset: number, elapsedMs: number) => {
    const h = sheetRef.current?.offsetHeight ?? 400;
    const velocity = elapsedMs > 0 ? offset / elapsedMs : 0;
    return offset > h * 0.25 || (offset > 48 && velocity > 0.65);
  };

  const onHandlePointerDown = (e: ReactPointerEvent) => {
    dragStartY.current = e.clientY;
    dragStartT.current = performance.now();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onHandlePointerMove = (e: ReactPointerEvent) => {
    if (dragStartY.current == null) return;
    setDragOffset(Math.max(0, e.clientY - dragStartY.current));
  };
  const onHandlePointerUp = () => {
    const elapsed = performance.now() - dragStartT.current;
    if (dismissByDrag(dragOffset, elapsed)) requestClose();
    dragStartY.current = null;
    setDragOffset(0);
  };

  /* سحب من حافة الشاشة (iOS): بداية من الحافة الداخلية ≤ 24px */
  const onEdgePointerDown = (e: ReactPointerEvent) => {
    const rtl = document.documentElement.dir === "rtl";
    const fromEdge = rtl ? e.clientX >= window.innerWidth - 24 : e.clientX <= 24;
    if (!fromEdge) return;
    edgeStartX.current = e.clientX;
    edgeStartY.current = e.clientY;
  };
  const onEdgePointerMove = (e: ReactPointerEvent) => {
    if (edgeStartX.current == null || edgeStartY.current == null) return;
    const dx = e.clientX - edgeStartX.current;
    const dy = Math.abs(e.clientY - edgeStartY.current);
    const rtl = document.documentElement.dir === "rtl";
    const inward = rtl ? dx < -56 : dx > 56;
    if (inward && dy < 48) {
      edgeStartX.current = null;
      edgeStartY.current = null;
      requestClose();
    }
  };
  const onEdgePointerUp = () => {
    edgeStartX.current = null;
    edgeStartY.current = null;
  };

  return createPortal(
    <div
      className={`app-sheet-overlay${elevated ? " app-sheet-overlay--elevated" : ""}`}
      onPointerDown={onEdgePointerDown}
      onPointerMove={onEdgePointerMove}
      onPointerUp={onEdgePointerUp}
      onPointerCancel={onEdgePointerUp}
    >
      <button
        type="button"
        className="app-sheet-overlay__scrim"
        aria-label="إغلاق"
        onClick={requestClose}
      />
      <div
        ref={sheetRef}
        className={`app-sheet app-sheet--${snap} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={dragOffset ? { transform: `translateY(${dragOffset}px)` } : undefined}
      >
        <div
          className="app-sheet__handle"
          role="presentation"
          aria-hidden="true"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        />
        <header
          className="app-sheet__head"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        >
          <h2 id={titleId} className="app-sheet__title">{title}</h2>
        </header>
        <div className="app-sheet__body">{children}</div>
        {footer ? <div className="app-sheet__footer-slot">{footer}</div> : null}
        <div className="app-sheet__footer">
          <button type="button" className="app-sheet__close" onClick={requestClose}>
            {closeLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
