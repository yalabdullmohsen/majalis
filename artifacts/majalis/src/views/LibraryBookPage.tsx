"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { LibraryTreeNav } from "@/components/library/LibraryTreeNav";
import { VirtualParagraphList } from "@/components/library/VirtualParagraphList";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareCardModal } from "@/components/platform/ShareCardModal";
import { BookmarkNoteButton } from "@/components/platform/BookmarkNoteButton";
import { ContentSuggestions } from "@/components/platform/ContentSuggestions";
import { useTrackActivity } from "@/components/UserActivityProvider";
import {
  findChapter,
  findChapterPath,
  getDefaultChapterId,
  getLibraryBookBySlug,
  searchInBook,
} from "@/lib/library/catalog";
import {
  readLibraryPosition,
  writeLibraryPosition,
} from "@/lib/library/reading-position";

function BookCover({ title, author, hue }: { title: string; author: string; hue: number }) {
  const initial = title.replace(/^[\s«»"]+/, "").slice(0, 1);
  return (
    <div className="lib-cover" style={{ background: `linear-gradient(145deg, hsl(${hue} 42% 32%), hsl(${hue} 38% 22%))` }}>
      <span className="lib-cover__initial">{initial}</span>
      <span className="lib-cover__author">{author}</span>
    </div>
  );
}

export default function LibraryBookPage() {
  const [, params] = useRoute("/library/:slug/:chapterId?");
  const slug = params?.slug || "";
  const chapterParam = params?.chapterId || null;
  const book = useMemo(() => getLibraryBookBySlug(slug), [slug]);
  const saved = useMemo(() => (slug ? readLibraryPosition(slug) : null), [slug]);
  const chapterId = useMemo(
    () => (book ? getDefaultChapterId(book, chapterParam || saved?.chapterId) : ""),
    [book, chapterParam, saved?.chapterId],
  );
  const chapter = book ? findChapter(book, chapterId) : undefined;
  const track = useTrackActivity();

  const [search, setSearch] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  const searchHits = useMemo(
    () => (book && search.trim() ? searchInBook(book, search) : []),
    [book, search],
  );

  const path = book && chapter ? findChapterPath(book, chapter.id) : [];

  useEffect(() => {
    if (!book || !chapter) return;
    track({
      kind: "book",
      id: book.id,
      title: book.title,
      href: `/library/${book.slug}/${chapter.id}`,
      meta: chapter.title,
    });
  }, [book?.id, chapter?.id, track]);

  useEffect(() => {
    if (!book || !chapterId) return;
    writeLibraryPosition({ bookSlug: slug, chapterId, scrollRatio: 0 });
  }, [slug, chapterId, book]);

  const copyChapter = useCallback(async () => {
    if (!chapter) return;
    const text = `${book?.title} — ${chapter.title}\n\n${chapter.paragraphs.join("\n\n")}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }, [book, chapter]);

  if (!book) {
    return (
      <div className="page-shell lib-page">
        <PageHeader title="الكتاب غير موجود" subtitle="تحقق من الرابط أو ارجع للمكتبة." />
        <Link href="/library" className="platform-link-btn">← المكتبة</Link>
      </div>
    );
  }

  const chapterText = chapter?.paragraphs.join("\n\n") || "";

  return (
    <div className={`page-shell lib-page lib-reader${focusMode ? " lib-reader--focus" : ""}`}>
      {!focusMode && (
        <header className="lib-book-header">
          <Link href="/library" className="lib-back">← المكتبة</Link>
          <div className="lib-book-header__grid">
            <BookCover title={book.title} author={book.author} hue={book.coverHue} />
            <div className="lib-book-header__meta">
              <p className="page-eyebrow">{book.category} · {book.type}</p>
              <h1 className="lib-book-title">{book.title}</h1>
              <p className="lib-book-author">{book.author}</p>
              <p className="lib-book-desc">{book.description}</p>
              <div className="lib-book-stats">
                <span>{book.sections.length} أقسام</span>
                <span>{book.sections.reduce((n, s) => n + s.chapters.length, 0)} باب</span>
              </div>
              <div className="lib-book-actions">
                <FavoriteButton
                  contentType="book"
                  contentId={book.id}
                  title={book.title}
                  href={`/library/${book.slug}`}
                  compact
                />
                <button type="button" className="calm-btn calm-btn--ghost" onClick={copyChapter}>نسخ</button>
                <button type="button" className="calm-btn calm-btn--ghost" onClick={() => setShareOpen(true)}>مشاركة</button>
                <button type="button" className="calm-btn calm-btn--ghost" onClick={() => setFocusMode(true)}>وضع تركيز</button>
                {book.externalUrl && (
                  <a href={book.externalUrl} target="_blank" rel="noreferrer" className="calm-btn calm-btn--ghost">
                    المصدر الخارجي
                  </a>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      <div className="lib-reader-layout">
        <aside className={`lib-reader-sidebar${tocOpen ? " is-open" : ""}`}>
          <div className="lib-reader-sidebar__head">
            <strong>الفهرس</strong>
            <button type="button" className="lib-toc-close" onClick={() => setTocOpen(false)} aria-label="إغلاق">×</button>
          </div>
          <input
            className="page-search-input full lib-inbook-search"
            placeholder="بحث داخل الكتاب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {searchHits.length > 0 && (
            <ul className="lib-search-hits">
              {searchHits.slice(0, 8).map((h) => (
                <li key={h.chapterId}>
                  <Link href={`/library/${h.bookSlug}/${h.chapterId}`} onClick={() => setSearch("")}>
                    {h.chapterTitle}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <LibraryTreeNav
            sections={book.sections}
            activeChapterId={chapterId}
            bookSlug={book.slug}
            onSelect={() => setTocOpen(false)}
          />
        </aside>

        <article className="lib-chapter reading-surface-target">
          <div className="lib-chapter__toolbar">
            <button type="button" className="calm-btn calm-btn--ghost lib-toc-toggle" onClick={() => setTocOpen(true)}>
              الفهرس
            </button>
            {focusMode && (
              <button type="button" className="calm-btn calm-btn--ghost" onClick={() => setFocusMode(false)}>
                خروج من التركيز
              </button>
            )}
            {saved && saved.chapterId === chapterId && (
              <span className="lib-resume-badge">آخر قراءة</span>
            )}
          </div>

          {chapter ? (
            <>
              {path.length > 0 && (
                <p className="lib-chapter__path">{path.join(" › ")}</p>
              )}
              <h2 className="lib-chapter__title">{chapter.title}</h2>
              {chapter.placeholder && (
                <p className="lib-chapter__notice">سيتم إضافة المحتوى الكامل لهذا الباب قريباً إن شاء الله.</p>
              )}
              {chapter.paragraphs.length > 12 ? (
                <VirtualParagraphList paragraphs={chapter.paragraphs} />
              ) : (
                <div className="lib-chapter__body">
                  {chapter.paragraphs.map((p, i) => (
                    <p key={i} className="lib-chapter__para">{p}</p>
                  ))}
                </div>
              )}
              <div className="lib-chapter__foot">
                <BookmarkNoteButton
                  contentKey={`book:${book.slug}:${chapter.id}`}
                  title={`${book.title} — ${chapter.title}`}
                  href={`/library/${book.slug}/${chapter.id}`}
                />
              </div>
            </>
          ) : (
            <p className="lib-chapter__notice">اختر باباً من الفهرس للقراءة.</p>
          )}

          {!focusMode && (
            <ContentSuggestions keywords={[book.category, book.author, book.title]} category={book.category} />
          )}
        </article>
      </div>

      <ShareCardModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={book.title}
        subtitle={chapter?.title}
      />
    </div>
  );
}

export function LibraryBookIndexPage() {
  const [, params] = useRoute("/library/:slug");
  const slug = params?.slug || "";
  const book = getLibraryBookBySlug(slug);
  const saved = slug ? readLibraryPosition(slug) : null;
  const first = book ? getDefaultChapterId(book, saved?.chapterId) : "";

  if (!book) {
    return (
      <div className="page-shell lib-page">
        <PageHeader title="الكتاب غير موجود" subtitle="تحقق من الرابط." />
        <Link href="/library" className="platform-link-btn">← المكتبة</Link>
      </div>
    );
  }

  return (
    <div className="page-shell lib-page">
      <Link href="/library" className="lib-back">← المكتبة</Link>
      <PageHeader eyebrow={book.category} title={book.title} subtitle={book.description} />
      <p className="lib-book-author lib-book-author--block">{book.author}</p>
      <div className="lib-index-actions">
        <Link href={`/library/${book.slug}/${first}`} className="calm-btn calm-btn--primary">
          {saved ? "متابعة القراءة" : "ابدأ القراءة"}
        </Link>
        {saved && saved.chapterId !== first && (
          <Link href={`/library/${book.slug}/${saved.chapterId}`} className="calm-btn calm-btn--ghost">
            آخر موضع
          </Link>
        )}
      </div>
      <LibraryTreeNav
        sections={book.sections}
        activeChapterId={first}
        bookSlug={book.slug}
        onSelect={() => undefined}
      />
    </div>
  );
}
