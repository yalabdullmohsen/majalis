import { Link } from "wouter";
import { DEMO_CURRENT_LESSONS } from "@/lib/current-lessons";
import { CurrentLessonCard } from "./CurrentLessonCard";

export function CurrentLessonsSection() {
  const lessons = DEMO_CURRENT_LESSONS;

  return (
    <section className="cl-home-section" aria-labelledby="current-lessons-heading">
      <div className="cl-section-bar">
        <div>
          <p className="cl-section-bar__eyebrow">الدروس والدورات الحالية</p>
          <h2 id="current-lessons-heading">الدروس الحالية</h2>
          <p className="cl-section-bar__sub">
            إعلانات الدروس الأسبوعية في مساجد الكويت — محدّثة ومباشرة.
          </p>
        </div>
        <Link href="/lessons/current" className="cl-section-bar__link">
          عرض الكل
        </Link>
      </div>

      <div className="cl-home-grid">
        {lessons.map((lesson) => (
          <CurrentLessonCard key={lesson.id} lesson={lesson} compact showDetailsLink />
        ))}
      </div>

      <div className="cl-home-cta-row">
        <Link href="/lessons/current" className="cl-home-cta">
          جميع الدروس الحالية
        </Link>
        <Link href="/courses" className="cl-home-cta cl-home-cta--outline">
          الدورات الكاملة
        </Link>
      </div>
    </section>
  );
}
