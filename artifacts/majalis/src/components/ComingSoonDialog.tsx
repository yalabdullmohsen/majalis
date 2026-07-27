import { Sparkles, X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
};

export function ComingSoonDialog({ open, title, onClose }: Props) {
  if (!open) return null;

  return (
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
    <div className="bottom-sheet-overlay" role="presentation" onClick={onClose}>
      <div
        className="bottom-sheet coming-soon-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`${title} قريبًا`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bottom-sheet__handle" />
        <div className="bottom-sheet__head">
          <span>قريبًا</span>
          <button
            type="button"
            onClick={onClose}
            className="bottom-sheet__close-btn"
            aria-label="إغلاق"
          >
            <X size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        <div className="bottom-sheet__body">
          <div className="coming-soon-dialog__body">
            <Sparkles size={26} strokeWidth={1.8} aria-hidden="true" />
            <h2 className="coming-soon-dialog__title">{title}</h2>
            <p className="coming-soon-dialog__text">
              هذا القسم قيد التطوير حاليًا، وسيظهر كاملًا عند اكتمال التجهيز.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComingSoonDialog;
