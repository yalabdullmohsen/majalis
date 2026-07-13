import { useEffect, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function FilterBottomSheet({ open, onClose, title = "تصفية وبحث", children }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ds-sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="ds-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="ds-sheet__head">
          <h2>{title}</h2>
          <button type="button" className="ds-sheet__close" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FilterToggle({ onClick, label = "تصفية" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="ds-filter-toggle" onClick={onClick}>
      {label}
    </button>
  );
}
