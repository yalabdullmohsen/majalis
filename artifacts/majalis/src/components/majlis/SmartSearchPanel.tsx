/**
 * Flutter `SmartSearchEngine` UI — category chips + filtered results.
 */
import { useMemo, useState } from "react";
import { ArrowRight, Bookmark, BookOpen, Gavel, History, Search, X } from "lucide-react";
import {
  filterSmartSearch,
  SEARCH_CATEGORY_LABELS,
  type SearchCategory,
  type SmartSearchItem,
} from "@/lib/smart-search-engine";
import "@/styles/majlisilm-shell.css";

export type SmartSearchPanelProps = {
  open: boolean;
  onClose: () => void;
  onSelect?: (item: SmartSearchItem) => void;
};

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "quran":
      return <BookOpen size={18} aria-hidden="true" />;
    case "fiqh":
      return <Gavel size={18} aria-hidden="true" />;
    case "sirah":
      return <History size={18} aria-hidden="true" />;
    default:
      return <Bookmark size={18} aria-hidden="true" />;
  }
}

export function SmartSearchPanel({ open, onClose, onSelect }: SmartSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>("all");

  const results = useMemo(
    () => filterSmartSearch(query, category),
    [query, category],
  );

  if (!open) return null;

  return (
    <div className="smart-search" role="dialog" aria-modal="true" aria-label="بحث ذكي" dir="rtl">
      <div className="smart-search__bar">
        <button type="button" className="smart-search__back" onClick={onClose} aria-label="رجوع">
          <ArrowRight size={20} aria-hidden="true" />
        </button>
        <div className="smart-search__input-wrap">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في القرآن والفقه والسيرة…"
            autoFocus
            aria-label="نص البحث"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="مسح">
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="smart-search__chips" role="tablist" aria-label="تصنيف البحث">
        {(Object.keys(SEARCH_CATEGORY_LABELS) as SearchCategory[]).map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={category === cat}
            className={`smart-search__chip${category === cat ? " is-on" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {SEARCH_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <ul className="smart-search__results">
        {results.map((item) => (
          <li key={`${item.category}-${item.title}`}>
            <button
              type="button"
              className="smart-search__row"
              onClick={() => {
                onSelect?.(item);
                onClose();
              }}
            >
              <span className="smart-search__icon">
                <CategoryIcon category={item.category} />
              </span>
              <span className="smart-search__text">
                <strong>{item.title}</strong>
                <small>{item.sub}</small>
              </span>
            </button>
          </li>
        ))}
        {results.length === 0 ? (
          <li className="smart-search__empty">لا نتائج مطابقة</li>
        ) : null}
      </ul>
    </div>
  );
}

export default SmartSearchPanel;
