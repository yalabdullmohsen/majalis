import { Link, useParams } from "wouter";
import { useEffect, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import { usePageView } from "@/hooks/usePageView";
import { Empty } from "@/components/ui-common";
import { getVisibleFiqhBook, publishedChapters, publishedLessonsInChapter } from "@/lib/fiqh-books";
import { formatMasailCount } from "@/lib/arabic-count";
import "@/styles/pages/fiqh-hub.css";

export default function FiqhBookPage() {
  const params = useParams<{ bookId: string }>();
  const bookId = params.bookId ?? "";
  const book = getVisibleFiqhBook(bookId);
  const [openId, setOpenId] = useState<string | null>(null);

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

  return (
    <div className="fqp-root page-shell fiqh-hub" dir="rtl">
      <nav className="fiqh-crumb" aria-label="مسار التنقل">
        <Link href="/fiqh">الفقه</Link>
        <span aria-hidden="true"> ← </span>
        <span>{book.title}</span>
      </nav>
      <h1 className="fiqh-book-page__title">{book.title}</h1>
      <ol className="fiqh-chapter-list">
        {chapters.map((ch, i) => {
          const lessons = publishedLessonsInChapter(ch);
          const open = openId === ch.id;
          return (
            <li key={ch.id} className="fiqh-chapter">
              <button
                type="button"
                className="fiqh-chapter__toggle"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : ch.id)}
              >
                <span className="fiqh-chapter__num">{i + 1}</span>
                <span className="fiqh-chapter__title">{ch.title}</span>
                <span className="fiqh-chapter__count">{formatMasailCount(lessons.length)}</span>
              </button>
              {open ? (
                <ul className="fiqh-lesson-list">
                  {lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link href={`/fiqh/books/${book.id}/lessons/${lesson.id}`} className="fiqh-lesson-link">
                        {lesson.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ol>
      <div className="fiqh-fab-clearance" />
    </div>
  );
}
