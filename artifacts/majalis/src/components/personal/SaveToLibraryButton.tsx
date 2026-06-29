import { useEffect, useState } from "react";
import { isInLibrary, saveToLibrary, removeFromLibrary, logUserActivity } from "@/lib/personal-learning";
import type { LibraryContentType } from "@/lib/personal-learning";

type Props = {
  contentType: LibraryContentType | string;
  contentId: string;
  title?: string;
  contentUrl?: string;
  metadata?: Record<string, unknown>;
  className?: string;
  compact?: boolean;
};

export function SaveToLibraryButton({
  contentType,
  contentId,
  title,
  contentUrl,
  metadata,
  className = "",
  compact = false,
}: Props) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isInLibrary(contentType, contentId).then((v) => {
      if (!cancelled) setSaved(v);
    });
    return () => { cancelled = true; };
  }, [contentType, contentId]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (saved) {
        const ok = await removeFromLibrary(contentType, contentId);
        if (ok) setSaved(false);
      } else {
        const ok = await saveToLibrary({
          content_type: contentType,
          content_id: contentId,
          title,
          content_url: contentUrl,
          metadata,
        });
        if (ok) {
          setSaved(true);
          await logUserActivity("library_save", contentType, contentId);
        } else {
          alert("يرجى تسجيل الدخول أولاً");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`favorite-btn${saved ? " favorite-btn--active" : ""}${compact ? " favorite-btn--compact" : ""} ${className}`.trim()}
      aria-pressed={saved}
      aria-label={saved ? "إزالة من المكتبة" : "حفظ في المكتبة"}
    >
      {saved ? (compact ? "محفوظ" : "في مكتبتي") : compact ? "حفظ" : "حفظ في مكتبتي"}
    </button>
  );
}

export default SaveToLibraryButton;
