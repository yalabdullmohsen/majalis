import { Link, useParams } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import { usePageView } from "@/hooks/usePageView";
import { Empty } from "@/components/ui-common";
import { adjacentFiqhLessons, getFiqhLesson } from "@/lib/fiqh-books";
import "@/styles/pages/fiqh-hub.css";

function firstSentence(text: string): { intro: string; rest: string } {
  const trimmed = text.trim();
  const match = trimmed.match(/^(.+?[.。!؟])\s+([\s\S]+)$/);
  if (!match) return { intro: trimmed, rest: "" };
  return { intro: match[1]!.trim(), rest: match[2]!.trim() };
}

function useReadingProgress(active: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const update = () => {
      const root = document.querySelector<HTMLElement>("[data-scroll-root]") ?? document.documentElement;
      const scrolled = root === document.documentElement ? window.scrollY : root.scrollTop;
      const height =
        (root === document.documentElement
          ? document.documentElement.scrollHeight - window.innerHeight
          : root.scrollHeight - root.clientHeight) || 1;
      setValue(Math.max(0, Math.min(100, Math.round((scrolled / height) * 100))));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    const root = document.querySelector("[data-scroll-root]");
    root?.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      root?.removeEventListener("scroll", update);
    };
  }, [active]);
  return value;
}

export default function FiqhLessonPage() {
  const params = useParams<{ bookId: string; lessonId: string }>();
  const hit = getFiqhLesson(params.bookId ?? "", params.lessonId ?? "");
  const nav = useMemo(
    () => adjacentFiqhLessons(params.bookId ?? "", params.lessonId ?? ""),
    [params.bookId, params.lessonId],
  );
  const progress = useReadingProgress(Boolean(hit));

  usePageView("fiqh-lesson", params.lessonId ?? null);

  useEffect(() => {
    if (!hit) return;
    applyPageSeo({
      path: hit.href,
      title: `${hit.lesson.title} | ${hit.book.title} | المجلس العلمي`,
      description: hit.lesson.summary.slice(0, 160),
      keywords: [hit.lesson.title, hit.chapter.title, hit.book.title, "فقه"],
    });
  }, [hit]);

  if (!hit) {
    return (
      <div className="fqp-root page-shell fiqh-hub" dir="rtl">
        <Empty title="مسألة غير منشورة" text="هذه المسألة غير موجودة أو لم تُنشر بعد." />
        <p className="fiqh-results__empty"><Link href="/fiqh">العودة إلى الفقه</Link></p>
      </div>
    );
  }

  const { book, chapter, lesson } = hit;
  const { intro, rest } = firstSentence(lesson.summary);
  const definition = rest || intro;

  return (
    <article className="fqp-root page-shell fiqh-hub fiqh-lesson-page" dir="rtl" data-focus-root="1">
      <div className="fiqh-read-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="تقدّم القراءة">
        <span style={{ width: `${progress}%` }} />
      </div>
      <nav className="fiqh-crumb" aria-label="مسار التنقل">
        <Link href="/fiqh">الفقه</Link>
        <span aria-hidden="true"> ← </span>
        <Link href={`/fiqh/books/${book.id}`}>{book.title}</Link>
      </nav>
      <p className="fiqh-lesson-page__chapter">{chapter.title}</p>
      <h1 className="fiqh-book-page__title">{lesson.title}</h1>
      <p className="fiqh-lesson-page__level">{lesson.level}</p>

      <details className="fiqh-lesson-toc">
        <summary>فهرس الباب</summary>
        <ol>
          {nav.chapterHits.map((item) => (
            <li key={item.lesson.id}>
              {item.lesson.id === lesson.id ? (
                <span aria-current="page">{item.lesson.title}</span>
              ) : (
                <Link href={item.href}>{item.lesson.title}</Link>
              )}
            </li>
          ))}
        </ol>
      </details>

      <section>
        <h2>ملخص سريع</h2>
        <p>{intro}</p>
      </section>
      {rest ? (
        <section>
          <h2>التعريف</h2>
          <p>{definition}</p>
        </section>
      ) : null}
      <section>
        <h2>الأدلة</h2>
        <p>{lesson.evidence}</p>
      </section>
      {lesson.madhhabNotes ? (
        <section>
          <h2>أقوال أهل العلم</h2>
          <p>{lesson.madhhabNotes}</p>
        </section>
      ) : null}
      <section>
        <h2>الراجح بدليله</h2>
        <p>{lesson.preferred}</p>
      </section>
      <section>
        <h2>المصادر</h2>
        <ul className="fiqh-sources">
          {lesson.sources.map((s) => (
            <li key={`${s.book}-${s.ref}`}>
              {s.book} — {s.author} — {s.ref}
            </li>
          ))}
        </ul>
      </section>

      <nav className="fiqh-lesson-pager" aria-label="المسألة التالية والسابقة">
        {nav.prev ? (
          <Link href={nav.prev.href} className="fiqh-lesson-pager__link">السابق: {nav.prev.lesson.title}</Link>
        ) : <span />}
        {nav.next ? (
          <Link href={nav.next.href} className="fiqh-lesson-pager__link">التالي: {nav.next.lesson.title}</Link>
        ) : <span />}
      </nav>
      <p className="fiqh-lesson-back">
        <Link href={`/fiqh/books/${book.id}`}>العودة إلى أبواب {book.title}</Link>
      </p>
      <div className="fiqh-fab-clearance" />
    </article>
  );
}
