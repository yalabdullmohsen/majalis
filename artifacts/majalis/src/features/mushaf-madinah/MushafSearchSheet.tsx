import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getSurahMeta, SURAH_START_PAGES } from "@/lib/quran-api";
import { findMushafPageForAyah } from "./mushaf-page-for-ayah";
import { searchVersesInCorpus } from "@/lib/quran-search-verses";

type Hit = {
  surah: number;
  ayah: number;
  page: number;
  surahName: string;
  preview: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onGotoPage: (page: number, verseKey?: string) => void;
};

/** بحث آيات مستقل — لا يضغط إطار المصحف. */
export function MushafSearchSheet({ open, onClose, onGotoPage }: Props) {
  const titleId = useId();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
      setError(null);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const t = window.setTimeout(() => {
      void searchVersesInCorpus(q, 24)
        .then((rows) => {
          if (cancelled) return;
          const next: Hit[] = rows.map((r) => {
            const surah = r.surahNumber;
            const ayah = r.ayahNumber;
            const page = r.page || findMushafPageForAyah(surah, ayah);
            return {
              surah,
              ayah,
              page,
              surahName: r.surahName || getSurahMeta(surah).name,
              preview: String(r.text ?? "").slice(0, 90),
            };
          });
          setHits(next);
          if (next.length === 0) setError("لا نتائج");
        })
        .catch(() => {
          if (!cancelled) setError("تعذّر البحث");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [open, query]);

  const surahHints = useMemo(
    () =>
      [1, 2, 9, 18, 19].map((n) => ({
        n,
        name: getSurahMeta(n).name,
        page: SURAH_START_PAGES[n - 1] ?? 1,
      })),
    [],
  );

  if (!open) return null;

  return createPortal(
    <div className="mm-search-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} data-testid="mushaf-search-sheet">
      <button type="button" className="mm-search-sheet__scrim" aria-label="إغلاق البحث" onClick={onClose} />
      <div className="mm-search-sheet__panel">
        <div className="mm-search-sheet__head">
          <h2 id={titleId}>بحث في المصحف</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق">
            إغلاق
          </button>
        </div>
        <label className="mm-search-sheet__field">
          <span className="sr-only">نص البحث</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن آية أو كلمة…"
            dir="rtl"
            enterKeyHint="search"
          />
        </label>
        {loading ? <p className="mm-search-sheet__status">جاري البحث…</p> : null}
        {error && !loading ? <p className="mm-search-sheet__status">{error}</p> : null}
        <ul className="mm-search-sheet__list" role="listbox" aria-label="نتائج البحث">
          {hits.map((h) => (
            <li key={`${h.surah}:${h.ayah}`}>
              <button
                type="button"
                onClick={() => {
                  onGotoPage(h.page, `${h.surah}:${h.ayah}`);
                  onClose();
                }}
              >
                <span className="mm-search-sheet__meta">
                  {h.surahName} · آية {h.ayah} · ص {h.page}
                </span>
                <span className="mm-search-sheet__preview" dir="rtl" lang="ar">
                  {h.preview}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {query.trim().length < 2 ? (
          <div className="mm-search-sheet__hints">
            <p>انتقال سريع لبداية سورة:</p>
            <div className="mm-search-sheet__chips">
              {surahHints.map((s) => (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => {
                    onGotoPage(s.page);
                    onClose();
                  }}
                >
                  {s.name} · ص {s.page}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
