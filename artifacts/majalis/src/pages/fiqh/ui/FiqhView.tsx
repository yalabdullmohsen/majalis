import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { BookOpen, ChevronLeft, Search, X } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo-structured-data";
import { ShareButtons } from "@/components/ContentActions";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { FIQH_HUB_STATS } from "@/lib/fiqh-hub-stats";
import { formatAbwabCount, formatMasailCount } from "@/lib/arabic-count";
import {
  FIQH_CATEGORY_LABELS,
  FIQH_CATEGORY_ORDER,
  chapterHref,
  fiqhBookBlurb,
  fiqhBookCounts,
  publishedBooks,
  searchFiqhCatalog,
  type FiqhBook,
  type FiqhBookCategory,
  type FiqhChapterHit,
  type FiqhLessonHit,
} from "@/lib/fiqh-books";
import "@/styles/pages/fiqh-hub.css";

function FiqhHubSearch({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(() => Boolean(query.trim()));
  const expanded = open || Boolean(query.trim());

  return (
    <div className="fiqh-hub-search fiqh-hub-search--compact">
      {expanded ? (
        <label className="fiqh-hub-search__field" htmlFor="fiqh-hub-search-input">
          <span className="sr-only">بحث الفقه</span>
          <input
            id="fiqh-hub-search-input"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="ابحث في الكتب والأبواب والمسائل…"
            autoComplete="off"
            enterKeyHint="search"
          />
          <button
            type="button"
            className="fiqh-hub-search__icon-btn"
            aria-label="إغلاق البحث"
            onClick={() => {
              onQueryChange("");
              setOpen(false);
            }}
          >
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </label>
      ) : (
        <button
          type="button"
          className="fiqh-hub-search__icon-btn"
          aria-label="بحث"
          onClick={() => setOpen(true)}
        >
          <Search size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function BookCard({ book }: { book: FiqhBook }) {
  const counts = fiqhBookCounts(book);
  const blurb = fiqhBookBlurb(book);
  return (
    <Link
      href={`/fiqh/books/${book.id}`}
      className="fiqh-book-card"
      aria-label={`${book.title} — ${formatAbwabCount(counts.chapters)} · ${formatMasailCount(counts.lessons)}`}
    >
      <span className="fiqh-book-card__icon" aria-hidden="true">
        <BookOpen size={18} strokeWidth={1.9} />
      </span>
      <span className="fiqh-book-card__body">
        <span className="fiqh-book-card__title">{book.title}</span>
        {blurb ? <span className="fiqh-book-card__desc">{blurb}</span> : null}
        <span className="fiqh-book-card__meta">
          {formatAbwabCount(counts.chapters)} · {formatMasailCount(counts.lessons)}
        </span>
      </span>
      <span className="fiqh-book-card__go" aria-hidden="true">
        <ChevronLeft size={16} strokeWidth={2.5} />
      </span>
    </Link>
  );
}

function SearchHitList({
  books,
  chapters,
  lessons,
}: {
  books: FiqhBook[];
  chapters: FiqhChapterHit[];
  lessons: FiqhLessonHit[];
}) {
  if (books.length === 0 && chapters.length === 0 && lessons.length === 0) {
    return <p className="fiqh-lux-empty">لا نتائج مطابقة داخل الفقه — جرّب كلمة أخرى.</p>;
  }

  return (
    <div className="fiqh-search-results">
      {books.length > 0 ? (
        <section className="fiqh-hub-section" aria-labelledby="fiqh-search-books">
          <h3 id="fiqh-search-books" className="fiqh-hub-section__title">
            كتب
          </h3>
          <div className="fiqh-book-grid">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      ) : null}

      {chapters.length > 0 ? (
        <section className="fiqh-hub-section" aria-labelledby="fiqh-search-chapters">
          <h3 id="fiqh-search-chapters" className="fiqh-hub-section__title">
            أبواب
          </h3>
          <ul className="fiqh-lux-chapter-list">
            {chapters.slice(0, 24).map((hit) => (
              <li key={`${hit.book.id}-${hit.chapter.id}`}>
                <Link href={chapterHref(hit.book.id, hit.chapter.id)} className="fiqh-lux-chapter__head">
                  <span className="fiqh-lux-chapter__body">
                    <span className="fiqh-lux-chapter__title">{hit.chapter.title}</span>
                    <span className="fiqh-lux-chapter__count">{hit.book.title}</span>
                  </span>
                  <span className="fiqh-lux-chapter__go" aria-hidden="true">
                    <ChevronLeft size={16} strokeWidth={2.5} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {lessons.length > 0 ? (
        <section className="fiqh-hub-section" aria-labelledby="fiqh-search-lessons">
          <h3 id="fiqh-search-lessons" className="fiqh-hub-section__title">
            مسائل
          </h3>
          <ul className="fiqh-lux-lesson-list fiqh-lux-lesson-list--standalone">
            {lessons.slice(0, 24).map((hit) => (
              <li key={hit.lesson.id}>
                <Link href={hit.href} className="fiqh-lux-lesson-link">
                  <span className="fiqh-lux-lesson-link__body">
                    <span className="fiqh-lux-lesson-link__title">{hit.lesson.title}</span>
                    <span className="fiqh-lux-lesson-link__sum">
                      {hit.book.title} ← {hit.chapter.title}
                    </span>
                  </span>
                  <span className="fiqh-lux-lesson-link__go" aria-hidden="true">
                    <ChevronLeft size={16} strokeWidth={2.5} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function FiqhBooksBody() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FiqhBookCategory | "all">("all");

  const books = useMemo(() => {
    const all = publishedBooks();
    if (category === "all") return all;
    return all.filter((book) => book.category === category);
  }, [category]);

  const searchResults = useMemo(
    () => (query.trim() ? searchFiqhCatalog(query) : null),
    [query],
  );

  return (
    <div className="fiqh-lux-page fiqh-hub-layout">
      <div className="fiqh-hub-controls">
        <div className="fiqh-hub-filters" role="group" aria-label="تصنيف الكتب">
          <button
            type="button"
            className={category === "all" ? "is-active" : undefined}
            onClick={() => setCategory("all")}
          >
            الكل
          </button>
          {FIQH_CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              type="button"
              className={category === cat ? "is-active" : undefined}
              onClick={() => setCategory(cat)}
            >
              {FIQH_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <FiqhHubSearch query={query} onQueryChange={setQuery} />
      </div>

      {searchResults ? (
        <section className="fiqh-hub-section" aria-labelledby="fiqh-search-title">
          <header className="fiqh-hub-section__head">
            <h2 id="fiqh-search-title" className="fiqh-hub-section__title">
              نتائج البحث
            </h2>
          </header>
          <SearchHitList
            books={searchResults.books}
            chapters={searchResults.chapters}
            lessons={searchResults.lessons}
          />
        </section>
      ) : (
        <section className="fiqh-hub-section fiqh-hub-section--books" aria-labelledby="fiqh-books-title">
          <header className="fiqh-hub-section__head">
            <h2 id="fiqh-books-title" className="fiqh-hub-section__title">
              كتب الفقه
            </h2>
          </header>
          <div className="fiqh-book-grid">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          {books.length === 0 ? <p className="fiqh-lux-empty">لا كتب في هذا التصنيف.</p> : null}
        </section>
      )}

      <div className="twh-share">
        <ShareButtons title="الفقه الإسلامي — سُنّة" url="https://www.ssunnah.com/fiqh" />
      </div>
      <ExploreAlsoNav
        title="استكشف أيضًا"
        links={[
          { href: "/hadith", label: "الحديث وعلومه" },
          { href: "/lessons", label: "الدروس العلمية" },
          { href: "/salah-guide", label: "دليل الصلاة" },
          { href: "/zakat", label: "الزكاة" },
        ]}
      />
    </div>
  );
}

export default function FiqhPage() {
  usePageView("fiqh", null);

  useEffect(() => {
    applyPageSeo({
      path: "/fiqh",
      title: "الفقه | سُنّة",
      description:
        "كتب فقه حنبلية مرتبة: الطهارة، الصلاة، الزكاة، الصيام، الاعتكاف، الحج، الجنائز، البيوع، الشركة، الوصايا، النكاح، الأطعمة، الأيمان، الجنايات، القضاء، الجهاد، العتق.",
      keywords: ["فقه إسلامي", "كتب الفقه", "مذهب أحمد", "حنبلي", "سُنّة"],
      jsonLd: [
        webPageJsonLd(
          "الفقه",
          "كتب فقه مرتبة على المذهب الحنبلي: من الطهارة إلى العتق، بأبواب ومسائل موثّقة للتعليم — وليست فتوى شخصية.",
          "/fiqh",
        ),
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "الفقه", path: "/fiqh" },
        ]),
      ],
    });
  }, []);

  const headerStats = useMemo(
    () => [
      { id: "books", label: `${FIQH_HUB_STATS.books} كتاب` },
      { id: "chapters", label: formatAbwabCount(FIQH_HUB_STATS.chapters) },
      { id: "lessons", label: formatMasailCount(FIQH_HUB_STATS.lessons) },
    ],
    [],
  );

  return (
    <SectionTemplatePage
      route="/fiqh"
      title="الفقه"
      subtitle="كتب فقه مرتبة: كتاب ← باب ← مسائل موثّقة على المذهب الحنبلي."
    >
      <div className="fiqh-lux-shell" dir="rtl">
        <p className="fiqh-hub-edu-note" role="note">
          محتوى تعليمي موثّق على المذهب الحنبلي — للفهم والتعلّم، وليس فتوى شخصية من المنصة.
        </p>
        <FiqhBooksBody />
        <section className="fiqh-hub-stats" aria-label="حجم المحتوى">
          {headerStats.map((stat) => (
            <p key={stat.id} className="fiqh-hub-stats__item">
              {stat.label}
            </p>
          ))}
        </section>
      </div>
    </SectionTemplatePage>
  );
}
