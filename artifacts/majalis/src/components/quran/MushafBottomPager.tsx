/**
 * شريط سفلي خفيف لتقليب صفحات المصحف — يظهر مع أدوات القراءة ويختفي عند التحديد/القراءة.
 */
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { toArabicDigits } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  visible: boolean;
  onPrev: () => void;
  onNext: () => void;
  onJump: () => void;
  onIndex?: () => void;
};

export function MushafBottomPager({
  page,
  totalPages,
  visible,
  onPrev,
  onNext,
  onJump,
  onIndex,
}: Props) {
  const pct = Math.max(0, Math.min(1, page / Math.max(1, totalPages)));

  return (
    <nav
      className={`mpv-bottom-pager${visible ? " mpv-bottom-pager--shown" : ""}`}
      aria-label="التنقل بين صفحات المصحف"
      aria-hidden={visible ? undefined : true}
      data-mushaf-bottom-pager="1"
    >
      <div className="mpv-bottom-pager__progress" aria-hidden="true">
        <span className="mpv-bottom-pager__progress-fill" style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="mpv-bottom-pager__row">
        <button
          type="button"
          className="mpv-bottom-pager__btn"
          onClick={onPrev}
          disabled={page <= 1}
          aria-label="الصفحة السابقة"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="mpv-bottom-pager__page"
          onClick={onJump}
          aria-label={`الصفحة ${toArabicDigits(page)} من ${toArabicDigits(totalPages)} — انتقال`}
        >
          <span className="mpv-bottom-pager__num">{toArabicDigits(page)}</span>
          <span className="mpv-bottom-pager__sep">/</span>
          <span className="mpv-bottom-pager__total">{toArabicDigits(totalPages)}</span>
        </button>
        {onIndex ? (
          <button
            type="button"
            className="mpv-bottom-pager__btn mpv-bottom-pager__btn--index"
            onClick={onIndex}
            aria-label="فهرس السور"
          >
            <List size={17} aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="button"
          className="mpv-bottom-pager__btn"
          onClick={onNext}
          disabled={page >= totalPages}
          aria-label="الصفحة التالية"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

export default MushafBottomPager;
