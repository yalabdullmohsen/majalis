import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { AlertTriangle, BookMarked, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader, SkeletonCardGrid } from "@/components/ui-common";
import { fetchLessonDetail, type LessonDetail } from "@/lib/learn-library-service";
import { supabase } from "@/lib/supabase";
import { applyPageSeo } from "@/lib/seo";

const SECTION_LABEL: Record<string, string> = {
  objectives: "الموضوعات",
  prerequisites: "متطلبات سابقة",
  body: "ملخص الدرس",
  evidence: "الأدلة",
  terms: "شرح المصطلحات",
  examples: "أمثلة وفوائد",
  common_mistakes: "أخطاء شائعة",
  summary: "خلاصة",
  review_questions: "أسئلة مراجعة",
  timeline_events: "الأحداث الرئيسية",
};

type SeriesNav = { seriesSlug: string; seriesTitle: string; prev: { id: string; title: string } | null; next: { id: string; title: string } | null };

export default function LearnLessonPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<LessonDetail | null>(null);
  const [seriesNav, setSeriesNav] = useState<SeriesNav | null>(null);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchLessonDetail(id).then(setDetail).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!detail) return;
    applyPageSeo({
      path: `/learn/lesson/${detail.lesson.id}`,
      title: `${detail.lesson.title} | المجلس العلمي`,
      description: detail.lesson.description || detail.lesson.title,
    });

    (async () => {
      const { data: link } = await supabase
        .from("series_lessons")
        .select("series_id, sort_order, lesson_series(slug, title)")
        .eq("lesson_id", detail.lesson.id)
        .maybeSingle();
      if (!link) return;
      const { data: siblings } = await supabase
        .from("series_lessons")
        .select("sort_order, lessons(id, title)")
        .eq("series_id", (link as any).series_id)
        .order("sort_order");
      const list = (siblings ?? []) as any[];
      const idx = list.findIndex((s) => s.lessons?.id === detail.lesson.id);
      setSeriesNav({
        seriesSlug: (link as any).lesson_series?.slug ?? "",
        seriesTitle: (link as any).lesson_series?.title ?? "",
        prev: idx > 0 ? { id: list[idx - 1].lessons.id, title: list[idx - 1].lessons.title } : null,
        next: idx >= 0 && idx < list.length - 1 ? { id: list[idx + 1].lessons.id, title: list[idx + 1].lessons.title } : null,
      });
    })();
  }, [detail]);

  const submitReport = async () => {
    const message = window.prompt("صف المشكلة (خطأ علمي، رابط معطل، أو غير ذلك):");
    if (!message?.trim()) return;
    setReporting(true);
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("error_reports").insert({
      content_table: "lessons",
      content_id: id,
      reporter_id: auth?.user?.id ?? null,
      report_type: "other",
      message: message.trim(),
    });
    setReporting(false);
    setReportSent(true);
  };

  if (loading) return <div className="page-shell"><SkeletonCardGrid count={4} /></div>;

  if (!detail) {
    return (
      <div className="page-shell lrn-cat">
        <p className="lrn-empty">هذا الدرس غير متاح حاليًا.</p>
        <Link href="/learn" className="lrn-back-link">← العودة لأبواب العلم</Link>
      </div>
    );
  }

  const { lesson, sections, citations } = detail;

  return (
    <div className="page-shell lrn-lesson">
      {lesson.category && (
        <nav className="lrn-breadcrumb" aria-label="مسار التصفح">
          <Link href="/learn">أبواب العلم</Link>
          <span><ChevronLeft size={13} aria-hidden="true" /><Link href={`/learn/${lesson.category.slug}`}>{lesson.category.name}</Link></span>
        </nav>
      )}

      <PageHeader eyebrow={seriesNav?.seriesTitle} title={lesson.title} subtitle={lesson.description ?? undefined} />

      {sections
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((s) => (
          <section key={s.id} className="lrn-lesson-section">
            <h2 className="lrn-section-title">{s.title || SECTION_LABEL[s.section_type] || s.section_type}</h2>
            <p className="lrn-lesson-section__content">{s.content}</p>
          </section>
        ))}

      {citations.length > 0 && (
        <section className="lrn-lesson-section">
          <h2 className="lrn-section-title"><BookMarked size={16} /> المصادر والمراجع</h2>
          <ul className="lrn-citations-list">
            {citations.map((c) => (
              <li key={c.id}>{c.citation}{c.url && <> — <a href={c.url} target="_blank" rel="noopener noreferrer">رابط</a></>}</li>
            ))}
          </ul>
        </section>
      )}

      {seriesNav && (seriesNav.prev || seriesNav.next) && (
        <nav className="lrn-lesson-nav" aria-label="التنقل بين دروس السلسلة">
          {seriesNav.prev ? (
            <Link href={`/learn/lesson/${seriesNav.prev.id}`} className="lrn-lesson-nav__btn">
              <ChevronRight size={14} /> {seriesNav.prev.title}
            </Link>
          ) : <span />}
          {seriesNav.next && (
            <Link href={`/learn/lesson/${seriesNav.next.id}`} className="lrn-lesson-nav__btn lrn-lesson-nav__btn--next">
              {seriesNav.next.title} <ChevronLeft size={14} />
            </Link>
          )}
        </nav>
      )}

      <div className="lrn-lesson-report">
        {reportSent ? (
          <p className="lrn-lesson-report__sent">تم إرسال بلاغك، شكرًا لك — سيراجعه فريق المحتوى.</p>
        ) : (
          <button type="button" className="lrn-lesson-report__btn" onClick={submitReport} disabled={reporting}>
            <AlertTriangle size={13} /> {reporting ? "جارٍ الإرسال…" : "الإبلاغ عن خطأ في هذا الدرس"}
          </button>
        )}
      </div>
    </div>
  );
}
