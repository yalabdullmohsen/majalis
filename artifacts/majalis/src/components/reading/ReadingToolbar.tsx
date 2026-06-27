import { useCallback, useState } from "react";
import { FavoriteButton } from "@/components/FavoriteButton";

type Props = {
  text: string;
  title?: string;
  contentType?: string;
  contentId?: string;
  /** @deprecated Font controls moved to Settings */
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  readingMode?: boolean;
  onReadingModeChange?: (enabled: boolean) => void;
  showSave?: boolean;
  hideFontControls?: boolean;
  hideReadingModeToggle?: boolean;
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
  showSave = false,
  hideFontControls = true,
  hideReadingModeToggle = true,
}: Props) {
  const [copied, setCopied] = useState(false);

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
    <div className="reading-toolbar reading-toolbar--compact">
      <div className="reading-toolbar__group">
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
      {/* Legacy props kept for API compat; controls hidden by default */}
      {!hideFontControls || !hideReadingModeToggle ? null : null}
    </div>
  );
}

export default ReadingToolbar;
