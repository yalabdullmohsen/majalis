import { useCallback, useState } from "react";
import { FavoriteButton } from "@/components/FavoriteButton";

type Props = {
  text: string;
  title?: string;
  contentType?: string;
  contentId?: string;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  readingMode?: boolean;
  onReadingModeChange?: (enabled: boolean) => void;
  showSave?: boolean;
};

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ReadingToolbar({
  text,
  title = "نص",
  contentType,
  contentId,
  fontSize: controlledSize,
  onFontSizeChange,
  readingMode: controlledReading,
  onReadingModeChange,
  showSave = false,
}: Props) {
  const [internalSize, setInternalSize] = useState(100);
  const [internalReading, setInternalReading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fontSize = controlledSize ?? internalSize;
  const readingMode = controlledReading ?? internalReading;

  const setFontSize = (size: number) => {
    const next = Math.min(140, Math.max(85, size));
    if (onFontSizeChange) onFontSizeChange(next);
    else setInternalSize(next);
  };

  const setReadingMode = (enabled: boolean) => {
    if (onReadingModeChange) onReadingModeChange(enabled);
    else setInternalReading(enabled);
  };

  const handleCopy = useCallback(async () => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }, [text]);

  const handleShare = useCallback(async () => {
    const payload = { title, text };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        /* user cancelled */
      }
    }
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, [text, title]);

  return (
    <div className="reading-toolbar" data-font-size={fontSize} data-reading-mode={readingMode}>
      <div className="reading-toolbar__group">
        <button type="button" className="reading-toolbar__btn" onClick={() => setFontSize(fontSize - 5)} aria-label="تصغير الخط">
          أ−
        </button>
        <span className="reading-toolbar__size">{fontSize}%</span>
        <button type="button" className="reading-toolbar__btn" onClick={() => setFontSize(fontSize + 5)} aria-label="تكبير الخط">
          أ+
        </button>
      </div>
      <div className="reading-toolbar__group">
        <button
          type="button"
          className={`reading-toolbar__btn${readingMode ? " reading-toolbar__btn--active" : ""}`}
          onClick={() => setReadingMode(!readingMode)}
        >
          {readingMode ? "خروج القراءة" : "وضع القراءة"}
        </button>
        <button type="button" className="reading-toolbar__btn" onClick={handleCopy}>
          {copied ? "تم النسخ" : "نسخ"}
        </button>
        <button type="button" className="reading-toolbar__btn" onClick={handleShare}>
          مشاركة
        </button>
        {showSave && contentType && contentId && (
          <FavoriteButton contentType={contentType} contentId={contentId} compact />
        )}
      </div>
    </div>
  );
}

export default ReadingToolbar;
