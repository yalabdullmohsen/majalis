import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
import { HomeLessonCard } from "@/components/home/HomeLessonCard";
import { getUnifiedActiveLessons } from "@/lib/lessons-service";
import { sortKuwaitLessons, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";

function isCourse(lesson: KuwaitLessonRecord) {
  return lesson.isCourse || lesson.activityType === "دورة";
}

function pickUpcomingLessons(items: KuwaitLessonRecord[]) {
  return sortKuwaitLessons(
    items.filter((lesson) => !isCourse(lesson) && lesson.activityType !== "دورة"),
  ).slice(0, 4);
}

export function HomeUpcomingLessons({
  initialLessons,
}: {
  initialLessons?: KuwaitLessonRecord[];
} = {}) {
  const [lessons, setLessons] = useState<KuwaitLessonRecord[]>(
    initialLessons ? pickUpcomingLessons(initialLessons) : [],
  );
  const [loading, setLoading] = useState(!initialLessons);

  useEffect(() => {
    if (initialLessons) return;
    getUnifiedActiveLessons()
      .then(({ lessons: items }) => {
        const safeItems = Array.isArray(items) ? items : [];
        setLessons(pickUpcomingLessons(safeItems));
      })
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }, [initialLessons]);

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
            <HomeLessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </section>
  );
}

export default HomeUpcomingLessons;
