import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
import { KuwaitLessonCard } from "@/components/kuwait/KuwaitLessonCard";
import { loadKuwaitLessons, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { computeUrgency } from "@/lib/lesson-urgency";

function sortByUrgency(lessons: KuwaitLessonRecord[]) {
  const order = { urgent: 0, soon: 1, week: 2, later: 3 };
  return [...lessons].sort((a, b) => {
    const ua = computeUrgency(a.day);
    const ub = computeUrgency(b.day);
    return order[ua.level] - order[ub.level] || a.sortKey - b.sortKey;
  });
}

export function HomeKuwaitLessons() {
  const [lessons, setLessons] = useState<KuwaitLessonRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKuwaitLessons()
      .then((items) => {
        const sorted = sortByUrgency(items);
        setTotal(sorted.length);
        setLessons(sorted.slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="home-section" aria-labelledby="kuwait-lessons-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">الدروس القادمة</p>
          <h2 id="kuwait-lessons-heading">دروس الكويت</h2>
          <p>مرتبة حسب أقرب موعد.</p>
        </div>
        <Link href="/kuwait-lessons" className="home-section-link">عرض الكل</Link>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          <p className="kuwait-lessons-count">{total} درس متاح</p>
          <div className="home-kuwait-grid">
            {lessons.map((lesson) => (
              <KuwaitLessonCard key={lesson.id} lesson={lesson} compact />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
