import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import { getUnifiedActiveLessons } from "@/lib/lessons-service";
import { T } from "@/lib/terminology";
import { sortKuwaitLessons, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";

function isCourse(lesson: KuwaitLessonRecord) {
  return lesson.isCourse || lesson.activityType === "دورة";
}

export function HomeUpcomingCourses() {
  const [courses, setCourses] = useState<KuwaitLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUnifiedActiveLessons()
      .then(({ lessons: items }) => {
        const safeItems = Array.isArray(items) ? items : [];
        setCourses(sortKuwaitLessons(safeItems.filter(isCourse)).slice(0, 4));
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && courses.length === 0) return null;

  return (
    <section className="home-section" aria-labelledby="upcoming-courses-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">برامج علمية</p>
          <h2 id="upcoming-courses-heading">{T.courses}</h2>
          <p>دورات علمية منظّمة مرتّبة حسب أقرب موعد.</p>
        </div>
        <Link href="/lessons?tab=courses" className="home-section-link">كل الدورات</Link>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="home-kuwait-grid lesson-unified-grid">
          {courses.map((lesson) => (
            <UnifiedLessonCard key={lesson.id} lesson={fromKuwaitLesson(lesson)} compact />
          ))}
        </div>
      )}
    </section>
  );
}

export default HomeUpcomingCourses;
