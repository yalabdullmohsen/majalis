import { Link, useParams } from "wouter";
import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
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
      <div className="fiqh-lux-shell fiqh-lux-book page-shell" dir="rtl">
        <Empty title="كتاب غير منشور" text="هذا الكتاب غير مدرج في الكتب الظاهرة، أو لا مسائل منشورة فيه." />
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
        <p className="fiqh-lux-book-hero__meta">
          {formatAbwabCount(counts.chapters)} · {formatMasailCount(counts.lessons)} · مستوى تقريبي:{" "}
          {level}
        </p>
      </header>

      <ol className="fiqh-lux-chapter-list">
        {chapters.map((ch, i) => {
          const lessons = publishedLessonsInChapter(ch);
          const first = lessons[0];
          return (
            <li key={ch.id} className="fiqh-chapter fiqh-chapter--card fiqh-lux-chapter">
              <Link
                href={
                  first
                    ? `/fiqh/books/${book.id}/lessons/${first.id}`
                    : `/fiqh/books/${book.id}`
                }
                className="fiqh-lux-chapter__head"
              >
                <span className="fiqh-lux-chapter__num">{i + 1}</span>
                <span className="fiqh-lux-chapter__body">
                  <span className="fiqh-lux-chapter__title">{ch.title}</span>
                  {first ? (
                    <span className="fiqh-lux-chapter__preview">{first.title}</span>
                  ) : null}
                  <span className="fiqh-lux-chapter__count">{formatMasailCount(lessons.length)}</span>
                </span>
                <span className="fiqh-lux-chapter__go" aria-hidden="true">
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </span>
              </Link>
              {lessons.length > 1 ? (
                <ol className="fiqh-lux-lesson-list">
                  {lessons.map((lesson, li) => (
                    <li key={lesson.id}>
                      <Link
                        href={`/fiqh/books/${book.id}/lessons/${lesson.id}`}
                        className="fiqh-lux-lesson-link"
                      >
                        <span className="fiqh-lux-lesson-link__num">{li + 1}</span>
                        <span>{lesson.title}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : null}
            </li>
          );
        })}
      </ol>
      <div className="fiqh-fab-clearance" />
    </div>
  );
}
