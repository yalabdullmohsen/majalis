import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import { getUnifiedActiveLessons } from "@/lib/lessons-service";
import { type KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";

function isCourse(lesson: KuwaitLessonRecord) {
  return lesson.isCourse || lesson.activityType === "دورة";
}

function pickLatestLessons(items: KuwaitLessonRecord[]) {
  return [...items]
    .filter((lesson) => !isCourse(lesson))
    .sort((a, b) => b.nextOccurrenceMs - a.nextOccurrenceMs || a.title.localeCompare(b.title, "ar"))
    .slice(0, 4);
}

export function HomeLatestLessons({
  initialLessons,
}: {
  initialLessons?: KuwaitLessonRecord[];
} = {}) {
  const [lessons, setLessons] = useState<KuwaitLessonRecord[]>(
    initialLessons ? pickLatestLessons(initialLessons) : [],
  );
  const [loading, setLoading] = useState(!initialLessons);

  useEffect(() => {
    if (initialLessons) return;
    getUnifiedActiveLessons()
      .then(({ lessons: items }) => {
        const safeItems = Array.isArray(items) ? items : [];
        setLessons(pickLatestLessons(safeItems));
      })
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }, [initialLessons]);

  return (
    <section className="home-section" aria-labelledby="latest-lessons-heading">
      <div className="home-section-head">
        <div>
          <p className="home-section-kicker">محتوى حديث</p>
          <h2 id="latest-lessons-heading" className="home-section-title">أحدث الدروس</h2>
          <p className="home-section-subtitle">آخر الدروس المضافة والمتاحة على المنصة.</p>
        </div>
        <Link href="/lessons" className="home-section-link">كل الدروس</Link>
      </div>

      {loading ? (
        <Loading />
      ) : lessons.length === 0 ? (
        <p className="home-empty-state">لا توجد دروس متاحة حاليًا.</p>
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

export default HomeLatestLessons;
