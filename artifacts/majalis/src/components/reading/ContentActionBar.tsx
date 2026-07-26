import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { FavoriteButton } from "@/components/FavoriteButton";
import { readPreferences, writePreferences } from "@/lib/user-preferences";
import { AdminInlineEdit, type InlineEditContentType } from "@/components/AdminInlineEdit";
import {
  isSavedOffline,
  saveOfflineReading,
  listOfflineReading,
  removeOfflineReading,
} from "@/lib/offline-reading-pack";

const FaidaImageCardModal = lazy(() =>
  import("@/components/fawaid/FaidaImageCardModal").then((m) => ({ default: m.FaidaImageCardModal }))
);

type Props = {
  text: string;
  title?: string;
  contentType?: string;
  contentId?: string;
  showSave?: boolean;
  /** حفظ النص للقراءة لاحقًا / دون اتصال على الجهاز */
  showOfflineSave?: boolean;
  showReadingMode?: boolean;
  showPrint?: boolean;
  showImageCard?: boolean;
  imageCardCategory?: string;
  imageCardSource?: string;
  adminEdit?: { contentType: InlineEditContentType; initialData?: Record<string, unknown> };
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
  title,
  contentType,
  contentId,
  showSave = false,
  showOfflineSave = true,
  showReadingMode = true,
  showPrint = false,
  showImageCard = false,
  imageCardCategory,
  imageCardSource,
  adminEdit,
}: Props) {
  const [showCardModal, setShowCardModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [readingMode, setReadingMode] = useState(() => readPreferences().readingMode);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); }, []);

  useEffect(() => {
    setOfflineSaved(isSavedOffline(contentType, contentId));
  }, [contentType, contentId]);

  const handleCopy = useCallback(async () => {
    const ok = await copyText(text);
    if (ok) {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      setCopied(true);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1800);
    }
  }, [text]);

  const toggleReadingMode = useCallback(() => {
    const next = !readingMode;
    setReadingMode(next);
    writePreferences({ readingMode: next });
  }, [readingMode]);

  const toggleOffline = useCallback(() => {
    if (offlineSaved) {
      const match = listOfflineReading().find(
        (i) =>
          (contentType && contentId && i.contentType === contentType && i.contentId === contentId) ||
          i.title === (title || "محتوى"),
      );
      if (match) removeOfflineReading(match.id);
      setOfflineSaved(false);
      return;
    }
    saveOfflineReading({
      title: title || "محتوى محفوظ",
      text,
      contentType,
      contentId,
    });
    setOfflineSaved(true);
  }, [offlineSaved, contentType, contentId, title, text]);

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

      {adminEdit && contentId && (
        <AdminInlineEdit
          contentType={adminEdit.contentType}
          contentId={contentId}
          initialData={adminEdit.initialData}
          className="content-action-bar__btn"
        />
      )}
      {showSave && contentType && contentId && (
        <FavoriteButton contentType={contentType} contentId={contentId} title={title} compact />
      )}
      {showOfflineSave && text.trim().length > 0 && (
        <button
          type="button"
          className={`content-action-bar__btn${offlineSaved ? " content-action-bar__btn--active" : ""}`}
          onClick={toggleOffline}
          aria-pressed={offlineSaved}
          title="حفظ النص للقراءة لاحقًا على هذا الجهاز"
        >
          {offlineSaved ? "محفوظ لاحقًا" : "قراءة لاحقًا"}
        </button>
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
      {showImageCard && (
        <button
          type="button"
          className="content-action-bar__btn content-action-bar__btn--card"
          onClick={() => setShowCardModal(true)}
          title="تنزيل كبطاقة صورة"
        >
          🖼 بطاقة
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

      {showImageCard && showCardModal && (
        <Suspense fallback={null}>
          <FaidaImageCardModal
            text={text}
            source={imageCardSource}
            category={imageCardCategory}
            onClose={() => setShowCardModal(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

export default ContentActionBar;
