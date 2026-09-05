import { Link, useParams } from "wouter";
import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";
import { Empty } from "@/components/ui-common";
import {
  chapterHref,
  getFiqhChapter,
  lessonHref,
  publishedLessonsInChapter,
} from "@/lib/fiqh-books";
import { formatMasailCount } from "@/lib/arabic-count";
import "@/styles/pages/fiqh-hub.css";

export default function FiqhChapterPage() {
  const params = useParams<{ bookId: string; chapterId: string }>();
  const bookId = params.bookId ?? "";
  const chapterId = params.chapterId ?? "";
  const hit = getFiqhChapter(bookId, chapterId);

  usePageView("fiqh-chapter", chapterId || null);

  useEffect(() => {
    if (!hit) return;
    const { book, chapter } = hit;
    applyPageSeo({
      path: chapterHref(book.id, chapter.id),
      title: `${chapter.title} | ${book.title} | الفقه | سُنّة`,
      description: (chapter.summary || chapter.definition || chapter.title).slice(0, 160),
      keywords: [chapter.title, book.title, "فقه", "حنبلي", "سُنّة"],
      jsonLd: breadcrumbJsonLd([
        { name: "الرئيسية", path: "/" },
        { name: "الفقه", path: "/fiqh" },
        { name: book.title, path: `/fiqh/books/${book.id}` },
        { name: chapter.title, path: chapterHref(book.id, chapter.id) },
      ]),
    });
  }, [hit]);

  if (!hit) {
    return (
      <div className="fiqh-lux-shell fiqh-lux-chapter-page page-shell" dir="rtl">
        <Empty title="باب غير منشور" text="هذا الباب غير مدرج، أو ينقصه توثيق منشور." />
        <p className="fiqh-lux-empty">
          <Link href={bookId ? `/fiqh/books/${bookId}` : "/fiqh"}>العودة</Link>
        </p>
      </div>
    );
  }

  const { book, chapter } = hit;
  const lessons = publishedLessonsInChapter(chapter);

  return (
    <div className="fiqh-lux-shell fiqh-lux-chapter-page page-shell" dir="rtl">
      <nav className="fiqh-lux-crumb" aria-label="مسار التنقل">
        <Link href="/fiqh">الفقه</Link>
        <span aria-hidden="true"> ← </span>
        <Link href={`/fiqh/books/${book.id}`}>{book.title}</Link>
        <span aria-hidden="true"> ← </span>
        <span aria-current="page">{chapter.title}</span>
      </nav>

      <header className="fiqh-lux-book-hero">
        <h1 className="fiqh-lux-book-hero__title">{chapter.title}</h1>
        <p className="fiqh-lux-book-hero__meta">{formatMasailCount(lessons.length)} منشورة</p>
      </header>

      {chapter.definition ? (
        <section className="fiqh-lux-block" aria-labelledby="fiqh-ch-def">
          <h2 id="fiqh-ch-def">تعريف الباب</h2>
          <p>{chapter.definition}</p>
        </section>
      ) : null}

      {chapter.summary ? (
        <section className="fiqh-lux-block" aria-labelledby="fiqh-ch-sum">
          <h2 id="fiqh-ch-sum">خلاصة علمية</h2>
          <p>{chapter.summary}</p>
        </section>
      ) : null}

      {chapter.evidence ? (
        <section className="fiqh-lux-block" aria-labelledby="fiqh-ch-ev">
          <h2 id="fiqh-ch-ev">أدلة عامة</h2>
          <p>{chapter.evidence}</p>
        </section>
      ) : null}

      {chapter.sources && chapter.sources.length > 0 ? (
        <section className="fiqh-lux-block" aria-labelledby="fiqh-ch-src">
          <h2 id="fiqh-ch-src">المصادر</h2>
          <ul className="fiqh-lux-sources">
            {chapter.sources.map((s, i) => (
              <li key={`${s.book}-${i}`}>
                <strong>{s.book}</strong>
                {s.author ? ` — ${s.author}` : ""}
                {s.ref ? `، ${s.ref}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="fiqh-lux-block" aria-labelledby="fiqh-ch-masail">
        <h2 id="fiqh-ch-masail">المسائل</h2>
        <ol className="fiqh-lux-lesson-list fiqh-lux-lesson-list--standalone">
          {lessons.map((lesson, li) => (
            <li key={lesson.id}>
              <Link href={lessonHref(book, lesson)} className="fiqh-lux-lesson-link">
                <span className="fiqh-lux-lesson-link__num">{li + 1}</span>
                <span className="fiqh-lux-lesson-link__body">
                  <span className="fiqh-lux-lesson-link__title">{lesson.title}</span>
                  <span className="fiqh-lux-lesson-link__sum">{lesson.summary.slice(0, 110)}…</span>
                </span>
                <span className="fiqh-lux-lesson-link__go" aria-hidden="true">
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <div className="fiqh-fab-clearance" />
    </div>
  );
}
