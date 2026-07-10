/**
 * QuranSearch، بحث فوري في القرآن الكريم
 * - بحث فوري (live) بـ 300ms debounce
 * - تطبيع عربي: تشكيل، همزة، تاء مربوطة، ألف مقصورة
 * - تظليل الكلمة المطابقة
 * - فلاتر: سورة، نوع (مع/بدون تشكيل)
 * - سجل بحث محلي
 * - المصدر: AlQuran Cloud API فقط، لا توليد AI
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Clock, Search } from "lucide-react";
import { searchQuran, type SearchMatch } from "@/lib/quran-api";
import { normalizeArabic } from "@/lib/arabic-search";
import { addSearchHistory, getSearchHistory, clearSearchHistory } from "@/lib/search-history";

type Props = {
  onGoToResult: (surah: number, ayah: number) => void;
};

const DEBOUNCE_MS = 300;
const MAX_RESULTS = 40;
const POPULAR = ["الرحمن", "الإخلاص", "الكرسي", "الفاتحة", "يسين", "النور"];

function buildNormalizedQuery(raw: string): string {
  return normalizeArabic(raw.trim());
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;
  const nText  = normalizeArabic(text);
  const nQuery = normalizeArabic(query.trim());
  if (!nQuery || nQuery.length < 2) return <>{text}</>;
  const idx = nText.indexOf(nQuery);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="gsm-highlight">{text.slice(idx, idx + nQuery.length)}</mark>
      {text.slice(idx + nQuery.length)}
    </>
  );
}

function ResultCard({ match, query, onClick }: { match: SearchMatch; query: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="qss-card">
        <span className="qss-card__ref">{match.surahName} · الآية {match.ayahNumber}</span>
        <span dir="rtl" lang="ar" className="qss-card__text">
          <HighlightText text={match.text} query={query} />
        </span>
      </button>
    </li>
  );
}

function Skeleton() {
  return (
    <div className="qss-skel-pad">
      {[1, 2, 3].map((i) => (
        <div key={i} className="qss-skel-row">
          <div className="qss-skel-line1" />
          <div className="qss-skel-line2" style={{ "--qss-skel-w": `${70 + i * 5}%` } as React.CSSProperties} />
        </div>
      ))}
    </div>
  );
}

export function QuranSearch({ onGoToResult }: Props) {
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<SearchMatch[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(false);
  const [searched, setSearched]     = useState(false);
  const [history, setHistory]       = useState<string[]>(() => getSearchHistory().slice(0, 6));
  const [withTashkeel, setWithTashkeel] = useState(false);
  const [filterSurah, setFilterSurah]   = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async (q: string) => {
    const raw = q.trim();
    if (!raw || raw.length < 2) { setResults([]); setSearched(false); return; }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(false);
    setSearched(true);
    const queryToSend = withTashkeel ? raw : buildNormalizedQuery(raw);
    try {
      const res = await searchQuran(queryToSend);
      addSearchHistory(raw);
      setHistory(getSearchHistory().slice(0, 6));
      setResults(res.slice(0, MAX_RESULTS));
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") setError(true);
    } finally {
      setLoading(false);
    }
  }, [withTashkeel]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    timerRef.current = setTimeout(() => doSearch(query), DEBOUNCE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, doSearch]);

  const filteredResults = useMemo(() => {
    if (!filterSurah) return results;
    return results.filter((r) => r.surahNumber === filterSurah);
  }, [results, filterSurah]);

  const surahsInResults = useMemo(() => {
    const m = new Map<number, string>();
    for (const r of results) m.set(r.surahNumber, r.surahName);
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [results]);

  const filterBtnStyle = (active: boolean, fs?: string) => ({
    "--qss-bg":     active ? "var(--majalis-sage)" : "transparent",
    "--qss-border": active ? "var(--majalis-emerald)" : "var(--majalis-line)",
    "--qss-color":  active ? "var(--majalis-emerald-deep)" : "var(--majalis-ink-soft)",
    ...(fs ? { "--qss-fs": fs } : {}),
  } as React.CSSProperties);

  return (
    <div role="search" aria-label="البحث في القرآن الكريم" className="qss-wrap">
      <div className="qss-input-row">
        <span className="qss-icon"><Search size={16} /></span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في كامل القرآن الكريم..."
          aria-label="بحث في القرآن"
          dir="rtl"
          autoComplete="off"
          className="qss-input"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setResults([]); setSearched(false); }}
            aria-label="مسح"
            className="qss-clear"
          >
            ✕
          </button>
        )}
        {loading && <span className="qss-loading">○</span>}
      </div>

      <div className="qss-opts">
        <button
          type="button"
          onClick={() => setWithTashkeel((v) => !v)}
          className="qss-filter-btn"
          style={filterBtnStyle(withTashkeel)}
        >
          {withTashkeel ? "✓ مع التشكيل" : "بدون تشكيل"}
        </button>

        {surahsInResults.length > 1 && (
          <div className="qss-surah-filters">
            <button
              type="button"
              onClick={() => setFilterSurah(null)}
              className="qss-filter-btn"
              style={filterBtnStyle(filterSurah === null, "0.72rem")}
            >
              الكل ({results.length})
            </button>
            {surahsInResults.slice(0, 5).map(([num, name]) => (
              <button
                key={num}
                type="button"
                onClick={() => setFilterSurah(filterSurah === num ? null : num)}
                className="qss-filter-btn"
                style={filterBtnStyle(filterSurah === num, "0.72rem")}
              >
                {name} ({results.filter((r) => r.surahNumber === num).length})
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="qss-body">
        {!query.trim() && (
          <div className="qss-prebody">
            {history.length > 0 && (
              <div className="qss-hist-wrap">
                <div className="qss-hist-head">
                  <span className="qss-hist-label">بحثت سابقاً</span>
                  <button type="button" onClick={() => { clearSearchHistory(); setHistory([]); }} className="qss-hist-clear">
                    مسح
                  </button>
                </div>
                <div className="qss-pills">
                  {history.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setQuery(h)}
                      className="qss-pill"
                    >
                      <Clock size={12} className="inline ml-1" />{h}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className="qss-popular-label">بحث شائع</span>
              <div className="qss-pills">
                {POPULAR.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuery(p)}
                    className="qss-pill qss-pill--popular"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading && <Skeleton />}

        {error && !loading && (
          <div className="qss-error">
            <p><AlertTriangle size={14} className="inline ml-1" />تعذر الاتصال بالمصدر.</p>
            <button type="button" onClick={() => doSearch(query)} className="qss-retry-btn">
              أعد المحاولة
            </button>
          </div>
        )}

        {searched && !loading && !error && filteredResults.length === 0 && (
          <div className="qss-empty">
            <p>لا نتائج لـ «{query}»</p>
            <p className="qss-empty-hint">
              جرّب تبسيط الكلمة أو الضغط على "مع التشكيل" لبحث أدق.
            </p>
          </div>
        )}

        {filteredResults.length > 0 && !loading && (
          <>
            <p className="qss-results-hdr">
              {filteredResults.length} نتيجة · المصدر: AlQuran Cloud (حفص عن عاصم)
            </p>
            <ol className="qss-results-list">
              {filteredResults.map((r) => (
                <ResultCard
                  key={`${r.surahNumber}-${r.ayahNumber}`}
                  match={r}
                  query={query}
                  onClick={() => onGoToResult(r.surahNumber, r.ayahNumber)}
                />
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
