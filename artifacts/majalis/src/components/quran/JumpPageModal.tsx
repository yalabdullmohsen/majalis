/**
 * Jump-to-page modal — web port of the RN mushaf sketch
 * (`isJumpModalVisible` / `inputPage` / `handleJump` for pages 1–604).
 */
import { useEffect, useId, useRef, useState } from "react";
import { BookOpen } from "lucide-react";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/components/jump-page-modal.css";

export const MUSHAF_TOTAL_PAGES = 604;

export type JumpPageModalProps = {
  open: boolean;
  currentPage: number;
  totalPages?: number;
  onClose: () => void;
  /** Navigate + persist; caller should clamp/save (e.g. goToPage). */
  onJump: (page: number) => void;
};

export function JumpPageModal({
  open,
  currentPage,
  totalPages = MUSHAF_TOTAL_PAGES,
  onClose,
  onJump,
}: JumpPageModalProps) {
  const [inputPage, setInputPage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    setInputPage(String(currentPage));
    setError(null);
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [open, currentPage]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleJump = () => {
    const pageNum = Number.parseInt(inputPage, 10);
    if (Number.isFinite(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onJump(pageNum);
      onClose();
      setInputPage("");
      setError(null);
      return;
    }
    setError(`يرجى إدخال رقم صفحة صحيح بين 1 و ${totalPages}`);
  };

  /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- modal dismiss; Esc handled above */
  return (
    <div className="mpv-jump-backdrop" role="presentation" onClick={onClose}>
      <div
        className="mpv-jump-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mpv-jump-dialog__icon" aria-hidden="true">
          <BookOpen size={22} />
        </div>
        <h2 id={titleId} className="mpv-jump-dialog__title">
          الانتقال إلى صفحة
        </h2>
        <p id={descId} className="mpv-jump-dialog__hint">
          أدخل رقمًا بين {toArabicDigits(1)} و{toArabicDigits(totalPages)}
        </p>
        <label className="mpv-jump-dialog__label" htmlFor="mpv-jump-page-input">
          رقم الصفحة
        </label>
        <input
          ref={inputRef}
          id="mpv-jump-page-input"
          type="number"
          className="mpv-jump-dialog__input"
          inputMode="numeric"
          min={1}
          max={totalPages}
          value={inputPage}
          onChange={(e) => {
            setInputPage(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleJump();
            }
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "mpv-jump-error" : undefined}
        />
        {error ? (
          <p id="mpv-jump-error" className="mpv-jump-dialog__error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mpv-jump-dialog__actions">
          <button type="button" className="mpv-jump-dialog__cancel" onClick={onClose}>
            إلغاء
          </button>
          <button type="button" className="mpv-jump-dialog__ok" onClick={handleJump}>
            انتقال
          </button>
        </div>
      </div>
    </div>
  );
  /* eslint-enable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
}

export default JumpPageModal;
