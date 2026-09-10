import { Link, useParams } from "wouter";
import { useEffect } from "react";
import { InternalLinkCard } from "@/components/ui/InternalCards";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd, bookJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";
import { Empty } from "@/components/ui-common";
import {
  chapterHref,
  fiqhBookApproxLevel,
  getVisibleFiqhBook,
  publishedChapters,
  publishedLessonsInChapter,
  resolveFiqhAliasTarget,
} from "@/lib/fiqh-books";
import { chapterPreviewText, fiqhBookEditorial } from "@/lib/fiqh-editorial";
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
    const editorial = fiqhBookEditorial(book);
    applyPageSeo({
      path: `/fiqh/books/${book.id}`,
      title: `${book.title} | الفقه | سُنّة`,
      description: editorial.description.slice(0, 160),
      keywords: [book.title, "فقه", "حنبلي", "سُنّة", ...(book.aliases ?? [])],
      jsonLd: [
        bookJsonLd({
          name: book.title,
          description: editorial.description,
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
      <div className="fiqh-lux-shell fiqh-lux-book page-shell ve-page" dir="rtl">
        <Empty title="كتاب غير منشور" text="هذا الكتاب غير مدرج في الكتب الظاهرة، أو لا أبواب منشورة فيه." />
        <p className="fiqh-lux-empty">
          <Link href="/fiqh">العودة إلى الفقه</Link>
        </p>
      </div>
    );
  }

  const chapters = publishedChapters(book);
  const editorial = fiqhBookEditorial(book);
  const level = fiqhBookApproxLevel(book);

  return (
    <div className="fiqh-lux-shell fiqh-lux-book page-shell ve-page" dir="rtl">
      <nav className="fiqh-lux-crumb" aria-label="مسار التنقل">
        <Link href="/fiqh">الفقه</Link>
        <span aria-hidden="true"> ← </span>
        <span aria-current="page">{book.title}</span>
      </nav>

      <header className="fiqh-lux-book-hero surface-brand" data-on-brand="light">
        <h1 className="fiqh-lux-book-hero__title">{editorial.title}</h1>
        <p className="fiqh-lux-book-hero__meta">{editorial.subtitle}</p>
        <p className="fiqh-lux-book-hero__blurb">{editorial.description}</p>
        <div className="ve-hero__chips" aria-label="شارات الكتاب">
          <span className="ve-badge">{editorial.categoryLabel}</span>
          <span className="ve-badge ve-badge--secondary">{editorial.madhhabBadge}</span>
          <span className="ve-badge ve-badge--accent">مستوى تقريبي: {level}</span>
        </div>
        {editorial.keyTopics.length > 0 ? (
          <div className="ve-hero__chips" aria-label="أبرز الموضوعات">
            {editorial.keyTopics.map((topic) => (
              <span key={topic} className="ve-chip">
                {topic}
              </span>
            ))}
          </div>
        ) : null}
        {editorial.orderReason ? (
          <p className="fiqh-lux-book-hero__meta" aria-label="سبب الترتيب">
            ترتيب الكتاب: {editorial.orderReason}
          </p>
        ) : null}
        <p className="fiqh-lux-book-hero__meta">
          {formatAbwabCount(editorial.chaptersCount)} · {formatMasailCount(editorial.lessonsCount)}
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

      <ol className="fiqh-lux-chapter-list ve-chapter-list">
        {chapters.map((ch, i) => {
          const lessons = publishedLessonsInChapter(ch);
          return (
            <li key={ch.id} className="fiqh-chapter fiqh-chapter--card">
              <InternalLinkCard
                href={chapterHref(book.id, ch.id)}
                title={ch.title}
                description={chapterPreviewText(ch)}
                meta={formatMasailCount(lessons.length)}
                badge={String(i + 1)}
                className="ve-chapter-card"
              />
            </li>
          );
        })}
      </ol>
      <div className="fiqh-fab-clearance ve-bottom-clearance" />
    </div>
  );
}
