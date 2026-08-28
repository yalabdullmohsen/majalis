import { type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

export type QuranSheetSnap = "peek" | "half" | "full";

type Props = {
  open: boolean;
  ariaLabel: string;
  title?: string;
  titleId?: string;
  onClose: () => void;
  children: ReactNode;
  /** peek = 140px · half · full */
  snap?: QuranSheetSnap;
  className?: string;
  panelClassName?: string;
  panelRef?: RefObject<HTMLDivElement | null>;
  zIndex?: number;
  /** سحب للتوسيع/الطي */
  onDragEnd?: (dy: number) => void;
  testId?: string;
};

const SNAP_CLASS: Record<QuranSheetSnap, string> = {
  peek: "quran-sheet--peek",
  half: "quran-sheet--half",
  full: "quran-sheet--full",
};

/** غلاف موحّد لقوائم المصحف السفلية. */
export function QuranSheetShell({
  open,
  ariaLabel,
  title,
  titleId,
  onClose,
  children,
  snap = "half",
  className = "",
  panelClassName = "",
  panelRef,
  zIndex = 9999,
  onDragEnd,
  testId,
}: Props) {
  if (!open) return null;

  let dragY: number | null = null;

  return createPortal(
    <div
      className={`quran-sheet ${SNAP_CLASS[snap]} ${className}`.trim()}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={titleId}
      data-testid={testId}
      style={{ position: "fixed", inset: 0, zIndex, display: "grid", alignItems: "end", pointerEvents: "none" }}
    >
      <button type="button" className="quran-sheet__scrim" aria-label="إغلاق" onClick={onClose} style={{ pointerEvents: "auto" }} />
      <div
        ref={panelRef}
        className={`quran-sheet__panel ${panelClassName}`.trim()}
        style={{ pointerEvents: "auto", width: "100%" }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button, input, select, a, textarea")) {
            dragY = null;
            return;
          }
          dragY = e.clientY;
        }}
        onPointerUp={(e) => {
          const start = dragY;
          dragY = null;
          if (start == null || !onDragEnd) return;
          onDragEnd(e.clientY - start);
        }}
        onPointerCancel={() => {
          dragY = null;
        }}
      >
        <div className="quran-sheet__handle" aria-hidden="true" />
        {title || titleId ? (
          <header className="quran-sheet__head">
            {title ? (
              <h2 id={titleId} className="quran-sheet__title">
                {title}
              </h2>
            ) : (
              <span id={titleId} />
            )}
            <button type="button" className="quran-sheet__close" onClick={onClose} aria-label="إغلاق">
              <X size={18} aria-hidden="true" />
            </button>
          </header>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}
