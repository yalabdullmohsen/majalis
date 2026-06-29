import type { KuwaitMushafState } from "@/hooks/useKuwaitMushaf";

type Props = {
  mushaf: KuwaitMushafState;
};

export function MushafBottomNav({ mushaf }: Props) {
  const pct = Math.round((mushaf.page / mushaf.totalPages) * 100);

  return (
    <nav className="km-bottom-nav" aria-label="تنقل المصحف">
      <div className="km-bottom-nav__progress" aria-hidden>
        <div className="km-bottom-nav__bar" style={{ width: `${pct}%` }} />
      </div>
      <div className="km-bottom-nav__row">
        <button
          type="button"
          className="km-bottom-nav__btn"
          disabled={!mushaf.prevPage}
          onClick={() => mushaf.prevPage && mushaf.setPage(mushaf.prevPage)}
          aria-label="الصفحة السابقة"
        >
          →
        </button>
        <span className="km-bottom-nav__label">
          {mushaf.page} / {mushaf.totalPages}
          <small>{pct}%</small>
        </span>
        <button
          type="button"
          className="km-bottom-nav__btn"
          disabled={!mushaf.nextPage}
          onClick={() => mushaf.nextPage && mushaf.setPage(mushaf.nextPage)}
          aria-label="الصفحة التالية"
        >
          ←
        </button>
      </div>
    </nav>
  );
}

export default MushafBottomNav;
