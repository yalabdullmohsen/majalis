import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { PageHeader, SkeletonCardGrid } from "@/components/ui-common";
import { PageShell } from "@/components/layout/PageShell";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import { applyPageSeo } from "@/lib/seo";
import { getUnifiedLessonsSplit } from "@/lib/lessons-service";
import {
  buildTeachersFromLessons,
  filterLessonsForTeacher,
  findTeacherBySlug,
} from "@/lib/teachers-index";
import { hrefTeachers } from "@/lib/content-href";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/pages/teachers.css";

export default function TeacherDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Awaited<ReturnType<typeof getUnifiedLessonsSplit>>["lessons"]>([]);

  const teachers = useMemo(() => buildTeachersFromLessons(lessons), [lessons]);
  const teacher = useMemo(() => findTeacherBySlug(teachers, slug), [teachers, slug]);
  const { active, archived } = useMemo(
    () => (teacher ? filterLessonsForTeacher(lessons, slug) : { active: [], archived: [] }),
    [teacher, lessons, slug],
  );

  useEffect(() => {
    getUnifiedLessonsSplit()
      .then(({ lessons: rows }) => setLessons(rows))
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!teacher) return;
    applyPageSeo({
      path: hrefTeachers(teacher.slug),
      title: `${teacher.name} — دروس الكويت | المجلس العلمي`,
      description: `دروس ${teacher.name} في الكويت — ${toArabicDigits(String(teacher.lessonCount))} درسًا من جدول الدروس المعتمدة.`,
    });
  }, [teacher]);

  if (loading) {
    return (
      <PageShell variant="narrow" className="tch-page">
        <PageHeader eyebrow="دروس الكويت" title="المشيخ" showBack />
        <SkeletonCardGrid count={4} />
      </PageShell>
    );
  }

  if (!teacher) {
    return (
      <PageShell variant="narrow" className="tch-page">
        <PageHeader eyebrow="دروس الكويت" title="المشيخ غير موجود" showBack />
        <p className="tch-empty">
          لم نجد مشيخًا بهذا المعرّف في دروس الكويت.
          {" "}
          <Link href="/teachers">العودة لفهرس المشايخ</Link>
          {" · "}
          <Link href="/tarikh-islami">التاريخ الإسلامي (علماء التراث)</Link></p>
      </PageShell>
    );
  }

  return (
    <PageShell variant="narrow" className="tch-page">
      <PageHeader
        eyebrow="مشايخ معاصرون من دروس الكويت"
        title={teacher.name}
        subtitle={`${toArabicDigits(String(teacher.lessonCount))} درسًا في الجدول — بيانات من مواعيد الدروس فقط.`}
        showBack
      />

      <p className="tch-notice">
        تراجم علماء التراث والأئمة في
        {" "}
        <Link href="/tarikh-islami">قسم التاريخ الإسلامي</Link>.
      </p>

      {active.length > 0 && (
        <section className="tch-section" aria-labelledby="tch-active-heading">
          <h2 id="tch-active-heading" className="tch-section__title">
            الدروس النشطة ({toArabicDigits(String(active.length))})
          </h2>
          <div className="page-card-grid lesson-unified-grid">
            {active.map((lesson) => (
              <UnifiedLessonCard key={lesson.id} lesson={fromKuwaitLesson(lesson)} compact />
            ))}
          </div>
        </section>
      )}

      {archived.length > 0 && (
        <section className="tch-section" aria-labelledby="tch-archived-heading">
          <h2 id="tch-archived-heading" className="tch-section__title">
            أرشيف الدروس ({toArabicDigits(String(archived.length))})
          </h2>
          <div className="page-card-grid lesson-unified-grid">
            {archived.map((lesson) => (
              <UnifiedLessonCard key={lesson.id} lesson={fromKuwaitLesson(lesson)} compact />
            ))}
          </div>
        </section>
      )}

      {active.length === 0 && archived.length === 0 && (
        <p className="tch-empty">لا توجد دروس مرتبطة بهذا المشيخ حاليًا.</p>
      )}
    </PageShell>
  );
}
