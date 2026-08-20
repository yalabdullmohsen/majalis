import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getSurahMeta, SURAH_START_PAGES } from "@/lib/quran-api";
import { arabicMatchAny, normalizeArabic } from "@/lib/arabic-search";
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
  mode?: "search" | "index";
  onClose: () => void;
  onGotoPage: (page: number, verseKey?: string) => void;
};

const ALL_SURAHS = Array.from({ length: 114 }, (_, i) => {
  const n = i + 1;
  return {
    n,
    name: getSurahMeta(n).name,
    page: SURAH_START_PAGES[n - 1] ?? 1,
  };
});

/** لوحة جانبية: فهرس السور + بحث متساهل + أدوات القارئ. */
export function MushafSearchSheet({ open, mode = "search", onClose, onGotoPage }: Props) {
  const titleId = useId();
  const [tab, setTab] = useState<"surahs" | "search">(mode === "index" ? "surahs" : "search");
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
    setTab(mode === "index" ? "surahs" : "search");
  }, [open, mode]);

  useEffect(() => {
    if (!open || tab !== "search") return;
    const q = query.trim();
    if (q.length < 1) {
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
              preview: String(r.text ?? "").slice(0, 120),
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
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [open, query, tab]);

  const filteredSurahs = useMemo(() => {
    const q = query.trim();
    if (!q || tab !== "surahs") return ALL_SURAHS;
    const nq = normalizeArabic(q);
    const asNum = Number.parseInt(q.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))), 10);
    return ALL_SURAHS.filter((s) => {
      if (Number.isFinite(asNum) && (s.n === asNum || s.page === asNum)) return true;
      return arabicMatchAny([s.name], q) || normalizeArabic(s.name).includes(nq);
    });
  }, [query, tab]);

  if (!open) return null;

  return createPortal(
    <div
      className="mm-search-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-testid="mushaf-search-sheet"
      data-mode={mode}
    >
      <button type="button" className="mm-search-sheet__scrim" aria-label="إغلاق" onClick={onClose} />
      <div className="mm-search-sheet__panel">
        <div className="mm-search-sheet__head">
          <h2 id={titleId}>{tab === "surahs" ? "فهرس السور" : "بحث في المصحف"}</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق">
            إغلاق
          </button>
        </div>
        <div className="mm-search-sheet__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "surahs"}
            className={tab === "surahs" ? "is-active" : ""}
            onClick={() => setTab("surahs")}
          >
            السور
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "search"}
            className={tab === "search" ? "is-active" : ""}
            onClick={() => setTab("search")}
          >
            بحث الآيات
          </button>
        </div>
        <label className="mm-search-sheet__field">
          <span className="sr-only">{tab === "surahs" ? "بحث سورة" : "نص البحث"}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === "surahs" ? "اسم السورة أو رقمها…" : "ابحث عن آية أو كلمة…"}
            dir="rtl"
            enterKeyHint="search"
          />
        </label>
        {tab === "surahs" ? (
          <ul className="mm-search-sheet__list mm-search-sheet__list--surahs" role="listbox" aria-label="فهرس السور">
            {filteredSurahs.map((s) => (
              <li key={s.n}>
                <button
                  type="button"
                  onClick={() => {
                    onGotoPage(s.page);
                    onClose();
                  }}
                >
                  <span className="mm-search-sheet__meta">
                    {s.n}. {s.name}
                  </span>
                  <span className="mm-search-sheet__preview">ص {s.page}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
