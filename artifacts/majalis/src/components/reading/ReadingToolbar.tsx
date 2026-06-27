import { useCallback, useState } from "react";
import { Link } from "wouter";
import { FavoriteButton } from "@/components/FavoriteButton";

type Props = {
  text: string;
  title?: string;
  contentType?: string;
  contentId?: string;
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

/** Minimal actions only — reading prefs live in /settings */
export function ReadingToolbar({
  text,
  title = "نص",
  contentType,
  contentId,
  showSave = false,
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
        /* cancelled */
      }
    }
    await handleCopy();
  }, [text, title, handleCopy]);

  return (
    <div className="reading-toolbar reading-toolbar--minimal">
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
        <Link href="/settings" className="reading-toolbar__btn reading-toolbar__settings">
          إعدادات القراءة
        </Link>
      </div>
    </div>
  );
}

export default ReadingToolbar;
