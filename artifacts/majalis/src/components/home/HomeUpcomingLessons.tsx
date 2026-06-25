import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
import { KuwaitLessonCard } from "@/components/kuwait/KuwaitLessonCard";
import { loadKuwaitLessons, sortKuwaitLessons, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";

export function HomeUpcomingLessons() {
  const [lessons, setLessons] = useState<KuwaitLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKuwaitLessons()
      .then((items) => setLessons(sortKuwaitLessons(items).slice(0, 4)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="home-section" aria-labelledby="upcoming-lessons-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">جدول الأسبوع</p>
          <h2 id="upcoming-lessons-heading">الدروس القادمة</h2>
          <p>دروس علمية في مساجد الكويت — مرتّبة حسب أقرب موعد.</p>
        </div>
        <div className="home-section-head-links">
          <Link href="/calendar" className="home-section-link">التقويم</Link>
          <Link href="/kuwait-lessons" className="home-section-link">كل الدروس</Link>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="home-kuwait-grid">
          {lessons.map((lesson) => (
            <KuwaitLessonCard key={lesson.id} lesson={lesson} compact />
          ))}
        </div>
      )}
    </section>
  );
}

export default HomeUpcomingLessons;
