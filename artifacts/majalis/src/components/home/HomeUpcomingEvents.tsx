import { useEffect, useState } from "react";
import { CalendarDays, Megaphone } from "lucide-react";
import { getUpcomingEvents, getAnnouncements } from "@/lib/unified-content-service";
import type { AutoImportedContent } from "@/lib/auto-content/auto-content-utils";
import { Widget } from "@/components/widgets/Widget";

/** فعاليات ولقاءات + إعلانات علمية مهمة معتمَدة من المصادر الرسمية —
 * لا يوجد لهذين النوعين أي سطح عرض آخر في المنصة، لذا ودجت واحد جديد
 * يجمعهما (بدل ودجتين منفصلين لمحتوى نادر نسبيًا). */
export function HomeUpcomingEvents() {
  const [events, setEvents] = useState<AutoImportedContent[] | null>(null);
  const [announcements, setAnnouncements] = useState<AutoImportedContent[]>([]);

  useEffect(() => {
    let alive = true;
    Promise.all([getUpcomingEvents(4), getAnnouncements(3)]).then(([ev, ann]) => {
      if (!alive) return;
      setEvents(ev);
      setAnnouncements(ann);
    });
    return () => {
      alive = false;
    };
  }, []);

  const icon = (
    <span aria-hidden="true">
      <CalendarDays size={18} strokeWidth={1.8} color="#173D35" />
    </span>
  );

  const hasContent = (events?.length || 0) > 0 || announcements.length > 0;
  const state = events === null ? "loading" : hasContent ? "ready" : "empty";

  return (
    <Widget
      id="upcoming-events"
      className="hue"
      icon={icon}
      eyebrow="لقاءات ومستجدات"
      title="فعاليات وإعلانات علمية"
      state={state}
      emptyMessage="لا فعاليات أو إعلانات قادمة حاليًا."
    >
      {hasContent && (
        <div className="hue__list">
          {events?.map((item) => <EventRow key={item.id} item={item} />)}
          {announcements.map((item) => <AnnouncementRow key={item.id} item={item} />)}
        </div>
      )}
    </Widget>
  );
}

function sourceLabel(item: AutoImportedContent): string {
  return item.attribution_name || item.organization_name || item.source_name;
}

function EventRow({ item }: { item: AutoImportedContent }) {
  const dateLabel = item.event_start_at
    ? new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.event_start_at))
    : "الموعد قيد المراجعة";
  return (
    <article className="hue__row ui-card">
      <span className="hue__row-badge hue__row-badge--event">فعالية</span>
      <div className="hue__row-body">
        <p className="hue__row-title">{item.title}</p>
        <p className="hue__row-meta">{sourceLabel(item)} · {dateLabel}</p>
        <div className="hue__row-actions">
          {item.registration_url && (
            <a href={item.registration_url} target="_blank" rel="noopener noreferrer" className="hue__row-link hue__row-link--primary">
              التسجيل ←
            </a>
          )}
          {item.original_url && (
            <a href={item.original_url} target="_blank" rel="noopener noreferrer" className="hue__row-link">
              عرض المنشور الأصلي
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function AnnouncementRow({ item }: { item: AutoImportedContent }) {
  return (
    <article className="hue__row ui-card">
      <span className="hue__row-badge hue__row-badge--announcement">
        <Megaphone size={12} strokeWidth={2} aria-hidden="true" /> إعلان
      </span>
      <div className="hue__row-body">
        <p className="hue__row-title">{item.title}</p>
        <p className="hue__row-meta">{sourceLabel(item)}</p>
        {item.original_url && (
          <a href={item.original_url} target="_blank" rel="noopener noreferrer" className="hue__row-link">
            عرض المنشور الأصلي
          </a>
        )}
      </div>
    </article>
  );
}

export default HomeUpcomingEvents;
