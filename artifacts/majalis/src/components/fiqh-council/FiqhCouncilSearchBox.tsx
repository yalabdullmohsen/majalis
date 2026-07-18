import { useEffect, useState } from "react";
import { Link } from "wouter";
import { searchFiqhCouncil, getFiqhSearchSuggestions } from "@/lib/fiqh-council-service";
import {
  fiqhItemHref,
  formatFiqhItemMeta,
  type FiqhCouncilItem,
} from "@/lib/fiqh-council-types";

function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

type Props = {
  placeholder?: string;
  onResultClick?: () => void;
};

// ملاحظة: خاصية autoFocus حُذفت (كانت غير مستخدَمة فعليًا في أي من نقطتي
// الاستدعاء الحقيقيتين — FiqhCouncilArchivePage/FiqhCouncilPage — كلتاهما لا
// تُمرِّرانها إطلاقًا، فكانت دائمًا false/undefined عمليًا) — إضافة إلى أن
// jsx-a11y/no-autofocus يُحذِّر من autoFocus JSX دائمًا (يخطف التركيز فجأة عن
// المستخدم بلا توقّع)، فحُسم الأمر بالحذف بدل الإبقاء على كود ميت لمشكلة وصول.
export function FiqhCouncilSearchBox({
  placeholder = "ابحث في القرارات والفتاوى والتوصيات...",
  onResultClick,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FiqhCouncilItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounced = useDebouncedValue(query);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    Promise.all([
      searchFiqhCouncil(debounced, 8),
      getFiqhSearchSuggestions(debounced),
    ])
      .then(([searchRes, sugg]) => {
        setResults(searchRes.data);
        setSuggestions(sugg);
        setOpen(true);
      })
      .finally(() => setLoading(false));
  }, [debounced]);

  return (
    <div className="fiqh-search-box">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => debounced.trim() && setOpen(true)}
        placeholder={placeholder}
        className="page-search-input full content-hub-search fiqh-search-input"
        aria-label="بحث في المجمع الفقهي"
        aria-expanded={open}
        aria-controls="fiqh-search-dropdown"
        role="combobox"
      />

      {open && debounced.trim() && (
        <div id="fiqh-search-dropdown" className="fiqh-search-dropdown" role="listbox">
          {loading && <p className="fiqh-search-hint">جارٍ البحث...</p>}

          {!loading && suggestions.length > 0 && (
            <div className="fiqh-search-suggestions">
              <span className="fiqh-search-label">اقتراحات</span>
              <div className="content-hub-chips">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="content-hub-chip"
                    onClick={() => setQuery(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && results.length === 0 && (
            <p className="fiqh-search-hint">لا توجد نتائج.</p>
          )}

          {results.map((item) => (
            <Link
              key={item.slug}
              href={fiqhItemHref(item.slug)}
              className="fiqh-search-result"
              onClick={() => { setOpen(false); onResultClick?.(); }}
              role="option"
            >
              <strong>{item.title}</strong>
              <span>{formatFiqhItemMeta(item)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function useFiqhCouncilSearch(query: string) {
  const debounced = useDebouncedValue(query);
  const [results, setResults] = useState<FiqhCouncilItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    searchFiqhCouncil(debounced, 12)
      .then(({ data }) => setResults(data))
      .finally(() => setLoading(false));
  }, [debounced]);

  return { results, loading, debouncedQuery: debounced };
}
