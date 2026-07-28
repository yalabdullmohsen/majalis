/**
 * Flutter `TafsirModalViewer` — ميسر sheet over parchment.
 */
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "@/styles/majlisilm-shell.css";

export type TafsirModalViewerProps = {
  verseText: string;
  tafsirText: string;
  onClose: () => void;
  open?: boolean;
};

export function TafsirModalViewer({
  verseText,
  tafsirText,
  onClose,
  open = true,
}: TafsirModalViewerProps) {
  if (!open) return null;

  const modal = (
    <div className="tafsir-modal-overlay">
      <button
        type="button"
        className="tafsir-modal-overlay__backdrop"
        aria-label="إغلاق"
        onClick={onClose}
      />
      <div
        className="tafsir-modal"
        role="dialog"
        aria-modal="true"
        aria-label="التفسير الميسر"
      >
        <div className="tafsir-modal__handle" aria-hidden="true" />
        <button
          type="button"
          className="tafsir-modal__close"
          onClick={onClose}
          aria-label="إغلاق"
        >
          <X size={18} aria-hidden="true" />
        </button>
        <div className="tafsir-modal__verse">{verseText}</div>
        <h3 className="tafsir-modal__heading">التفسير الميسر:</h3>
        <hr className="tafsir-modal__divider" />
        <div className="tafsir-modal__body">
          <p>{tafsirText}</p>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}

/** Flutter `TafsirModalViewer.show`. */
export function showTafsirModal(
  setState: (v: { verse: string; tafsir: string } | null) => void,
  verse: string,
  tafsir: string,
): void {
  setState({ verse, tafsir });
}

export default TafsirModalViewer;
