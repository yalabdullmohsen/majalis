/**
 * شريط بحث المصحف — بحث ضبابي محلّي مع تمييز فوري للكلمات.
 */
import { useEffect, useId, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { toArabicDigits } from "@/lib/utils";
import {
  highlightSearchText,
  searchQuranLocal,
  warmQuranSearchIndex,
  type QuranSearchHit,
} from "@/lib/quran-local-search";
import { yieldToMain } from "@/lib/yield-to-main";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (hit: QuranSearchHit) => void;
};

export function QuranSearchPanel({ open, onClose, onSelect }: Props) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<QuranSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    setIndexing(true);
    const ac = new AbortController();
    void warmQuranSearchIndex(ac.signal)
      .then(() => setIndexing(false))
      .catch(() => setIndexing(false));
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => {
      ac.abort();
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const q = query.trim();
    if (!q) {
      setHits([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const timer = window.setTimeout(() => {
      void (async () => {
        await yieldToMain();
        try {
          const results = await searchQuranLocal(q, { limit: 36, signal: ac.signal });
          if (ac.signal.aborted) return;
          setHits(results);
        } catch {
          if (!ac.signal.aborted) setError("تعذّر إكمال البحث.");
        } finally {
          if (!ac.signal.aborted) setLoading(false);
        }
      })();
    }, 160);
    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [query, open]);

  if (!open) return null;

  return (
    <div className="qsp-overlay" onClick={onClose} role="presentation">
      <div
        className="qsp-panel"
        role="dialog"
        aria-modal="true"
        aria-label="بحث في القرآن"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="qsp-panel__head">
          <label htmlFor={inputId} className="qsp-panel__label">
            <Search size={16} aria-hidden="true" />
            بحث في المصحف
          </label>
          <button type="button" className="qsp-panel__close" onClick={onClose} aria-label="إغلاق البحث">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <input
          id={inputId}
          ref={inputRef}
          className="qsp-panel__input"
          type="search"
          dir="rtl"
          placeholder="كلمة، جذر، سورة:آية، جزء 30، صفحة 2…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          enterKeyHint="search"
        />

        <p className="qsp-panel__hint">
          يتجاهل التشكيل والهمزات تلقائيًا · جرّب «البقرة 255» أو «جزء 30» أو جذرًا تقريبيًا
          {indexing ? " · جارٍ تجهيز الفهرس…" : ""}
        </p>

        <div className="qsp-panel__results" role="listbox" aria-label="نتائج البحث">
          {loading && (
            <p className="qsp-panel__status">
              <Loader2 size={14} className="qsp-spin" aria-hidden="true" /> جارٍ البحث…
            </p>
          )}
          {error && <p className="qsp-panel__status">{error}</p>}
          {!loading && !error && query.trim() && hits.length === 0 && (
            <p className="qsp-panel__status">لا نتائج مطابقة.</p>
          )}
          {hits.map((hit) => {
            const parts = highlightSearchText(hit.text, query);
            return (
              <button
                key={`${hit.surahNumber}:${hit.ayahNumber}`}
                type="button"
                role="option"
                className="qsp-hit"
                onClick={() => onSelect(hit)}
              >
                <span className="qsp-hit__meta">
                  {hit.surahName} · آية {toArabicDigits(hit.ayahNumber)} · ص {toArabicDigits(hit.page)}
                </span>
                <span className="qsp-hit__text" dir="rtl">
                  {parts.map((p, i) =>
                    p.hit ? (
                      <mark key={i} className="qsp-hit__mark">
                        {p.text}
                      </mark>
                    ) : (
                      <span key={i}>{p.text}</span>
                    ),
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default QuranSearchPanel;
