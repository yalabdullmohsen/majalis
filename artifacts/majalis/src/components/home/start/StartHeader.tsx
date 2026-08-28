import { BookOpen, Search, Settings } from "lucide-react";
import { Link } from "wouter";

type Props = {
  searchInputId: string;
  mushafHref: string;
  mushafLabel?: string;
};

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
        <Settings size={20} strokeWidth={1.75} aria-hidden="true" />
      </Link>
      <div className="mj-start-header__end">
        <button type="button" className="mj-start-header__pill" onClick={focusSearch}>
          <Search size={17} aria-hidden="true" />
          <span>بحث</span>
        </button>
        <Link href={mushafHref} className="mj-start-header__pill mj-start-header__pill--accent">
          <BookOpen size={17} aria-hidden="true" />
          <span>{mushafLabel}</span>
        </Link>
      </div>
    </header>
  );
}
