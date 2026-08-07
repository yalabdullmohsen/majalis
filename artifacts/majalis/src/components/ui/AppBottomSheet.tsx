import {
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
  /** نقطة استقرار ابتدائية: نصف أو كامل */
  snap?: "half" | "full";
  /** تسمية زر الإغلاق السفلي */
  closeLabel?: string;
  /** محتوى ثابت فوق الزر السفلي (اختياري) */
  footer?: ReactNode;
  className?: string;
  /** يُستدعى عند الفتح لتركيز عنصر داخل الشيت */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
};

/**
 * شيت سفلي موحّد للجوال — مقبض سحب، إغلاق أسفل، حجاب، Escape، حصر تركيز.
 * كل النوافذ المتنقلة يجب أن تمر عبر هذا المكوّن.
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
  initialFocusRef,
}: Props) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const dragStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    if (!open) {
      setDragOffset(0);
      return;
    }
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    const prevScrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.classList.add("app-sheet-open", "filter-sheet-open");

    // ركّز حاوية الشيت فقط — لا أول حقل (يمنع فتح الكيبورد على iOS).
    const focusTarget = initialFocusRef?.current ?? sheetRef.current;
    const frame = window.requestAnimationFrame(() => {
      focusTarget?.focus({ preventScroll: true });
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
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
      document.body.classList.remove("app-sheet-open", "filter-sheet-open");
      window.scrollTo(0, prevScrollY);
      document.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose, initialFocusRef]);

  if (!open || typeof document === "undefined") return null;

  const onHandlePointerDown = (e: ReactPointerEvent) => {
    dragStartY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onHandlePointerMove = (e: ReactPointerEvent) => {
    if (dragStartY.current == null) return;
    setDragOffset(Math.max(0, e.clientY - dragStartY.current));
  };
  const onHandlePointerUp = () => {
    if (dragOffset > 88) onClose();
    dragStartY.current = null;
    setDragOffset(0);
  };

  return createPortal(
    <div className="app-sheet-overlay">
      <button
        type="button"
        className="app-sheet-overlay__scrim"
        aria-label="إغلاق"
        onClick={onClose}
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
        <header className="app-sheet__head">
          <h2 id={titleId} className="app-sheet__title">{title}</h2>
        </header>
        <div className="app-sheet__body">{children}</div>
        {footer ? <div className="app-sheet__footer-slot">{footer}</div> : null}
        <div className="app-sheet__footer">
          <button type="button" className="app-sheet__close" onClick={onClose}>
            {closeLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
