import { useCallback, useState } from "react";
import { searchQuran, type SearchMatch } from "@/lib/quran-api";

type Props = {
  onGoToResult: (surah: number, ayah: number) => void;
};

export function QuranSearch({ onGoToResult }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    try {
      const r = await searchQuran(q);
      setResults(r.slice(0, 20));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") search();
  }, [search]);

  return (
    <div className="qs-search" role="search" aria-label="البحث في القرآن الكريم">
      <div className="qs-search__row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKey}
          placeholder="ابحث في نص القرآن…"
          className="qs-search__input"
          aria-label="بحث في القرآن"
          dir="rtl"
        />
        <button
          type="button"
          onClick={search}
          disabled={loading || !query.trim()}
          className="qs-search__btn"
        >
          {loading ? "…" : "بحث"}
        </button>
      </div>

      {searched && !loading && results.length === 0 && (
        <p className="qs-search__empty">لم يُعثر على نتائج.</p>
      )}

      {results.length > 0 && (
        <ol className="qs-search__results" role="list">
          {results.map((r) => (
            <li key={`${r.surahNumber}-${r.ayahNumber}`}>
              <button
                type="button"
                className="qs-search__result"
                onClick={() => onGoToResult(r.surahNumber, r.ayahNumber)}
              >
                <span className="qs-search__result-ref">
                  {r.surahName} : {r.ayahNumber}
                </span>
                <span className="qs-search__result-text" lang="ar" dir="rtl">
                  {r.text}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
