import { Link } from "wouter";
import { FEATURED_ANNOUNCEMENTS } from "@/lib/current-lessons";
import { CurrentLessonCard } from "./CurrentLessonCard";

export function CurrentLessonsSection() {
  const announcements = FEATURED_ANNOUNCEMENTS;

  return (
    <section className="la-home-section" aria-labelledby="lesson-announcements-heading">
      <div className="la-section-bar">
        <div>
          <p className="la-section-bar__eyebrow">إعلانات الدروس والدورات</p>
          <h2 id="lesson-announcements-heading">إعلانات الدروس</h2>
          <p className="la-section-bar__sub">
            إعلانات احترافية للدروس الشرعية في مساجد الكويت — جداول أسبوعية محدّثة.
          </p>
        </div>
        <Link href="/announcements" className="la-section-bar__link">
          عرض الكل
        </Link>
      </div>

      <div className="la-home-grid">
        {announcements.map((lesson) => (
          <CurrentLessonCard key={lesson.id} lesson={lesson} compact showDetailsLink />
        ))}
      </div>

      <div className="la-home-cta-row">
        <Link href="/announcements" className="la-home-cta">
          جميع إعلانات الدروس
        </Link>
        <Link href="/courses" className="la-home-cta la-home-cta--outline">
          الدورات الكاملة
        </Link>
      </div>
    </section>
  );
}
