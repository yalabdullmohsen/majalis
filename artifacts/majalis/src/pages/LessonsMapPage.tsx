import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import { getMosquesWithLessons } from "@/lib/platform-api";

export default function LessonsMapPage() {
  const [mosques, setMosques] = useState<Awaited<ReturnType<typeof getMosquesWithLessons>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMosquesWithLessons().then(setMosques).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="الكويت"
        title="خريطة الدروس"
        subtitle="مساجد الدروس في الكويت — اضغط لفتح الموقع على الخريطة."
      />

      {loading && <Loading />}

      <div className="mosque-map-list">
        {mosques.map((m) => (
          <article key={m.id} className={`ui-card mosque-map-card${m.hasToday ? " mosque-map-card--today" : ""}`}>
            <div className="mosque-map-card-head">
              <h3>{m.name}</h3>
              {m.hasToday && <span className="home-tag">درس اليوم</span>}
            </div>
            <p>{m.governorate} — {m.area}</p>
            <p className="mosque-lesson-count">{m.lessons.length} درس</p>

            {m.lessons.slice(0, 2).map((l) => (
              <div key={l.id} className="mosque-lesson-preview">
                <strong>{l.title}</strong>
                <span>{l.sheikh_name} — {l.start_time || l.day}</span>
              </div>
            ))}

            <div className="mosque-map-actions">
              {m.google_maps_url && (
                <a href={m.google_maps_url} target="_blank" rel="noopener noreferrer" className="ui-card-btn">
                  فتح Google Maps
                </a>
              )}
              <Link href={`/mosques/${m.id}`} className="ui-card-btn ui-card-btn--ghost">تفاصيل المسجد</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
