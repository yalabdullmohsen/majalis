import { BookOpen, Bookmark, BookmarkCheck, Copy, Play, Share2 } from "lucide-react";
import { createPortal } from "react-dom";
import { getSurahMeta } from "@/lib/quran-api";
import { parseVerseKey } from "./mushaf-page-for-ayah";

type Props = {
  verseKey: string;
  previewText: string;
  bookmarked: boolean;
  copyStatus: string | null;
  onPlay: () => void;
  onTafsir: () => void;
  onCopy: () => void;
  onShare: () => void;
  onToggleBookmark: () => void;
  onClose: () => void;
};

/** قائمة إجراءات الآية — تشغيل، تفسير، نسخ، مشاركة، علامة. */
export function MushafAyahActions({
  verseKey,
  previewText,
  bookmarked,
  copyStatus,
  onPlay,
  onTafsir,
  onCopy,
  onShare,
  onToggleBookmark,
  onClose,
}: Props) {
  const parsed = parseVerseKey(verseKey);
  const surahName = parsed ? getSurahMeta(parsed.surah).name : "";
  const title = parsed ? `${surahName} · ${parsed.ayah}` : verseKey;

  return createPortal(
    <div className="mm-ayah-sheet" data-testid="mushaf-ayah-actions">
      <button type="button" className="mm-ayah-sheet__backdrop" aria-label="إغلاق" onClick={onClose} />
      <div className="mm-ayah-sheet__panel" role="dialog" aria-modal="true" aria-label="خيارات الآية">
        <div className="mm-ayah-sheet__handle" aria-hidden="true" />
        <div className="mm-ayah-sheet__head">
          <div>
            <p className="mm-ayah-sheet__title">{title}</p>
            <p className="mm-ayah-sheet__preview">{previewText}</p>
          </div>
          <button type="button" className="mm-ayah-sheet__close" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </div>
        {copyStatus ? (
          <p className="mm-ayah-sheet__status" role="status">
            {copyStatus}
          </p>
        ) : null}
        <ul className="mm-ayah-sheet__list">
          <li>
            <button type="button" onClick={onPlay}>
              <Play size={18} aria-hidden="true" />
              <span>تشغيل التلاوة</span>
            </button>
          </li>
          <li>
            <button type="button" onClick={onTafsir}>
              <BookOpen size={18} aria-hidden="true" />
              <span>التفسير</span>
            </button>
          </li>
          <li>
            <button type="button" onClick={onCopy}>
              <Copy size={18} aria-hidden="true" />
              <span>نسخ</span>
            </button>
          </li>
          <li>
            <button type="button" onClick={onShare}>
              <Share2 size={18} aria-hidden="true" />
              <span>مشاركة</span>
            </button>
          </li>
          <li>
            <button type="button" onClick={onToggleBookmark}>
              {bookmarked ? <BookmarkCheck size={18} aria-hidden="true" /> : <Bookmark size={18} aria-hidden="true" />}
              <span>{bookmarked ? "إزالة العلامة" : "حفظ علامة"}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>,
    document.body,
  );
}
