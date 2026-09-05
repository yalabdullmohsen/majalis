import { Link, useParams } from "wouter";
import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd, bookJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";
import { Empty } from "@/components/ui-common";
import {
  chapterHref,
  fiqhBookApproxLevel,
  fiqhBookBlurb,
  fiqhBookCounts,
  getVisibleFiqhBook,
  publishedChapters,
  publishedLessonsInChapter,
  resolveFiqhAliasTarget,
} from "@/lib/fiqh-books";
import { formatAbwabCount, formatMasailCount } from "@/lib/arabic-count";
import "@/styles/pages/fiqh-hub.css";

export default function FiqhBookPage() {
  const params = useParams<{ bookId: string }>();
  const bookId = params.bookId ?? "";
  const alias = resolveFiqhAliasTarget(bookId);
  const book = getVisibleFiqhBook(bookId);

  usePageView("fiqh-book", bookId || null);

  useEffect(() => {
    if (!book) return;
    if (alias?.targetChapterId && typeof window !== "undefined") {
      const target = chapterHref(book.id, alias.targetChapterId);
      if (window.location.pathname !== target) {
        window.history.replaceState(null, "", target);
      }
    }
    applyPageSeo({
      path: `/fiqh/books/${book.id}`,
      title: `${book.title} | الفقه | سُنّة`,
      description: fiqhBookBlurb(book).slice(0, 160),
      keywords: [book.title, "فقه", "حنبلي", "سُنّة", ...(book.aliases ?? [])],
      jsonLd: [
        bookJsonLd({
          name: book.title,
          description: fiqhBookBlurb(book),
          url: `/fiqh/books/${book.id}`,
        }),
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "الفقه", path: "/fiqh" },
          { name: book.title, path: `/fiqh/books/${book.id}` },
        ]),
      ],
    });
  }, [book, alias]);

  if (!book) {
    return (
      <div className="fiqh-lux-shell fiqh-lux-book page-shell" dir="rtl">
        <Empty title="كتاب غير منشور" text="هذا الكتاب غير مدرج في الكتب الظاهرة، أو لا أبواب منشورة فيه." />
        <p className="fiqh-lux-empty">
          <Link href="/fiqh">العودة إلى الفقه</Link>
        </p>
      </div>
    );
  }

  const chapters = publishedChapters(book);
  const counts = fiqhBookCounts(book);
  const level = fiqhBookApproxLevel(book);

  return (
    <div className="fiqh-lux-shell fiqh-lux-book page-shell" dir="rtl">
      <nav className="fiqh-lux-crumb" aria-label="مسار التنقل">
        <Link href="/fiqh">الفقه</Link>
        <span aria-hidden="true"> ← </span>
        <span aria-current="page">{book.title}</span>
      </nav>

      <header className="fiqh-lux-book-hero">
        <h1 className="fiqh-lux-book-hero__title">{book.title}</h1>
        <p className="fiqh-lux-book-hero__blurb">{fiqhBookBlurb(book)}</p>
        {book.orderReason ? (
          <p className="fiqh-lux-book-hero__meta" aria-label="سبب الترتيب">
            ترتيب الكتاب: {book.orderReason}
          </p>
        ) : null}
        <p className="fiqh-lux-book-hero__meta">
          {formatAbwabCount(counts.chapters)} · {formatMasailCount(counts.lessons)} · مستوى تقريبي: {level}
        </p>
        {book.aliases && book.aliases.length > 0 ? (
          <p className="fiqh-lux-book-hero__aliases" aria-label="أسماء مدمجة">
            يشمل أيضًا: {book.aliases.join(" · ")}
          </p>
        ) : null}
      </header>

      {book.sources && book.sources.length > 0 ? (
        <section className="fiqh-lux-block" aria-labelledby="fiqh-book-src">
          <h2 id="fiqh-book-src">مصادر الكتاب</h2>
          <ul className="fiqh-lux-sources">
            {book.sources.map((s, i) => (
              <li key={`${s.book}-${i}`}>
                <strong>{s.book}</strong>
                {s.author ? ` — ${s.author}` : ""}
                {s.ref ? `، ${s.ref}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ol className="fiqh-lux-chapter-list">
        {chapters.map((ch, i) => {
          const lessons = publishedLessonsInChapter(ch);
          return (
            <li key={ch.id} className="fiqh-chapter fiqh-chapter--card fiqh-lux-chapter">
              <Link href={chapterHref(book.id, ch.id)} className="fiqh-lux-chapter__head">
                <span className="fiqh-lux-chapter__num">{i + 1}</span>
                <span className="fiqh-lux-chapter__body">
                  <span className="fiqh-lux-chapter__title">{ch.title}</span>
                  {ch.summary ? (
                    <span className="fiqh-lux-chapter__preview">{ch.summary.slice(0, 100)}…</span>
                  ) : null}
                  <span className="fiqh-lux-chapter__count">{formatMasailCount(lessons.length)}</span>
                </span>
                <span className="fiqh-lux-chapter__go" aria-hidden="true">
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="fiqh-fab-clearance" />
    </div>
  );
}
