import { memo } from "react";
import { getSurahMeta } from "@/lib/quran-api";
import { toArabicDigits } from "@/lib/utils";
import { parseVerseKey } from "@/features/mushaf-madinah/mushaf-page-for-ayah";

type ControlsProps = {
  chromeOpen: boolean;
  pageNumber: number;
  onExit: () => void;
  onSearch: () => void;
  onIndex: () => void;
};

/** طبقة أدوات القراءة — تظهر عند الحاجة فقط */
export const MushafControlsLayer = memo(function MushafControlsLayer({
  chromeOpen,
  pageNumber,
  onExit,
  onSearch,
  onIndex,
}: ControlsProps) {
  return (
    <div className="nm-controls" data-open={chromeOpen ? "1" : "0"} aria-hidden={!chromeOpen}>
      <div className="nm-controls__bar" data-testid="nm-controls-bar">
        <button type="button" className="nm-controls__btn nm-controls__exit" onClick={onExit}>
          خروج
        </button>
        <span className="nm-controls__page" aria-live="polite">
          {toArabicDigits(pageNumber)}
        </span>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button type="button" className="nm-controls__btn" onClick={onIndex}>
            فهرس
          </button>
          <button type="button" className="nm-controls__btn" onClick={onSearch}>
            بحث
          </button>
        </div>
      </div>
    </div>
  );
});

type MenuProps = {
  verseKey: string;
  status: string | null;
  onPlay: () => void;
  onTafsir: () => void;
  onCopy: () => void;
  onBookmark: () => void;
  onClose: () => void;
};

/** قائمة آية مختصرة: تلاوة · تفسير · نسخ · حفظ */
export const MushafVerseMenu = memo(function MushafVerseMenu({
  verseKey,
  status,
  onPlay,
  onTafsir,
  onCopy,
  onBookmark,
  onClose,
}: MenuProps) {
  const parsed = parseVerseKey(verseKey);
  const label = parsed
    ? `${getSurahMeta(parsed.surah).name} · آية ${toArabicDigits(parsed.ayah)}`
    : verseKey;

  return (
    <div
      className="nm-verse-menu"
      data-testid="nm-verse-menu"
      role="dialog"
      aria-label="إجراءات الآية"
    >
      <button
        type="button"
        className="nm-controls__btn"
        onClick={onClose}
        style={{ position: "absolute", insetInlineStart: "0.75rem", top: "0.55rem" }}
        aria-label="إغلاق"
      >
        إغلاق
      </button>
      <span className="nm-verse-menu__label">{label}</span>
      <div className="nm-verse-menu__grid">
        <button type="button" className="nm-verse-menu__action" onClick={onPlay}>
          تلاوة
        </button>
        <button type="button" className="nm-verse-menu__action" onClick={onTafsir}>
          تفسير
        </button>
        <button type="button" className="nm-verse-menu__action" onClick={onCopy}>
          نسخ
        </button>
        <button type="button" className="nm-verse-menu__action" onClick={onBookmark}>
          حفظ
        </button>
      </div>
      <div className="nm-verse-menu__status" aria-live="polite">
        {status ?? ""}
      </div>
    </div>
  );
});
