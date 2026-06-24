import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
import { KuwaitLessonCard } from "@/components/kuwait/KuwaitLessonCard";
import { loadKuwaitLessons, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";

export function HomeKuwaitLessons() {
  const [lessons, setLessons] = useState<KuwaitLessonRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKuwaitLessons()
      .then((items) => {
        setTotal(items.length);
        setLessons(items.slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="home-section" aria-labelledby="kuwait-lessons-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">الكويت</p>
          <h2 id="kuwait-lessons-heading">دروس الكويت</h2>
          <p>دروس علمية محدّثة في مساجد الكويت.</p>
        </div>
        <Link href="/kuwait-lessons" className="home-section-link">عرض الكل</Link>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          <p className="kuwait-lessons-count">{total} درس متاح في الكويت</p>
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
