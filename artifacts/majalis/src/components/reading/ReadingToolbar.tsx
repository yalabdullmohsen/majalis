import { useCallback, useState } from "react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareCardModal } from "@/components/platform/ShareCardModal";
import { BookmarkNoteButton } from "@/components/platform/BookmarkNoteButton";

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
  const [shareOpen, setShareOpen] = useState(false);
  const contentKey = contentType && contentId ? `${contentType}:${contentId}` : "";

  const handleCopy = useCallback(async () => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }, [text]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch {
        /* user cancelled */
      }
    }
    setShareOpen(true);
  }, [text, title]);

  return (
    <>
      <div className="reading-toolbar reading-toolbar--compact">
        <div className="reading-toolbar__group">
          <button type="button" className="reading-toolbar__btn" onClick={handleCopy}>
            {copied ? "تم النسخ" : "نسخ"}
          </button>
          <button type="button" className="reading-toolbar__btn" onClick={handleShare}>
            مشاركة
          </button>
          {showSave && contentType && contentId && (
            <FavoriteButton
              contentType={contentType}
              contentId={contentId}
              title={title}
              compact
            />
          )}
          {contentKey && (
            <BookmarkNoteButton
              contentKey={contentKey}
              title={title}
              href={typeof window !== "undefined" ? window.location.pathname : "/"}
            />
          )}
        </div>
        {!hideFontControls || !hideReadingModeToggle ? null : null}
      </div>
      <ShareCardModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={title}
        subtitle={text.slice(0, 120)}
      />
    </>
  );
}

export default ReadingToolbar;
