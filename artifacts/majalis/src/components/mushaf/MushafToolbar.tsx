type Props = {
  page: number;
  totalPages: number;
  zoom: number;
  isBookmarked: boolean;
  indexOpen: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onToggleIndex: () => void;
  onToggleBookmark: () => void;
  onToggleFullscreen: () => void;
  resumePage: number | null;
  onResume: () => void;
};

export function MushafToolbar({
  page,
  totalPages,
  zoom,
  isBookmarked,
  indexOpen,
  onPrev,
  onNext,
  onPageChange,
  onZoomChange,
  onToggleIndex,
  onToggleBookmark,
  onToggleFullscreen,
  resumePage,
  onResume,
}: Props) {
  return (
    <div className="mushaf-toolbar ui-card" role="toolbar" aria-label="أدوات المصحف">
      <div className="mushaf-toolbar__row">
        <button type="button" className="mushaf-toolbar__btn" onClick={onPrev} disabled={page <= 1} aria-label="الصفحة السابقة">
          ←
        </button>
        <label className="mushaf-toolbar__page-jump">
          <span className="sr-only">رقم الصفحة</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={page}
            onChange={(e) => onPageChange(Number(e.target.value))}
            aria-label="انتقال لرقم الصفحة"
          />
          <span>/ {totalPages}</span>
        </label>
        <button type="button" className="mushaf-toolbar__btn" onClick={onNext} disabled={page >= totalPages} aria-label="الصفحة التالية">
          →
        </button>
      </div>

      <div className="mushaf-toolbar__row mushaf-toolbar__actions">
        <button type="button" className={`mushaf-toolbar__btn${indexOpen ? " is-active" : ""}`} onClick={onToggleIndex}>
          الفهرس
        </button>
        <button type="button" className={`mushaf-toolbar__btn${isBookmarked ? " is-active" : ""}`} onClick={onToggleBookmark} aria-pressed={isBookmarked}>
          {isBookmarked ? "★ محفوظ" : "☆ علامة"}
        </button>
        {resumePage && (
          <button type="button" className="mushaf-toolbar__btn mushaf-toolbar__btn--accent" onClick={onResume}>
            آخر قراءة: {resumePage}
          </button>
        )}
        <button type="button" className="mushaf-toolbar__btn" onClick={() => onZoomChange(zoom - 10)} disabled={zoom <= 80} aria-label="تصغير">
          A−
        </button>
        <span className="mushaf-toolbar__zoom-label">{zoom}%</span>
        <button type="button" className="mushaf-toolbar__btn" onClick={() => onZoomChange(zoom + 10)} disabled={zoom >= 160} aria-label="تكبير">
          A+
        </button>
        <button type="button" className="mushaf-toolbar__btn" onClick={onToggleFullscreen} aria-label="ملء الشاشة">
          ⛶
        </button>
      </div>
    </div>
  );
}

export default MushafToolbar;
