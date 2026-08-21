import { Link, useParams } from "wouter";
import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo";
import { usePageView } from "@/hooks/usePageView";
import { Empty } from "@/components/ui-common";
import { getFiqhLesson } from "@/lib/fiqh-books";
import "@/styles/pages/fiqh-hub.css";

function firstSentence(text: string): { intro: string; rest: string } {
  const trimmed = text.trim();
  const match = trimmed.match(/^(.+?[.。!؟])\s+([\s\S]+)$/);
  if (!match) return { intro: trimmed, rest: "" };
  return { intro: match[1]!.trim(), rest: match[2]!.trim() };
}

export default function FiqhLessonPage() {
  const params = useParams<{ bookId: string; lessonId: string }>();
  const hit = getFiqhLesson(params.bookId ?? "", params.lessonId ?? "");

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
      <nav className="fiqh-crumb" aria-label="مسار التنقل">
        <Link href="/fiqh">الفقه</Link>
        <span aria-hidden="true"> ← </span>
        <Link href={`/fiqh/books/${book.id}`}>{book.title}</Link>
        <span aria-hidden="true"> ← </span>
        <span>{chapter.title}</span>
      </nav>
      <h1 className="fiqh-book-page__title">{lesson.title}</h1>
      <p className="fiqh-lesson-page__level">{lesson.level}</p>

      <section>
        <h2>مقدمة</h2>
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
        <h2>الخلاصة</h2>
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
      <div className="fiqh-fab-clearance" />
    </article>
  );
}
