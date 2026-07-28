/**
 * Web equivalent of RN `Alert.alert("استراحة قصيرة", …, [{ text: "موافق" }])`.
 */
import { useEffect } from "react";
import { Coffee } from "lucide-react";
import "@/styles/components/reading-break.css";

export type ReadingBreakDialogProps = {
  open: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
};

export function ReadingBreakDialog({ open, title, message, onDismiss }: ReadingBreakDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  if (!open) return null;

  /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- modal dismiss patterns; Esc handled above */
  return (
    <div className="qe-break-backdrop" role="presentation" onClick={onDismiss}>
      <div
        className="qe-break-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="qe-break-title"
        aria-describedby="qe-break-msg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="qe-break-dialog__icon" aria-hidden="true">
          <Coffee size={22} />
        </div>
        <h2 id="qe-break-title" className="qe-break-dialog__title">
          {title}
        </h2>
        <p id="qe-break-msg" className="qe-break-dialog__msg">
          {message}
        </p>
        <button type="button" className="qe-break-dialog__ok" onClick={onDismiss}>
          موافق
        </button>
      </div>
    </div>
  );
  /* eslint-enable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
}

export default ReadingBreakDialog;
