/**
 * Jump-to-page modal — يقبل أرقامًا عربية/إنجليزية ومرجع آية (سورة:آية) واسم سورة.
 */
import { useEffect, useId, useRef, useState } from "react";
import { BookOpen } from "lucide-react";
import { toArabicDigits } from "@/lib/utils";
import { parseMushafJumpQuery, type MushafJumpTarget } from "@/features/search/mushaf-jump";
import "@/styles/components/jump-page-modal.css";

export const MUSHAF_TOTAL_PAGES = 604;

export type JumpPageModalProps = {
  open: boolean;
  currentPage: number;
  totalPages?: number;
  onClose: () => void;
  /** انتقال لصفحة أو آية بعد تحليل الاستعلام المطبّع. */
  onJump: (target: MushafJumpTarget) => void;
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
    /* لا تركيز تلقائي — يمنع فتح الكيبورد على iOS دون نقر صريح. */
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
    const target = parseMushafJumpQuery(inputPage);
    if (!target) {
      setError(`أدخل رقم صفحة (1–${totalPages}) أو سورة:آية أو اسم سورة`);
      return;
    }
    if (target.kind === "page" && (target.page < 1 || target.page > totalPages)) {
      setError(`يرجى إدخال رقم صفحة صحيح بين 1 و ${totalPages}`);
      return;
    }
    onJump(target);
    onClose();
    setInputPage("");
    setError(null);
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
          الانتقال في المصحف
        </h2>
        <p id={descId} className="mpv-jump-dialog__hint">
          صفحة ({toArabicDigits(1)}–{toArabicDigits(totalPages)}) أو سورة:آية مثل ٢:٢٥٥ أو اسم سورة
        </p>
        <label className="mpv-jump-dialog__label" htmlFor="mpv-jump-page-input">
          صفحة أو آية أو سورة
        </label>
        <input
          ref={inputRef}
          id="mpv-jump-page-input"
          type="search"
          className="mpv-jump-dialog__input"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoFocus={false}
          placeholder="٢٨٣ أو 2:255 أو البقرة"
          value={inputPage}
          onChange={(e) => {
            setInputPage(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleJump();
              inputRef.current?.blur();
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
