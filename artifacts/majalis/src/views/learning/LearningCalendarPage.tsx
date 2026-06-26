import { useEffect, useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { PageHeader, Loading } from "@/components/ui-common";
import { fetchLearningCalendar, subscribeLearningEvent } from "@/lib/digital-learning-service";

const TYPE_LABELS: Record<string, string> = {
  lesson: "درس",
  course: "دورة",
  lecture: "محاضرة",
  conference: "مؤتمر",
  occasion: "مناسبة",
};

export default function LearningCalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLearningCalendar()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (eventId: string) => {
    await subscribeLearningEvent(eventId);
  };

  if (loading) return <Loading />;

  return (
    <div className="page-shell narrow">
      <PageHeader title="التقويم العلمي" subtitle="الدروس والدورات والمحاضرات والمناسبات" />

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {events.map((ev) => (
          <article key={ev.id} style={{ padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>{TYPE_LABELS[ev.event_type] || ev.event_type}</span>
              <h3 style={{ fontWeight: 600, marginTop: "0.125rem" }}>{ev.title}</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)", marginTop: "0.25rem" }}>
                {format(new Date(ev.starts_at), "EEEE d MMMM yyyy", { locale: arSA })}
                {ev.location && ` · ${ev.location}`}
              </p>
            </div>
            <button type="button" onClick={() => handleSubscribe(ev.id)} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: "1px solid var(--emerald-deep)", background: "transparent", cursor: "pointer", fontSize: "0.8125rem", flexShrink: 0 }}>
              أضف للتقويم
            </button>
          </article>
        ))}
      </div>

      <p style={{ marginTop: "2rem", fontSize: "0.875rem" }}>
        <Link href="/calendar">تقويم الدروس الكامل</Link>
      </p>
    </div>
  );
}
