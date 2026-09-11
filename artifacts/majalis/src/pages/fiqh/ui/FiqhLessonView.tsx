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
import { ShareButtons } from "@/components/ContentActions";
import { cn } from "@/lib/utils";
import {
  breadcrumbJsonLd,
  learningResourceJsonLd,
} from "@/lib/seo-structured-data";
import { FiqhSourceLine } from "@/components/fiqh/FiqhSourceLine";
import { FiqhRelatedIssues } from "@/components/fiqh/FiqhRelatedIssues";
import { FiqhReportError } from "@/components/fiqh/FiqhReportError";
import { isSeverelyIncompleteLesson } from "@/lib/fiqh/fiqhNormalize";
import { relatedFiqhIssues, fiqhDoorBackHref } from "@/lib/fiqh/fiqhRelated";
import "@/styles/pages/fiqh-hub.css";
import { DetailScreen } from "@/components/design-system/screens";

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
  | "ruling"
  | "detail"
  | "evidence"
  | "scholarly"
  | "practical"
  | "notes"
  | "mistakes"
  | "examples"
  | "review"
  | "sources"
  | "related";

function ListBlock({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="fiqh-lux-list">
      {items.map((item, i) => (
        <li key={`${i}-${item.slice(0, 24)}`}>{item}</li>
      ))}
    </ul>
  );
}

export default function FiqhLessonPage() {
  const params = useParams<{ bookId: string; lessonId: string }>();
  const publishedHit = getFiqhLesson(params.bookId ?? "", params.lessonId ?? "");
  const anyHit = getFiqhLessonAny(params.bookId ?? "", params.lessonId ?? "");
  const hit =
    publishedHit ??
    (anyHit && anyHit.lesson.needsReview !== true && anyHit.lesson.status === "published"
      ? anyHit
      : undefined);
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
      keywords: [...(hit.lesson.keywords ?? []), hit.lesson.title, hit.chapter.title, hit.book.title, "فقه"],
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
  const { intro, rest } = firstSentence(lesson.summary);
  const detail =
    rest ||
    [lesson.madhhabNotes, lesson.scholarlyNotes].filter(Boolean).join("\n\n") ||
    "";
  const definition = lesson.definition?.trim() || "";
  const ruling = lesson.ruling?.trim() || lesson.preferred?.trim() || "";
  const notes = lesson.notes?.trim() || "";
  const practical = lesson.practicalSummary?.trim() || "";
  const scholarly = (lesson.scholarlyNotes || lesson.madhhabNotes || "").trim();
  const mistakes = (lesson.commonMistakes ?? []).map((x) => x.trim()).filter(Boolean);
  const examples = (lesson.examples ?? []).map((x) => x.trim()).filter(Boolean);
  const reviewQs = (lesson.reviewQuestions ?? []).map((x) => x.trim()).filter(Boolean);

  const sections: Array<{ id: SectionId; label: string; show: boolean }> = [
    { id: "summary", label: "الملخص", show: Boolean(intro) },
    { id: "definition", label: "التعريف", show: Boolean(definition) },
    { id: "ruling", label: "الحكم", show: Boolean(ruling) },
    { id: "detail", label: "التفصيل", show: Boolean(detail) },
    { id: "evidence", label: "الأدلة", show: Boolean(lesson.evidence?.trim()) },
    { id: "scholarly", label: "أقوال أهل العلم", show: Boolean(scholarly) },
    { id: "practical", label: "الخلاصة", show: Boolean(practical) },
    { id: "notes", label: "تنبيهات", show: Boolean(notes) },
    { id: "mistakes", label: "أخطاء شائعة", show: mistakes.length > 0 },
    { id: "examples", label: "أمثلة", show: examples.length > 0 },
    { id: "review", label: "مراجعة", show: reviewQs.length > 0 },
    { id: "sources", label: "المصادر", show: true },
    { id: "related", label: "مرتبطة", show: related.length > 0 },
  ];

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id);
    document.getElementById(`fiqh-sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <DetailScreen compose="mark">
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
        <p className="fiqh-lux-lesson-hero__meta">
          {book.title} · {chapter.title}
        </p>
        <h1 className="fiqh-lux-lesson-hero__title">{lesson.title}</h1>
        <div className="fiqh-lesson-hero__badges">
          <span className="fiqh-lux-lesson-hero__level">{lesson.level}</span>
        </div>
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

      <nav className="fiqh-lux-section-nav" aria-label="فهرس الدرس">
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
            <h2>ملخص مختصر</h2>
            <p>{intro}</p>
          </section>
        ) : null}
        {definition ? (
          <section id="fiqh-sec-definition" className="fiqh-lux-section">
            <h2>تعريف المسألة</h2>
            <p>{definition}</p>
          </section>
        ) : null}
        {ruling ? (
          <section id="fiqh-sec-ruling" className="fiqh-lux-section">
            <h2>الحكم المختصر</h2>
            <p>{ruling}</p>
          </section>
        ) : null}
        {detail ? (
          <section id="fiqh-sec-detail" className="fiqh-lux-section">
            <h2>التفصيل التعليمي</h2>
            {detail.split(/\n+/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </section>
        ) : null}
        {lesson.evidence?.trim() ? (
          <section id="fiqh-sec-evidence" className="fiqh-lux-section">
            <h2>الأدلة</h2>
            <p>{lesson.evidence}</p>
          </section>
        ) : null}
        {scholarly ? (
          <section id="fiqh-sec-scholarly" className="fiqh-lux-section">
            <h2>أقوال أهل العلم</h2>
            <p>{scholarly}</p>
          </section>
        ) : null}
        {practical ? (
          <section id="fiqh-sec-practical" className="fiqh-lux-section">
            <h2>الخلاصة</h2>
            <p>{practical}</p>
          </section>
        ) : null}
        {notes ? (
          <section id="fiqh-sec-notes" className="fiqh-lux-section">
            <h2>تنبيهات مهمة</h2>
            <p>{notes}</p>
          </section>
        ) : null}
        {mistakes.length ? (
          <section id="fiqh-sec-mistakes" className="fiqh-lux-section">
            <h2>أخطاء شائعة</h2>
            <ListBlock items={mistakes} />
          </section>
        ) : null}
        {examples.length ? (
          <section id="fiqh-sec-examples" className="fiqh-lux-section">
            <h2>أمثلة تطبيقية</h2>
            <ListBlock items={examples} />
          </section>
        ) : null}
        {reviewQs.length ? (
          <section id="fiqh-sec-review" className="fiqh-lux-section">
            <h2>أسئلة مراجعة</h2>
            <ListBlock items={reviewQs} />
          </section>
        ) : null}

        <div id="fiqh-sec-sources">
          <FiqhSourceLine sources={lesson.sources} />
        </div>
      </div>

      <FiqhReportError
        lessonTitle={lesson.title}
        lessonHref={hit.href}
        bookTitle={book.title}
      />

      <ShareButtons title={lesson.title} url={hit.href} />

      {related.length > 0 ? (
        <div id="fiqh-sec-related">
          <FiqhRelatedIssues issues={related} className="fiqh-related" />
        </div>
      ) : null}

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
    </DetailScreen>
  );
}
