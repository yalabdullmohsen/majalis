import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
import { getUnifiedActiveLessons } from "@/lib/lessons-service";
import { sortKuwaitLessons, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { T } from "@/lib/terminology";

export function HomeCalendarSection() {
  const [events, setEvents] = useState<KuwaitLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUnifiedActiveLessons()
      .then(({ lessons }) => {
        const safe = Array.isArray(lessons) ? lessons : [];
        setEvents(sortKuwaitLessons(safe).slice(0, 4));
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="home-section" aria-labelledby="home-calendar-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">جدول العلم</p>
          <h2 id="home-calendar-heading">{T.calendar}</h2>
          <p>مواعيد الدروس والدورات — عرض شهري وأسبوعي ويومي.</p>
        </div>
        <Link href="/calendar" className="home-section-link">فتح التقويم</Link>
      </div>

      {loading ? (
        <Loading />
      ) : events.length === 0 ? (
        <p className="lessons-empty-state">لا توجد مواعيد قريبة.</p>
      ) : (
        <div className="home-more-grid">
          {events.map((event) => (
            <Link key={event.id} href={`/lessons/${event.id}`} className="home-more-card ui-card">
              <span className="page-tag">{event.activityType === "دورة" ? "دورة" : "درس"}</span>
              <strong>{event.title}</strong>
              <span>{event.sheikhName}</span>
              <span className="home-daily-meta">
                {event.gregorianDate && <span>{event.gregorianDate}</span>}
                {!event.gregorianDate && event.day && <span>{event.day}</span>}
                {event.time && <span>{event.time}</span>}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default HomeCalendarSection;
