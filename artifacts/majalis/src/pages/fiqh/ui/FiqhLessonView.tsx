import { Link, useParams } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { usePageView } from "@/hooks/usePageView";
import { Empty } from "@/components/ui-common";
import { adjacentFiqhLessons, getFiqhLesson } from "@/lib/fiqh-books";
import { CompactSources } from "@/components/content/CompactSources";
import { cn } from "@/lib/utils";
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

type SectionId =
  | "summary"
  | "definition"
  | "evidence"
  | "madhhab"
  | "preferred"
  | "sources";

export default function FiqhLessonPage() {
  const params = useParams<{ bookId: string; lessonId: string }>();
  const hit = getFiqhLesson(params.bookId ?? "", params.lessonId ?? "");
  const nav = useMemo(
    () => adjacentFiqhLessons(params.bookId ?? "", params.lessonId ?? ""),
    [params.bookId, params.lessonId],
  );
  const progress = useReadingProgress(Boolean(hit));
  const [activeSection, setActiveSection] = useState<SectionId>("summary");

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
      <div className="fiqh-lux-shell fiqh-lux-lesson page-shell" dir="rtl">
        <Empty title="مسألة غير منشورة" text="هذه المسألة غير موجودة أو لم تُنشر بعد." />
        <p className="fiqh-lux-empty">
          <Link href="/fiqh">العودة إلى الفقه</Link>
        </p>
      </div>
    );
  }

  const { book, chapter, lesson } = hit;
  const { intro, rest } = firstSentence(lesson.summary);
  const definition = rest || intro;

  const sections: Array<{ id: SectionId; label: string; show: boolean }> = [
    { id: "summary", label: "ملخص سريع", show: true },
    { id: "definition", label: "التعريف", show: Boolean(rest) },
    { id: "evidence", label: "الأدلة", show: true },
    { id: "madhhab", label: "أقوال أهل العلم", show: Boolean(lesson.madhhabNotes) },
    { id: "preferred", label: "الراجح بدليله", show: true },
    { id: "sources", label: "المصادر", show: lesson.sources.length > 0 },
  ];

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id);
    document.getElementById(`fiqh-sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <article
      className="fiqh-lux-shell fiqh-lux-lesson page-shell fiqh-lesson-page"
      dir="rtl"
      data-focus-root="1"
    >
      <div
        className="fiqh-read-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="تقدّم القراءة"
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <nav className="fiqh-lux-crumb" aria-label="مسار التنقل">
        <Link href="/fiqh">الفقه</Link>
        <span aria-hidden="true"> ← </span>
        <Link href={`/fiqh/books/${book.id}`}>{book.title}</Link>
      </nav>

      <header className="fiqh-lux-lesson-hero">
        <p className="fiqh-lux-lesson-hero__chapter">{chapter.title}</p>
        <h1 className="fiqh-lux-lesson-hero__title">{lesson.title}</h1>
        <p className="fiqh-lux-lesson-hero__level">{lesson.level}</p>
      </header>

      <details className="fiqh-lesson-toc fiqh-lux-toc">
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

      <nav className="fiqh-lux-section-nav" aria-label="فهرس المسألة">
        {sections
          .filter((s) => s.show)
          .map((s) => (
            <button
              key={s.id}
              type="button"
              className={cn("fiqh-lux-section-nav__chip", activeSection === s.id && "is-active")}
              onClick={() => scrollToSection(s.id)}
            >
              {s.label}
            </button>
          ))}
      </nav>

      <div className="fiqh-lux-sections">
        <section id="fiqh-sec-summary" className="fiqh-lux-section">
          <h2>ملخص سريع</h2>
          <p>{intro}</p>
        </section>
        {rest ? (
          <section id="fiqh-sec-definition" className="fiqh-lux-section">
            <h2>التعريف</h2>
            <p>{definition}</p>
          </section>
        ) : null}
        <section id="fiqh-sec-evidence" className="fiqh-lux-section">
          <h2>الأدلة</h2>
          <p>{lesson.evidence}</p>
        </section>
        {lesson.madhhabNotes ? (
          <section id="fiqh-sec-madhhab" className="fiqh-lux-section">
            <h2>أقوال أهل العلم</h2>
            <p>{lesson.madhhabNotes}</p>
          </section>
        ) : null}
        <section id="fiqh-sec-preferred" className="fiqh-lux-section">
          <h2>الراجح بدليله</h2>
          <p>{lesson.preferred}</p>
        </section>
        <div id="fiqh-sec-sources">
          <CompactSources
            className="fiqh-lux-sources"
            items={lesson.sources.map((s) => ({
              summary: `${s.book} — ${s.ref}`,
              detail: `${s.book} — ${s.author} — ${s.ref}`,
            }))}
          />
        </div>
      </div>

      <nav className="fiqh-lux-pager" aria-label="المسألة التالية والسابقة">
        {nav.prev ? (
          <Link href={nav.prev.href} className="fiqh-lux-pager__btn fiqh-lux-pager__btn--prev">
            <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
            <span>
              <span className="fiqh-lux-pager__label">السابق</span>
              <span className="fiqh-lux-pager__title">{nav.prev.lesson.title}</span>
            </span>
          </Link>
        ) : (
          <span className="fiqh-lux-pager__spacer" />
        )}
        {nav.next ? (
          <Link href={nav.next.href} className="fiqh-lux-pager__btn fiqh-lux-pager__btn--next">
            <span>
              <span className="fiqh-lux-pager__label">التالي</span>
              <span className="fiqh-lux-pager__title">{nav.next.lesson.title}</span>
            </span>
            <ChevronLeft size={18} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        ) : (
          <span className="fiqh-lux-pager__spacer" />
        )}
      </nav>

      <p className="fiqh-lux-back">
        <Link href={`/fiqh/books/${book.id}`}>العودة إلى أبواب {book.title}</Link>
      </p>
      <div className="fiqh-fab-clearance" />
    </article>
  );
}
