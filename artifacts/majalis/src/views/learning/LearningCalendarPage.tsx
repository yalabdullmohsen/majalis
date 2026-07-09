import { useEffect, useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { PageHeader, SkeletonCardGrid } from "@/components/ui-common";
import { fetchLearningCalendar, subscribeLearningEvent } from "@/lib/digital-learning-service";
import { applyPageSeo } from "@/lib/seo";

type CalendarEvent = {
  id: string;
  title: string;
  event_type: string;
  starts_at: string;
  location?: string;
};

const TYPE_LABELS: Record<string, string> = {
  lesson: "درس",
  course: "دورة",
  lecture: "درس",
  conference: "مؤتمر",
  occasion: "مناسبة",
};

export default function LearningCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyPageSeo({
      path: "/learning/calendar",
      title: "تقويم الدروس والدورات | المجلس العلمي",
      description: "تقويم الأحداث والدروس والدورات الإسلامية القادمة — اشترك وتابع المواعيد العلمية.",
      keywords: ["تقويم دروس", "دورات إسلامية", "مواعيد علمية", "أحداث شرعية", "دورات قرآنية"],
    });
  }, []);

  useEffect(() => {
    fetchLearningCalendar()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (eventId: string) => {
    await subscribeLearningEvent(eventId);
  };

  if (loading) return <SkeletonCardGrid count={6} />;

  return (
    <div className="page-shell narrow">
      <PageHeader title="التقويم العلمي" subtitle="الدروس والدورات والمناسبات" />

      {events.length === 0 ? (
        <p className="lcd-empty">لا توجد أحداث قادمة حالياً — تابع لاحقاً.</p>
      ) : (
        <div className="lcd-grid">
          {events.map((ev) => (
            <article key={ev.id} className="lcd-event">
              <div>
                <span className="lcd-event__type">{TYPE_LABELS[ev.event_type] || ev.event_type}</span>
                <h3 className="lcd-event__title">{ev.title}</h3>
                <p className="lcd-event__date">
                  {format(new Date(ev.starts_at), "EEEE d MMMM yyyy", { locale: arSA })}
                  {ev.location && ` · ${ev.location}`}
                </p>
              </div>
              <button type="button" onClick={() => handleSubscribe(ev.id)} className="lcd-subscribe-btn">
                أضف للتقويم
              </button>
            </article>
          ))}
        </div>
      )}

      <p className="lcd-footer-link">
        <Link href="/calendar">تقويم الدروس الكامل</Link>
      </p>
    </div>
  );
}
