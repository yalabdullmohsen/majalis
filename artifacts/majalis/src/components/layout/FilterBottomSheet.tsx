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

  // زر الرجوع العام (GlobalBackButton) يتراكب فعليًا مع شرائح الفلاتر هنا رغم
  // z-index أدنى اسميًا — نفس علّة /mushaf/page الموثَّقة سابقًا (اكتُشفت حيًّا
  // بفحص Playwright مباشر: 3 شرائح "فوائد دعوية" وغيرها مغطاة جزئيًا بالزر).
  // نفس الحل: نخفيه صراحةً أثناء فتح هذه الورقة بدل الاعتماد على z-index وحده.
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("filter-sheet-open");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("filter-sheet-open");
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    // نقر الخلفية للإغلاق مصحوب بمعالج Escape فعلي (أعلاه) وزر إغلاق ظاهر —
    // مساران بديلان كاملان بلوحة المفاتيح.
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
    <div className="ds-sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="ds-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        id="filter-bottom-sheet"
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

export function FilterToggle({
  onClick,
  label = "تصفية",
  expanded = false,
}: {
  onClick: () => void;
  label?: string;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      className="ds-filter-toggle"
      onClick={onClick}
      aria-expanded={expanded}
      aria-haspopup="dialog"
      aria-controls="filter-bottom-sheet"
    >
      {label}
    </button>
  );
}
