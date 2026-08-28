import { Link } from "wouter";

type Props = {
  searchInputId: string;
  mushafHref: string;
  mushafLabel?: string;
};

/** هيدر خفيف بلا lucide — يقلّل TBT على الشاشة الأولى. */
export function StartHeader({ searchInputId, mushafHref, mushafLabel = "المصحف" }: Props) {
  const focusSearch = () => {
    const el = document.getElementById(searchInputId);
    if (!el) return;
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    el.focus({ preventScroll: true });
  };

  return (
    <header className="mj-start-header" dir="rtl">
      <Link href="/settings" className="mj-start-header__icon-btn" aria-label="الإعدادات">
        ⚙
      </Link>
      <div className="mj-start-header__end">
        <button type="button" className="mj-start-header__pill" onClick={focusSearch}>
          بحث
        </button>
        <Link href={mushafHref} className="mj-start-header__pill mj-start-header__pill--accent">
          {mushafLabel}
        </Link>
      </div>
    </header>
  );
}
