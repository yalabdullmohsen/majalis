import { Link, useParams } from "wouter";
import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo";
import { usePageView } from "@/hooks/usePageView";
import { Empty } from "@/components/ui-common";
import {
  fiqhBookApproxLevel,
  fiqhBookBlurb,
  fiqhBookCounts,
  getVisibleFiqhBook,
  publishedChapters,
  publishedLessonsInChapter,
} from "@/lib/fiqh-books";
import { formatAbwabCount, formatMasailCount } from "@/lib/arabic-count";
import "@/styles/pages/fiqh-hub.css";

export default function FiqhBookPage() {
  const params = useParams<{ bookId: string }>();
  const bookId = params.bookId ?? "";
  const book = getVisibleFiqhBook(bookId);

  usePageView("fiqh-book", bookId || null);

  useEffect(() => {
    if (!book) return;
    applyPageSeo({
      path: `/fiqh/books/${book.id}`,
      title: `${book.title} | الفقه | المجلس العلمي`,
      description: `${book.title}: أبواب ومسائل فقهية موثَّقة.`,
      keywords: [book.title, "فقه", "المجلس العلمي"],
    });
  }, [book]);

  if (!book) {
    return (
      <div className="fqp-root page-shell fiqh-hub" dir="rtl">
        <Empty title="كتاب غير منشور" text="هذا الكتاب غير مدرج في الكتب الظاهرة، أو لا مسائل منشورة فيه." />
        <p className="fiqh-results__empty"><Link href="/fiqh">العودة إلى الفقه</Link></p>
      </div>
    );
  }

  const chapters = publishedChapters(book);
  const counts = fiqhBookCounts(book);
  const level = fiqhBookApproxLevel(book);

  return (
    <div className="fqp-root page-shell fiqh-hub" dir="rtl">
      <nav className="fiqh-crumb" aria-label="مسار التنقل">
        <Link href="/fiqh">الفقه</Link>
      </nav>
      <header className="fiqh-book-head">
        <h1 className="fiqh-book-page__title">{book.title}</h1>
        <p className="fiqh-book-head__blurb">{fiqhBookBlurb(book)}</p>
        <p className="fiqh-book-head__meta">
          {formatAbwabCount(counts.chapters)} · {formatMasailCount(counts.lessons)} · مستوى تقريبي: {level}
        </p>
      </header>
      <ol className="fiqh-chapter-list">
        {chapters.map((ch, i) => {
          const lessons = publishedLessonsInChapter(ch);
          return (
            <li key={ch.id} className="fiqh-chapter fiqh-chapter--card">
              <div className="fiqh-chapter__card-head">
                <span className="fiqh-chapter__num">{i + 1}</span>
                <span className="fiqh-chapter__title">{ch.title}</span>
                <span className="fiqh-chapter__count">{formatMasailCount(lessons.length)}</span>
              </div>
              <ol className="fiqh-lesson-list">
                {lessons.map((lesson, li) => (
                  <li key={lesson.id}>
                    <Link href={`/fiqh/books/${book.id}/lessons/${lesson.id}`} className="fiqh-lesson-link">
                      <span className="fiqh-lesson-link__num">{li + 1}</span>
                      <span>{lesson.title}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </li>
          );
        })}
      </ol>
      <div className="fiqh-fab-clearance" />
    </div>
  );
}
