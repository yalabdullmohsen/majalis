import { ArrowRight } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getSurahMeta, JUZ_START_PAGES, SURAH_START_PAGES } from "@/lib/quran-api";
import { arabicMatchAny, normalizeArabic } from "@/lib/arabic-search";
import { MUSHAF_PAGE_MAX, MUSHAF_PAGE_MIN, parseMushafPageQuery } from "@/lib/quran-last-page";
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
  const meta = getSurahMeta(n);
  const page = SURAH_START_PAGES[n - 1] ?? 1;
  return {
    n,
    name: meta.name,
    page,
    ayahs: meta.ayahs,
    revelation: meta.revelation,
    juz: juzForPage(page),
  };
});

const ALL_JUZ = JUZ_START_PAGES.map((page, i) => ({
  n: i + 1,
  page,
}));

function juzForPage(page: number): number {
  let j = 1;
  for (let i = 0; i < JUZ_START_PAGES.length; i++) {
    if (JUZ_START_PAGES[i]! <= page) j = i + 1;
    else break;
  }
  return j;
}

/** بحث علوي + فهرس السور/الأجزاء — لا لوحة سفلية. */
export function MushafSearchSheet({ open, mode = "search", onClose, onGotoPage }: Props) {
  const titleId = useId();
  const [tab, setTab] = useState<"surahs" | "search" | "juz">(mode === "index" ? "surahs" : "search");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const typingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setTab(mode === "index" ? "surahs" : "search");
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }, [open, mode]);

  useEffect(() => {
    if (!open || tab !== "search") return;
    const q = query.trim();
    const asPage = parseMushafPageQuery(q);
    if (asPage != null) {
      setHits([]);
      setLoading(false);
      if (asPage < MUSHAF_PAGE_MIN || asPage > MUSHAF_PAGE_MAX) {
        setError("رقم الصفحة يجب أن يكون بين ١ و٦٠٤");
      } else {
        setError(null);
      }
      return;
    }
    if (q.length < 1) {
      setHits([]);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const t = window.setTimeout(() => {
      void searchVersesInCorpus(q, 48)
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
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [open, query, tab]);

  const filteredSurahs = useMemo(() => {
    const q = query.trim();
    if (!q || tab !== "surahs") return ALL_SURAHS;
    const nq = normalizeArabic(q);
    const asNum = parseMushafPageQuery(q);
    return ALL_SURAHS.filter((s) => {
      if (asNum != null && (s.n === asNum || s.page === asNum)) return true;
      return arabicMatchAny([s.name], q) || normalizeArabic(s.name).includes(nq);
    });
  }, [query, tab]);

  const pageHint = parseMushafPageQuery(query.trim());
  const pageValid = pageHint != null && pageHint >= MUSHAF_PAGE_MIN && pageHint <= MUSHAF_PAGE_MAX;

  const goPage = (n: number, verseKey?: string) => {
    onGotoPage(n, verseKey);
    onClose();
  };

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
      <button
        type="button"
        className="mm-search-sheet__scrim"
        aria-label="إغلاق"
        onMouseDown={(e) => {
          if (typingRef.current) {
            e.preventDefault();
            inputRef.current?.focus();
          }
        }}
        onClick={() => {
          if (typingRef.current) return;
          onClose();
        }}
      />
      <div className="mm-search-sheet__panel">
        <form
          className="mm-search-sheet__form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (pageHint == null) return;
            if (!pageValid) {
              setError("رقم الصفحة يجب أن يكون بين ١ و٦٠٤");
              return;
            }
            goPage(pageHint);
          }}
        >
          {mode === "index" ? (
            <div className="mm-search-sheet__index-head">
              <button type="button" className="mm-search-sheet__back" onClick={onClose} aria-label="رجوع">
                <ArrowRight size={18} aria-hidden="true" />
              </button>
              <h2 id={titleId}>الفهرس</h2>
            </div>
          ) : (
            <div className="mm-search-sheet__head">
              <h2 id={titleId}>بحث في المصحف</h2>
              <button type="button" onClick={onClose} aria-label="إغلاق البحث">
                إغلاق
              </button>
            </div>
          )}
          {mode === "index" ? (
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
                aria-selected={tab === "juz"}
                className={tab === "juz" ? "is-active" : ""}
                onClick={() => setTab("juz")}
              >
                الأرباع
              </button>
            </div>
          ) : null}
          <label className="mm-search-sheet__field">
            <span className="sr-only">نص البحث أو رقم الصفحة</span>
            <input
              ref={inputRef}
              type="text"
              inputMode={pageHint != null ? "numeric" : "search"}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError(null);
              }}
              onFocus={() => {
                typingRef.current = true;
              }}
              onBlur={() => {
                window.setTimeout(() => {
                  typingRef.current = false;
                }, 180);
              }}
              placeholder={
                mode === "index" ? "اسم السورة أو رقمها…" : "كلمة، آية، اسم سورة، أو رقم صفحة…"
              }
              dir="rtl"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
            />
          </label>
        </form>
        {tab === "search" && pageValid ? (
          <p className="mm-search-sheet__status">
            انتقال إلى الصفحة {pageHint} — اضغط إدخال
            {" "}
            <button type="button" className="mm-search-sheet__go" onClick={() => goPage(pageHint!)}>
              انتقال
            </button>
          </p>
        ) : null}
        {tab === "juz" ? (
          <div className="mm-search-sheet__body">
            <ul className="mm-search-sheet__list mm-search-sheet__list--surahs mm-search-sheet__list--index" role="listbox" aria-label="الأجزاء">
              {ALL_JUZ.map((j) => (
                <li key={j.n}>
                  <button type="button" onClick={() => goPage(j.page)}>
                    <span className="mm-search-sheet__meta">الجزء {j.n}</span>
                    <span className="mm-search-sheet__preview">ص {j.page}</span>
                  </button>
                </li>
              ))}
            </ul>
            <nav className="mm-search-sheet__juz-rail" aria-label="وصول سريع للأجزاء">
              {ALL_JUZ.map((j) => (
                <button type="button" key={j.n} onClick={() => goPage(j.page)}>
                  {j.n}
                </button>
              ))}
            </nav>
          </div>
        ) : tab === "surahs" ? (
          <div className="mm-search-sheet__body">
            <ul className="mm-search-sheet__list mm-search-sheet__list--surahs mm-search-sheet__list--index" role="listbox" aria-label="فهرس السور">
              {filteredSurahs.map((s) => (
                <li key={s.n}>
                  <button type="button" onClick={() => goPage(s.page)}>
                    <span className="mm-search-sheet__badge">{s.n}</span>
                    <span className="mm-search-sheet__meta">
                      {s.name}
                      <small>
                        ص {s.page} · {s.ayahs} آية · {s.revelation} · الجزء {s.juz}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <nav className="mm-search-sheet__juz-rail" aria-label="وصول سريع للأجزاء">
              {ALL_JUZ.map((j) => (
                <button type="button" key={j.n} onClick={() => goPage(j.page)}>
                  {j.n}
                </button>
              ))}
            </nav>
          </div>
        ) : (
          <>
            {loading ? <p className="mm-search-sheet__status">جاري البحث…</p> : null}
            {error && !loading ? (
              <p className="mm-search-sheet__status" role="alert">
                {error}
              </p>
            ) : null}
            {!loading && !error && !query.trim() ? (
              <p className="mm-search-sheet__status">اكتب كلمة أو رقم صفحة بين ١ و٦٠٤.</p>
            ) : null}
            <ul className="mm-search-sheet__list" role="listbox" aria-label="نتائج البحث">
              {hits.map((h) => (
                <li key={`${h.surah}:${h.ayah}`}>
                  <button
                    type="button"
                    onClick={() => {
                      goPage(h.page, `${h.surah}:${h.ayah}`);
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
