import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import { loadKuwaitLessons } from "@/lib/lessons-service";
import { sortKuwaitLessons, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";

function isCourse(lesson: KuwaitLessonRecord) {
  return lesson.isCourse || lesson.activityType === "دورة";
}

export function HomeUpcomingLessons() {
  const [lessons, setLessons] = useState<KuwaitLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKuwaitLessons()
      .then((items) =>
        setLessons(
          sortKuwaitLessons(items.filter((l) => !isCourse(l) && l.activityType !== "محاضرة")).slice(0, 4),
        ),
      )
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="home-section" aria-labelledby="upcoming-lessons-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">جدول الأسبوع</p>
          <h2 id="upcoming-lessons-heading">الدروس القادمة</h2>
          <p>دروس علمية مرتّبة حسب أقرب موعد.</p>
        </div>
        <div className="home-section-head-links">
          <Link href="/calendar" className="home-section-link">التقويم</Link>
          <Link href="/lessons?tab=lessons" className="home-section-link">كل الدروس</Link>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : lessons.length === 0 ? (
        <p className="lessons-empty-state">لا توجد دروس متاحة حاليًا.</p>
      ) : (
        <div className="home-kuwait-grid lesson-unified-grid">
          {lessons.map((lesson) => (
            <UnifiedLessonCard key={lesson.id} lesson={fromKuwaitLesson(lesson)} compact />
          ))}
        </div>
      )}
    </section>
  );
}

export default HomeUpcomingLessons;
