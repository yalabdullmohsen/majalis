import { Link, useParams } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { usePageView } from "@/hooks/usePageView";
import { Empty } from "@/components/ui-common";
import {
  adjacentFiqhLessons,
  getFiqhLesson,
  getFiqhLessonAny,
} from "@/lib/fiqh-books";
import { ShareFaida } from "@/components/ShareFaida";
import { cn } from "@/lib/utils";
import {
  breadcrumbJsonLd,
  learningResourceJsonLd,
} from "@/lib/seo-structured-data";
import { FiqhSourceLine } from "@/components/fiqh/FiqhSourceLine";
import { FiqhRelatedIssues } from "@/components/fiqh/FiqhRelatedIssues";
import {
  FIQH_STATUS_LABELS,
  getLessonContentStatus,
  isSeverelyIncompleteLesson,
} from "@/lib/fiqh/fiqhNormalize";
import { relatedFiqhIssues, fiqhDoorBackHref } from "@/lib/fiqh/fiqhRelated";
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
  | "detail"
  | "evidence"
  | "preferred"
  | "sources"
  | "related";

export default function FiqhLessonPage() {
  const params = useParams<{ bookId: string; lessonId: string }>();
  const publishedHit = getFiqhLesson(params.bookId ?? "", params.lessonId ?? "");
  const anyHit = getFiqhLessonAny(params.bookId ?? "", params.lessonId ?? "");
  const hit = publishedHit ?? anyHit;
  const nav = useMemo(
    () => adjacentFiqhLessons(params.bookId ?? "", params.lessonId ?? ""),
    [params.bookId, params.lessonId],
  );
  const related = useMemo(() => (hit ? relatedFiqhIssues(hit) : []), [hit]);
  const progress = useReadingProgress(Boolean(hit));
  const [activeSection, setActiveSection] = useState<SectionId>("summary");

  usePageView("fiqh-lesson", params.lessonId ?? null);

  useEffect(() => {
    if (!hit) return;
    const severelyIncomplete = isSeverelyIncompleteLesson(hit.lesson);
    applyPageSeo({
      path: hit.href,
      title: `${hit.lesson.title} | ${hit.book.title} | سُنّة`,
      description: hit.lesson.summary.slice(0, 160),
      keywords: [hit.lesson.title, hit.chapter.title, hit.book.title, "فقه"],
      robots: severelyIncomplete ? "noindex, follow" : undefined,
      jsonLd: severelyIncomplete
        ? undefined
        : [
            learningResourceJsonLd({
              name: hit.lesson.title,
              description: hit.lesson.summary.slice(0, 200),
              url: hit.href,
              about: `${hit.book.title} — ${hit.chapter.title}`,
              educationalLevel: hit.lesson.level,
            }),
            breadcrumbJsonLd([
              { name: "الرئيسية", path: "/" },
              { name: "الفقه", path: "/fiqh" },
              { name: hit.book.title, path: `/fiqh/books/${hit.book.id}` },
              {
                name: hit.chapter.title,
                path: `/fiqh/books/${hit.book.id}/chapters/${hit.chapter.id}`,
              },
              { name: hit.lesson.title, path: hit.href },
            ]),
          ],
    });
  }, [hit]);

  if (!hit) {
    return (
      <div className="fiqh-lux-shell fiqh-lux-lesson page-shell" dir="rtl">
        <Empty title="مسألة غير موجودة" text="هذه المسألة غير مسجّلة في كتب الفقه." />
        <p className="fiqh-lux-empty">
          <Link href="/fiqh">العودة إلى الفقه</Link>
        </p>
      </div>
    );
  }

  const { book, chapter, lesson } = hit;
  const contentStatus = getLessonContentStatus(lesson);
  const { intro, rest } = firstSentence(lesson.summary);
  const detail = rest || (lesson.madhhabNotes ?? "");

  const sections: Array<{ id: SectionId; label: string; show: boolean }> = [
    { id: "summary", label: "خلاصة", show: Boolean(intro) },
    { id: "detail", label: "التفصيل", show: Boolean(detail) },
    { id: "evidence", label: "الدليل", show: Boolean(lesson.evidence?.trim()) },
    { id: "preferred", label: "الراجح", show: Boolean(lesson.preferred?.trim()) },
    { id: "sources", label: "المصدر", show: true },
    { id: "related", label: "مسائل مرتبطة", show: related.length > 0 },
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
        <span aria-hidden="true"> ← </span>
        <Link href={`/fiqh/books/${book.id}/chapters/${chapter.id}`}>{chapter.title}</Link>
        <span aria-hidden="true"> ← </span>
        <span aria-current="page">{lesson.title}</span>
      </nav>

      <header className="fiqh-lux-lesson-hero">
        <p className="fiqh-lux-lesson-hero__chapter">{chapter.title}</p>
        <h1 className="fiqh-lux-lesson-hero__title">{lesson.title}</h1>
        <div className="fiqh-lesson-hero__badges">
          <span className="fiqh-lux-lesson-hero__level">{lesson.level}</span>
          {contentStatus !== "complete" ? (
            <span className={cn("fiqh-status-badge", `fiqh-status-badge--${contentStatus === "needs_completion" ? "needs" : "review"}`)}>
              {FIQH_STATUS_LABELS[contentStatus]}
            </span>
          ) : null}
        </div>
      </header>

      {contentStatus !== "complete" ? (
        <aside className="fiqh-lesson-alert" role="note">
          هذه المسألة {FIQH_STATUS_LABELS[contentStatus].toLowerCase()}؛ لا يُعرض ما يلي كحكم نهائي بلا مصدر مكتمل.
        </aside>
      ) : null}

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
        {intro ? (
          <section id="fiqh-sec-summary" className="fiqh-lux-section">
            <h2>خلاصة مختصرة</h2>
            <p>{intro}</p>
          </section>
        ) : null}
        {detail ? (
          <section id="fiqh-sec-detail" className="fiqh-lux-section">
            <h2>التفصيل</h2>
            <p>{detail}</p>
          </section>
        ) : null}
        {lesson.evidence?.trim() ? (
          <section id="fiqh-sec-evidence" className="fiqh-lux-section">
            <h2>الدليل</h2>
            <p>{lesson.evidence}</p>
          </section>
        ) : null}
        {lesson.preferred?.trim() ? (
          <section id="fiqh-sec-preferred" className="fiqh-lux-section">
            <h2>الراجح</h2>
            <p>{lesson.preferred}</p>
          </section>
        ) : null}
        <div id="fiqh-sec-sources">
          <FiqhSourceLine sources={lesson.sources} status={contentStatus} />
        </div>
        {related.length > 0 ? (
          <div id="fiqh-sec-related">
            <FiqhRelatedIssues issues={related} className="fiqh-related" />
          </div>
        ) : null}
      </div>

      <ShareFaida title={lesson.title} url={hit.href} />

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
        <Link href={fiqhDoorBackHref(hit)}>العودة إلى {book.title}</Link>
        <span aria-hidden="true"> · </span>
        <Link href="/fiqh">بوابة الفقه</Link>
      </p>
      <div className="fiqh-fab-clearance" />
    </article>
  );
}
