import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { getMosqueById } from "@/lib/platform-api";

export default function MosqueDetailPage({ params }: { params: { id: string } }) {
  const [mosque, setMosque] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMosqueById(params.id).then(({ mosque: m, lessons: l }) => {
      setMosque(m);
      setLessons(l);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) return <Loading />;
  if (!mosque) return <Empty text="لم يُعثر على المسجد." />;

  return (
    <div className="page-shell page-shell--narrow">
      <Link href="/lessons-map" className="page-back-link">العودة إلى خريطة الدروس</Link>
      <PageHeader title={mosque.name} subtitle={`${mosque.governorate} — ${mosque.area || ""}`} />

      {mosque.address && <p className="page-note">{mosque.address}</p>}

      <div className="mosque-detail-actions">
        {mosque.google_maps_url && (
          <a href={mosque.google_maps_url} target="_blank" rel="noopener noreferrer" className="ui-card-btn">
            Google Maps
          </a>
        )}
      </div>

      <section className="home-section">
        <h2>الدروس الحالية</h2>
        <div className="calendar-lesson-list">
          {lessons.map((l) => (
            <article key={l.id} className="ui-card calendar-lesson-row">
              <div>
                <h3>{l.title}</h3>
                <p>{l.sheikh_name} — {l.day} {l.start_time}</p>
              </div>
              <Link href="/kuwait-lessons" className="ui-card-btn ui-card-btn--ghost">التفاصيل</Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
