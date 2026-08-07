/**
 * شاشة بحث القرآن — منفصلة تمامًا عن المصحف (RN search screen sketch).
 * تستخدم `searchVerses` على قاعدة محلية من نص المصحف العثماني.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Search } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { toArabicDigits } from "@/lib/utils";
import {
  loadQuranVerseDatabase,
  searchVerses,
  QURAN_SEARCH_RESULT_LIMIT,
  type QuranVerseSearchItem,
} from "@/lib/quran-search-verses";
import { PageHeader } from "@/components/ui-common";
import "@/styles/pages/quran-search.css";

const DEBOUNCE_MS = 220;

export default function QuranSearchPage() {
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

  const allResults = useMemo(() => {
    if (!database || !debounced) return [];
    return searchVerses(debounced, database);
  }, [database, debounced]);

  const results = useMemo(
    () => allResults.slice(0, QURAN_SEARCH_RESULT_LIMIT),
    [allResults],
  );

  const truncated = allResults.length > results.length;

  return (
    <div className="ds-page quran-search-page" dir="rtl">
      <PageHeader
        eyebrow="القرآن الكريم"
        title="بحث في الآيات"
        subtitle="شاشة بحث منفصلة عن المصحف — اكتب كلمة أو جملة من نص الآية."
      />

      <form
        className="quran-search-page__form"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setDebounced(searchQuery.trim());
        }}
      >
        <label className="quran-search-page__field">
          <span className="sr-only">نص البحث</span>
          <Search size={18} aria-hidden="true" className="quran-search-page__icon" />
          <input
            className="ds-input quran-search-page__input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="مثال: الرحمن، الصلاة، اهدنا الصراط…"
            autoComplete="off"
            enterKeyHint="search"
            disabled={loadingDb || dbError}
          />
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
          ابدأ بالكتابة لعرض الآيات المطابقة. البحث يعمل على النص المحلي دون اتصال بعد التحميل.
        </p>
      ) : null}

      {!loadingDb && !dbError && debounced ? (
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
        <ol className="quran-search-page__list">
          {results.map((hit) => (
            <li key={`${hit.surahNumber}:${hit.ayahNumber}`}>
              <Link
                href={`/mushaf/${hit.surahNumber}?ayah=${hit.ayahNumber}`}
                className="quran-search-page__hit"
              >
                <header>
                  <strong>
                    سورة {hit.surahName.replace(/^سُورَةُ\s*/u, "")}
                  </strong>
                  <span>
                    الآية {toArabicDigits(hit.ayahNumber)}
                    {hit.page ? ` · ص ${toArabicDigits(hit.page)}` : ""}
                  </span>
                </header>
                <p dir="rtl">{hit.text}</p>
              </Link>
            </li>
          ))}
        </ol>
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
