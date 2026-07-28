/**
 * Web port of RN FlatList `renderSurahItem` — surah name + start page,
 * press → navigateToPage(item.page).
 */
import { Link } from "wouter";
import { surahList, mushafPageHref, type SurahListItem } from "@/lib/quran-surah-list";
import { toArabicDigits } from "@/lib/utils";
import { arabicMatchAny } from "@/lib/arabic-search";
import { useMemo, useState } from "react";

export type SurahIndexFlatListProps = {
  /** Highlight the active surah (optional). */
  currentSurah?: number;
  /** Called instead of default Link navigation when provided (e.g. in-mushaf sidebar). */
  onNavigateToPage?: (page: number, item: SurahListItem) => void;
  className?: string;
};

function SurahIndexRow({
  item,
  active,
  onNavigateToPage,
}: {
  item: SurahListItem;
  active?: boolean;
  onNavigateToPage?: SurahIndexFlatListProps["onNavigateToPage"];
}) {
  const label = `${item.name} - صفحة ${toArabicDigits(item.page)}`;

  if (onNavigateToPage) {
    return (
      <button
        type="button"
        className={`surah-flat-item${active ? " is-active" : ""}`}
        onClick={() => onNavigateToPage(item.page, item)}
        aria-current={active ? "true" : undefined}
      >
        <span className="surah-flat-item__id" aria-hidden="true">
          {toArabicDigits(item.id)}
        </span>
        <span className="surah-flat-item__text">{label}</span>
      </button>
    );
  }

  return (
    <Link
      href={mushafPageHref(item.page)}
      className={`surah-flat-item${active ? " is-active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <span className="surah-flat-item__id" aria-hidden="true">
        {toArabicDigits(item.id)}
      </span>
      <span className="surah-flat-item__text">{label}</span>
    </Link>
  );
}

/** FlatList-style surah catalog driven by {@link surahList}. */
export function SurahIndexFlatList({
  currentSurah,
  onNavigateToPage,
  className,
}: SurahIndexFlatListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim();
    if (!term) return surahList;
    return surahList.filter(
      (item) =>
        arabicMatchAny([item.name], term) ||
        String(item.id).startsWith(term) ||
        String(item.page).startsWith(term),
    );
  }, [query]);

  return (
    <div className={`surah-flat-list${className ? ` ${className}` : ""}`} dir="rtl">
      <div className="surah-flat-list__search">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن سورة..."
          aria-label="ابحث عن سورة"
          className="qs-search-input"
        />
      </div>
      <ol className="surah-flat-list__items" aria-label="فهرس السور">
        {filtered.map((item) => (
          <li key={item.id}>
            <SurahIndexRow
              item={item}
              active={currentSurah === item.id}
              onNavigateToPage={onNavigateToPage}
            />
          </li>
        ))}
      </ol>
      {filtered.length === 0 ? (
        <p className="surah-flat-list__empty">لا نتائج مطابقة.</p>
      ) : null}
    </div>
  );
}

export default SurahIndexFlatList;
