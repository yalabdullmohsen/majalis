import {
  useEffect,
  useId,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { MOTION_SHEET } from "@/design/motion";
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
 * شيت سفلي موحّد — سحب بمطاطية، إغلاق عند ٣٠٪ أو سرعة ≥0.5px/ms،
 * خلفية/Escape/رجوع، بلا useState كل إطار (offset عبر ref + style).
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
  const scrimRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const dragStartY = useRef<number | null>(null);
  const dragStartT = useRef<number>(0);
  const dragOffset = useRef(0);
  const edgeStartX = useRef<number | null>(null);
  const edgeStartY = useRef<number | null>(null);
  const historyPushed = useRef(false);
  const closingRef = useRef(false);
  const lockScrollY = useRef(0);
  const lockPad = useRef(0);

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    onClose();
  };

  const applyOffset = (y: number) => {
    dragOffset.current = y;
    const sheet = sheetRef.current;
    const scrim = scrimRef.current;
    if (sheet) {
      sheet.style.willChange = "transform";
      sheet.style.transform = y ? `translateY(${y}px)` : "";
      sheet.style.transition = "none";
    }
    if (scrim) {
      const dim = Math.max(0.12, 0.32 * (1 - Math.min(1, y / 420)));
      scrim.style.background = `rgba(0,0,0,${dim})`;
    }
  };

  const clearDragStyles = () => {
    const sheet = sheetRef.current;
    const scrim = scrimRef.current;
    if (sheet) {
      sheet.style.willChange = "";
      sheet.style.transform = "";
      sheet.style.transition = "";
    }
    if (scrim) scrim.style.background = "";
    dragOffset.current = 0;
  };

  useEffect(() => {
    if (!open) {
      clearDragStyles();
      closingRef.current = false;
      return;
    }
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    lockScrollY.current = window.scrollY;
    lockPad.current = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const prevOverflow = document.body.style.overflow;
    const prevPad = document.body.style.paddingInlineEnd;
    /* حجز شريط التمرير لمنع قفزة التخطيط — بدون position:fixed إن أمكن */
    document.body.style.overflow = "hidden";
    if (lockPad.current > 0) {
      document.body.style.paddingInlineEnd = `${lockPad.current}px`;
    }
    document.body.classList.add("app-sheet-open", "filter-sheet-open");

    const requested = initialFocusRef?.current;
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
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
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
      document.body.style.paddingInlineEnd = prevPad;
      document.body.classList.remove("app-sheet-open", "filter-sheet-open");
      window.scrollTo(0, lockScrollY.current);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      if (historyPushed.current) {
        historyPushed.current = false;
        if (window.history.state && (window.history.state as { appSheet?: boolean }).appSheet) {
          window.history.back();
        }
      }
      previouslyFocused.current?.focus?.({ preventScroll: true });
      closingRef.current = false;
      clearDragStyles();
    };
  }, [open, initialFocusRef]);

  if (!open || typeof document === "undefined") return null;

  const dismissByDrag = (offset: number, elapsedMs: number) => {
    const h = sheetRef.current?.offsetHeight ?? 400;
    const velocity = elapsedMs > 0 ? offset / elapsedMs : 0;
    return (
      offset > h * MOTION_SHEET.dismissRatio ||
      (offset > 40 && velocity >= MOTION_SHEET.dismissVelocity)
    );
  };

  const onHandlePointerDown = (e: ReactPointerEvent) => {
    dragStartY.current = e.clientY;
    dragStartT.current = performance.now();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onHandlePointerMove = (e: ReactPointerEvent) => {
    if (dragStartY.current == null) return;
    const raw = e.clientY - dragStartY.current;
    // مطاطية عند السحب لأعلى فوق الحد
    const y =
      raw < 0 ? raw * MOTION_SHEET.rubberBand : Math.max(0, raw);
    applyOffset(y < 0 ? 0 : y);
  };
  const onHandlePointerUp = () => {
    const elapsed = performance.now() - dragStartT.current;
    const offset = dragOffset.current;
    if (dismissByDrag(offset, elapsed)) {
      requestClose();
    } else {
      const sheet = sheetRef.current;
      if (sheet) {
        sheet.style.transition = "transform var(--motion-sheet)";
        sheet.style.transform = "translateY(0)";
      }
      if (scrimRef.current) scrimRef.current.style.background = "";
      dragOffset.current = 0;
      window.setTimeout(() => {
        if (sheet) {
          sheet.style.transition = "";
          sheet.style.willChange = "";
        }
      }, 280);
    }
    dragStartY.current = null;
  };

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
        ref={scrimRef}
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
        <header className="app-sheet__head">
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
