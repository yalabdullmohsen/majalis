import { Link, useParams } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { InternalLinkCard } from "@/components/ui/InternalCards";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";
import { Empty } from "@/components/ui-common";
import {
  adjacentFiqhChapters,
  chapterHref,
  getFiqhChapter,
  lessonHref,
  publishedLessonsInChapter,
  type FiqhChapterHit,
} from "@/lib/fiqh-books";
import { fiqhChapterEditorial } from "@/lib/fiqh-editorial";
import { formatMasailCount } from "@/lib/arabic-count";
import "@/styles/pages/fiqh-hub.css";
import { DetailScreen } from "@/components/design-system/screens";

type TocItem = { id: string; label: string };

export default function FiqhChapterPage() {
  const params = useParams<{ bookId: string; chapterId: string }>();
  const bookId = params.bookId ?? "";
  const chapterId = params.chapterId ?? "";
  const hit = getFiqhChapter(bookId, chapterId);
  const [activeToc, setActiveToc] = useState<string>("");

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

  const adjacent = useMemo(
    () =>
      hit
        ? adjacentFiqhChapters(hit.book.id, hit.chapter.id)
        : { chapters: [] as FiqhChapterHit[] },
    [hit],
  );

  const editorial = useMemo(() => {
    if (!hit) return null;
    const idx = adjacent.chapters.findIndex((c) => c.chapter.id === hit.chapter.id);
    return fiqhChapterEditorial(
      hit.book,
      hit.chapter,
      idx >= 0 ? idx + 1 : 0,
      adjacent.chapters.length,
    );
  }, [hit, adjacent]);

  const tocItems = useMemo(() => {
    if (!editorial) return [] as TocItem[];
    const items: TocItem[] = [{ id: "fiqh-ch-def", label: "التعريف" }];
    if (editorial.learnings.length > 0) items.push({ id: "fiqh-ch-learn", label: "ماذا تتعلم؟" });
    if (editorial.topics.length > 0) items.push({ id: "fiqh-ch-topics", label: "أبرز الموضوعات" });
    if (editorial.summary) items.push({ id: "fiqh-ch-sum", label: "الخلاصة" });
    if (editorial.notes) items.push({ id: "fiqh-ch-notes", label: "التنبيهات" });
    if (editorial.evidence) items.push({ id: "fiqh-ch-ev", label: "الأدلة" });
    items.push({ id: "fiqh-ch-masail", label: "المسائل" });
    return items;
  }, [editorial]);

  useEffect(() => {
    if (tocItems.length === 0 || typeof window === "undefined") return;
    const onHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (id) setActiveToc(id);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [tocItems]);

  if (!hit || !editorial) {
    return (
      <div className="fiqh-lux-shell fiqh-lux-chapter-page page-shell ve-page" dir="rtl">
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
    <DetailScreen compose="mark">
    <div className="fiqh-lux-shell fiqh-lux-chapter-page page-shell ve-page" dir="rtl">
      <nav className="fiqh-lux-crumb" aria-label="مسار التنقل">
        <Link href="/fiqh">الفقه</Link>
        <span aria-hidden="true"> ← </span>
        <Link href={`/fiqh/books/${book.id}`}>{book.title}</Link>
        <span aria-hidden="true"> ← </span>
        <span aria-current="page">{chapter.title}</span>
      </nav>

      <header className="fiqh-lux-book-hero surface-brand" data-on-brand="light">
        <h1 className="fiqh-lux-book-hero__title">{editorial.title}</h1>
        <p className="fiqh-lux-book-hero__meta">
          {editorial.bookTitle}
          {editorial.chaptersTotal > 0
            ? ` · باب ${editorial.chapterIndex} من ${editorial.chaptersTotal}`
            : ""}
        </p>
        <p className="fiqh-lux-book-hero__meta">
          <span className="ve-badge">{editorial.bookBadge}</span> · {formatMasailCount(editorial.lessonsCount)}
        </p>
      </header>

      {tocItems.length > 1 ? (
        <nav className="ve-toc" aria-label="أقسام الباب">
          {tocItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={activeToc === item.id ? "is-active" : undefined}
              onClick={() => setActiveToc(item.id)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}

      <div className="ve-accordion">
        <details open id="fiqh-ch-def" className="ve-section">
          <summary>التعريف</summary>
          <div className="ve-accordion__body ve-body">
            <p>{editorial.definition}</p>
          </div>
        </details>

        {editorial.learnings.length > 0 ? (
          <details open id="fiqh-ch-learn" className="ve-section">
            <summary>ماذا تتعلم؟</summary>
            <div className="ve-accordion__body ve-body">
              <ul>
                {editorial.learnings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </details>
        ) : null}

        {editorial.topics.length > 0 ? (
          <details open id="fiqh-ch-topics" className="ve-section">
            <summary>أبرز الموضوعات</summary>
            <div className="ve-accordion__body ve-body">
              <ul>
                {editorial.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </div>
          </details>
        ) : null}

        {editorial.summary ? (
          <details open id="fiqh-ch-sum" className="ve-section">
            <summary>الخلاصة</summary>
            <div className="ve-accordion__body ve-body">
              <p>{editorial.summary}</p>
            </div>
          </details>
        ) : null}

        {editorial.notes ? (
          <details open id="fiqh-ch-notes" className="ve-section">
            <summary>التنبيهات</summary>
            <div className="ve-accordion__body ve-body">
              <aside className="ve-callout" role="note">
                <span className="ve-callout__label">تنبيه</span>
                {editorial.notes}
              </aside>
            </div>
          </details>
        ) : null}

        {editorial.evidence ? (
          <details open id="fiqh-ch-ev" className="ve-section">
            <summary>الأدلة</summary>
            <div className="ve-accordion__body ve-body">
              <p>{editorial.evidence}</p>
            </div>
          </details>
        ) : null}

        {chapter.sources && chapter.sources.length > 0 ? (
          <details id="fiqh-ch-src" className="ve-section">
            <summary>المصادر</summary>
            <div className="ve-accordion__body ve-body">
              <ul className="fiqh-lux-sources">
                {chapter.sources.map((s, i) => (
                  <li key={`${s.book}-${i}`}>
                    <strong>{s.book}</strong>
                    {s.author ? ` — ${s.author}` : ""}
                    {s.ref ? `، ${s.ref}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ) : null}

        <details open id="fiqh-ch-masail" className="ve-section">
          <summary>المسائل</summary>
          <div className="ve-accordion__body">
            <ul className="ve-lesson-list hub-card-grid">
              {lessons.map((lesson, li) => (
                <li key={lesson.id}>
                  <InternalLinkCard
                    href={lessonHref(book, lesson)}
                    title={lesson.title}
                    description={
                      lesson.summary.length > 110
                        ? `${lesson.summary.slice(0, 100).trim()}…`
                        : lesson.summary
                    }
                    badge={String(li + 1)}
                    className="ve-chapter-card"
                  />
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>

      {(adjacent.prev || adjacent.next) && (
        <nav
          className={`ve-pager${adjacent.prev && adjacent.next ? "" : " ve-pager--single"}`}
          aria-label="أبواب مجاورة"
        >
          {adjacent.prev ? (
            <Link href={adjacent.prev.href}>
              <span>الباب السابق</span>
              <strong>{adjacent.prev.chapter.title}</strong>
            </Link>
          ) : null}
          {adjacent.next ? (
            <Link href={adjacent.next.href} className="ve-pager__next">
              <span>الباب التالي</span>
              <strong>{adjacent.next.chapter.title}</strong>
            </Link>
          ) : null}
        </nav>
      )}

      <div className="fiqh-fab-clearance ve-bottom-clearance" />
    </div>
    </DetailScreen>
  );
}
