import { useCallback, useState } from "react";
import { Link } from "wouter";
import { FavoriteButton } from "@/components/FavoriteButton";
import { readPreferences, writePreferences } from "@/lib/user-preferences";

type Props = {
  text: string;
  title?: string;
  contentType?: string;
  contentId?: string;
  showSave?: boolean;
  showReadingMode?: boolean;
  showPrint?: boolean;
};

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ContentActionBar({
  text,
  title = "نص",
  contentType,
  contentId,
  showSave = false,
  showReadingMode = true,
  showPrint = false,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [readingMode, setReadingMode] = useState(() => readPreferences().readingMode);

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

  const toggleReadingMode = useCallback(() => {
    const next = !readingMode;
    setReadingMode(next);
    writePreferences({ readingMode: next });
  }, [readingMode]);

  return (
    <div className="content-action-bar" role="toolbar" aria-label="إجراءات المحتوى">
      <button
        type="button"
        className={`content-action-bar__btn${copied ? " content-action-bar__btn--copied" : ""}`}
        onClick={handleCopy}
        aria-live="polite"
      >
        {copied ? "✓ تم النسخ" : "نسخ"}
      </button>
      <button type="button" className="content-action-bar__btn" onClick={handleShare}>
        مشاركة
      </button>
      {showSave && contentType && contentId && (
        <FavoriteButton contentType={contentType} contentId={contentId} compact />
      )}
      {showReadingMode && (
        <button
          type="button"
          className={`content-action-bar__btn${readingMode ? " content-action-bar__btn--active" : ""}`}
          onClick={toggleReadingMode}
          aria-pressed={readingMode}
        >
          وضع القراءة
        </button>
      )}
      {showPrint && (
        <button type="button" className="content-action-bar__btn" onClick={() => window.print()}>
          طباعة
        </button>
      )}
      <Link href="/settings" className="content-action-bar__btn content-action-bar__link">
        إعدادات
      </Link>
    </div>
  );
}

export default ContentActionBar;
