/**
 * QuranActionBar — floating ayah actions (scaffold).
 *
 * Planned: Play · Tafseer · Bookmark · Repeat · Share
 * Status: empty template — wire to AudioEngine + TafseerService next.
 */

export type QuranActionBarAyah = {
  surah: number;
  ayah: number;
  verseKey: string;
  page: number;
  text: string;
};

export type QuranActionBarProps = {
  ayah: QuranActionBarAyah | null;
  onClose?: () => void;
};

export function QuranActionBar({ ayah, onClose }: QuranActionBarProps) {
  if (!ayah) return null;

  return (
    <div className="quran-action-bar quran-action-bar--scaffold" dir="rtl" role="dialog" aria-label="إجراءات الآية">
      {/* TODO: Play / Tafseer / Bookmark / Repeat / Share */}
      <p>
        {ayah.verseKey}
      </p>
      {onClose ? (
        <button type="button" onClick={onClose}>
          إغلاق
        </button>
      ) : null}
    </div>
  );
}

export default QuranActionBar;
