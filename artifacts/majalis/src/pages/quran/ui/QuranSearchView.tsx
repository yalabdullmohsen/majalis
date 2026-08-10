/**
 * شاشة بحث الآيات — منفصلة عن بحث انتقال السور في مركز القرآن.
 * عرض فقط: فصل البسملة، أسماء بلا تشكيل، إبراز، تجميع باسم السورة.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, X } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { toArabicDigits } from "@/lib/utils";
import {
  loadQuranVerseDatabase,
  searchVerses,
  QURAN_SEARCH_RESULT_LIMIT,
  type QuranVerseSearchItem,
} from "@/lib/quran-search-verses";
import { displayAyahSnippet, displaySurahName } from "@/lib/quran-display";
import { matchSurahNumber } from "@/features/search/mushaf-jump";
import { highlightOriginalParts, scoreTolerantMatch } from "@/features/search/tolerant-match";
import { getSurahMeta, SURAH_START_PAGES } from "@/lib/quran-api";
import { mushafPageHref } from "@/lib/quran-surah-list";
import { PageHeader } from "@/components/ui-common";
import { VirtualList } from "@/components/VirtualList";
import "@/styles/pages/quran-search.css";

const DEBOUNCE_MS = 200;

function HighlightText({ text, query }: { text: string; query: string }) {
  const parts = highlightOriginalParts(text, query);
  if (parts.length === 1 && !parts[0]!.hit) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="quran-search-page__mark">{p.text}</mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

export default function QuranSearchPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [database, setDatabase] = useState<QuranVerseSearchItem[] | null>(null);
  const [loadingDb, setLoadingDb] = useState(true);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    applyPageSeo({
      path: "/quran/search",
      title: "بحث في القرآن الكريم | المجلس العلمي",
      description:
        "ابحث في نص آيات القرآن الكريم محليًا، واعرض النتائج في شاشة بحث منفصلة مع رابط مباشر إلى المصحف.",
      keywords: ["بحث القرآن", "بحث الآيات", "المصحف", "آيات قرآنية"],
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingDb(true);
    setDbError(false);
    loadQuranVerseDatabase()
      .then((db) => {
        if (!cancelled) setDatabase(db);
      })
      .catch(() => {
        if (!cancelled) setDbError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingDb(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(searchQuery.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  /** إن كان الاستعلام باسم سورة (مطابقة قوية) — بطاقة واحدة لا نتائج آيات. */
  const surahOnly = useMemo(() => {
    if (!debounced) return null;
    const n = matchSurahNumber(debounced);
    if (!n) return null;
    const meta = getSurahMeta(n);
    const m = scoreTolerantMatch(meta.name, debounced);
    if (!m || m.rank > 1) return null; // exact أو prefix فقط
    return {
      number: n,
      name: meta.name,
      ayahs: meta.ayahs,
      revelation: meta.revelation,
      page: SURAH_START_PAGES[n - 1] ?? 1,
    };
  }, [debounced]);

  const allResults = useMemo(() => {
    if (!database || !debounced || surahOnly) return [];
    return searchVerses(debounced, database);
  }, [database, debounced, surahOnly]);

  const results = useMemo(
    () => allResults.slice(0, QURAN_SEARCH_RESULT_LIMIT),
    [allResults],
  );

  const truncated = allResults.length > results.length;

  function openFirst() {
    if (surahOnly) {
      navigate(mushafPageHref(surahOnly.page));
      return;
    }
    const first = results[0];
    if (first) {
      navigate(`/mushaf/${first.surahNumber}?ayah=${first.ayahNumber}`);
    }
  }

  return (
    <div className="ds-page quran-search-page" dir="rtl">
      <PageHeader
        eyebrow="القرآن الكريم"
        title="بحث في الآيات"
        subtitle="شاشة بحث منفصلة عن المصحف — اكتب كلمة أو جملة من نص الآية. لانتقال السور استخدم مركز القرآن."
      />

      <form
        className="quran-search-page__form"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setDebounced(searchQuery.trim());
          openFirst();
          const input = e.currentTarget.querySelector("input");
          input?.blur();
        }}
      >
        <label className="quran-search-page__field">
          <span className="sr-only">نص البحث</span>
          <Search size={18} aria-hidden="true" className="quran-search-page__icon" />
          <input
            className="ds-input quran-search-page__input"
            type="search"
            enterKeyHint="search"
            inputMode="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="مثال: الرحمن، الصلاة، اهدنا الصراط…"
            autoComplete="off"
            disabled={loadingDb || dbError}
            data-search-field="1"
          />
          {searchQuery ? (
            <button
              type="button"
              className="quran-search-page__clear"
              aria-label="مسح البحث"
              onClick={() => setSearchQuery("")}
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </label>
      </form>

      {loadingDb ? (
        <p className="quran-search-page__status" role="status">
          جاري تحميل نص المصحف للبحث المحلي…
        </p>
      ) : null}

      {dbError ? (
        <div className="ds-empty">
          <h2>تعذّر تحميل قاعدة الآيات</h2>
          <p>أعد المحاولة لاحقًا، أو افتح المصحف مباشرة.</p>
          <Link href="/mushaf">المصحف الشريف</Link>
        </div>
      ) : null}

      {!loadingDb && !dbError && !debounced ? (
        <p className="quran-search-page__hint">
          ابدأ بالكتابة لعرض الآيات المطابقة. للانتقال لسورة بالاسم استخدم البحث أعلى مركز القرآن.
        </p>
      ) : null}

      {surahOnly ? (
        <div className="quran-search-page__surah-only">
          <Link
            href={mushafPageHref(surahOnly.page)}
            className="quran-search-page__hit quran-search-page__hit--surah"
          >
            <header>
              <strong>سورة {surahOnly.name}</strong>
              <span className="quran-search-page__ayah-badge">
                سورة {toArabicDigits(surahOnly.number)}
              </span>
            </header>
            <p className="quran-search-page__surah-meta">
              {surahOnly.revelation} · {toArabicDigits(surahOnly.ayahs)} آيات · ص{" "}
              {toArabicDigits(surahOnly.page)}
            </p>
          </Link>
          <p className="quran-search-page__hint">
            نتيجة سورة واحدة — ابحث بكلمة من نص الآية لعرض آيات مطابقة.
          </p>
        </div>
      ) : null}

      {!loadingDb && !dbError && debounced && !surahOnly ? (
        <div className="quran-search-page__meta" aria-live="polite">
          {results.length === 0 ? (
            <span>لا نتائج لـ «{debounced}»</span>
          ) : (
            <span>
              {toArabicDigits(results.length)}
              {truncated ? ` من أصل ${toArabicDigits(allResults.length)}` : ""} نتيجة
            </span>
          )}
        </div>
      ) : null}

      {results.length > 0 ? (
        <VirtualList
          as="ol"
          className="quran-search-page__list"
          items={results}
          estimateSize={110}
          virtualizeAbove={12}
          getItemKey={(hit) => `${hit.surahNumber}:${hit.ayahNumber}`}
          aria-label="نتائج بحث الآيات"
          renderItem={(hit) => {
            const snippet = displayAyahSnippet(
              hit.surahNumber,
              hit.ayahNumber,
              hit.text,
            );
            const name = displaySurahName(hit.surahNumber);
            return (
              <Link
                href={`/mushaf/${hit.surahNumber}?ayah=${hit.ayahNumber}`}
                className="quran-search-page__hit"
              >
                <header>
                  <strong>سورة {name}</strong>
                  <span className="quran-search-page__ayah-badge">
                    الآية {toArabicDigits(hit.ayahNumber)}
                    {hit.page ? ` · ص ${toArabicDigits(hit.page)}` : ""}
                  </span>
                </header>
                <p dir="rtl" className="quran-search-page__ayah-text">
                  <HighlightText text={snippet} query={debounced} />
                </p>
              </Link>
            );
          }}
        />
      ) : null}

      {truncated ? (
        <p className="quran-search-page__hint">
          عُرضت أول {toArabicDigits(QURAN_SEARCH_RESULT_LIMIT)} نتيجة — ضيّق البحث بكلمة أدق.
        </p>
      ) : null}

      <p className="quran-search-page__footer">
        <Link href="/quran-hub">مركز القرآن</Link>
        {" · "}
        <Link href="/mushaf">المصحف</Link>
        {" · "}
        <Link href="/quran/surahs">فهرس السور</Link>
      </p>
    </div>
  );
}
