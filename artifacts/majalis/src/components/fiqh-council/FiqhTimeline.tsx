import { FIQH_TIMELINE_EVENT_LABELS, fiqhItemHref, type FiqhTimelineEvent } from "@/lib/fiqh-council-types";
import { Link } from "wouter";

type Props = {
  events: FiqhTimelineEvent[];
  className?: string;
};

export function FiqhTimeline({ events, className = "" }: Props) {
  if (!events.length) return null;

  const sorted = [...events].sort((a, b) => {
    const da = a.event_date || "";
    const db = b.event_date || "";
    if (da !== db) return da.localeCompare(db);
    return (a.sort_order || 0) - (b.sort_order || 0);
  });

  return (
    <div className={`fiqh-timeline ${className}`.trim()} aria-label="الخط الزمني">
      {sorted.map((ev) => (
        <article key={ev.id} className="fiqh-timeline-event">
          <div className="fiqh-timeline-marker" aria-hidden />
          <div className="fiqh-timeline-body ui-card">
            <div className="fiqh-timeline-meta">
              {ev.event_date && <time dateTime={ev.event_date}>{ev.event_date}</time>}
              <span className="fiqh-timeline-type">{FIQH_TIMELINE_EVENT_LABELS[ev.event_type]}</span>
            </div>
            <h3 className="fiqh-timeline-title">{ev.title}</h3>
            {ev.description && <p className="fiqh-timeline-desc">{ev.description}</p>}
            {ev.item && (
              <Link href={fiqhItemHref(ev.item.slug)} className="fiqh-timeline-link">
                فتح المادة: {ev.item.title}
              </Link>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
