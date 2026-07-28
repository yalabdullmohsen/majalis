/**
 * Flutter `showModalBottomSheet` — Master Prompt options:
 * Audio · Tafsir · Copy · Bookmark — callbacks only (loose coupling).
 */
import { BookOpen, Bookmark, BookmarkCheck, Copy, Pause, Play, X } from "lucide-react";
import { createPortal } from "react-dom";
import { IMMERSIVE_PAPER_BG } from "@/lib/quran-immersive";

export type ImmersiveVerseOptionsSheetProps = {
  verseText: string;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onTafsir: () => void;
  onClose: () => void;
  paperBg?: string;
  /** نسخ الآية */
  onCopy?: () => void;
  /** فاصلة مرجعية */
  onToggleBookmark?: () => void;
  bookmarked?: boolean;
  copyStatus?: string | null;
};

export function ImmersiveVerseOptionsSheet({
  verseText,
  isPlaying,
  onTogglePlayback,
  onTafsir,
  onClose,
  paperBg = IMMERSIVE_PAPER_BG,
  onCopy,
  onToggleBookmark,
  bookmarked = false,
  copyStatus = null,
}: ImmersiveVerseOptionsSheetProps) {
  const sheet = (
    <div
      className="immersive-verse-sheet-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="immersive-verse-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="خيارات الآية"
        style={{ backgroundColor: paperBg }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="immersive-verse-sheet__handle" aria-hidden="true" />
        <div className="immersive-verse-sheet__head">
          <p className="immersive-verse-sheet__preview">{verseText}</p>
          <button
            type="button"
            className="immersive-verse-sheet__close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {copyStatus ? (
          <p className="immersive-verse-sheet__status" role="status">
            {copyStatus}
          </p>
        ) : null}
        <ul className="immersive-verse-sheet__list">
          <li>
            <button
              type="button"
              className="immersive-verse-sheet__row"
              onClick={onTogglePlayback}
            >
              {isPlaying ? (
                <Pause size={20} aria-hidden="true" />
              ) : (
                <Play size={20} aria-hidden="true" />
              )}
              <span>{isPlaying ? "إيقاف" : "استماع"}</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className="immersive-verse-sheet__row"
              onClick={() => {
                onTafsir();
                onClose();
              }}
            >
              <BookOpen size={20} aria-hidden="true" />
              <span>تفسير الآية</span>
            </button>
          </li>
          {onCopy ? (
            <li>
              <button type="button" className="immersive-verse-sheet__row" onClick={onCopy}>
                <Copy size={20} aria-hidden="true" />
                <span>نسخ الآية</span>
              </button>
            </li>
          ) : null}
          {onToggleBookmark ? (
            <li>
              <button
                type="button"
                className="immersive-verse-sheet__row"
                onClick={onToggleBookmark}
              >
                {bookmarked ? (
                  <BookmarkCheck size={20} aria-hidden="true" />
                ) : (
                  <Bookmark size={20} aria-hidden="true" />
                )}
                <span>{bookmarked ? "إزالة الفاصلة" : "إضافة فاصلة"}</span>
              </button>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );

  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}

export default ImmersiveVerseOptionsSheet;
