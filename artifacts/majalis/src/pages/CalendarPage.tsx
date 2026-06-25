import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { arSA } from "date-fns/locale";
import { loadKuwaitLessons } from "@/lib/lessons-service";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { PageHeader, Loading } from "@/components/ui-common";

type ViewMode = "month" | "week" | "day";

type CalendarEvent = {
  id: string;
  title: string;
  sheikh: string;
  mosque: string;
  time: string;
  day: string;
  date?: string;
  recurring?: boolean;
  description?: string;
  href: string;
};

const DAY_MAP: Record<string, number> = {
  الأحد: 0,
  الاثنين: 1,
  الثلاثاء: 2,
  الأربعاء: 3,
  الخميس: 4,
  الجمعة: 5,
  السبت: 6,
};

function eventsFromLessons(lessons: KuwaitLessonRecord[]): CalendarEvent[] {
  return lessons.map((l) => ({
    id: l.id,
    title: l.title,
    sheikh: l.sheikhName,
    mosque: l.mosque,
    time: l.time,
    day: l.day,
    date: l.startDate || undefined,
    description: l.note,
    href: `/lessons/${l.id}`,
    recurring: l.recurring !== false && !l.startDate,
  }));
}

function eventsForDate(date: Date, events: CalendarEvent[]): CalendarEvent[] {
  const weekday = date.getDay();
  const dateStr = format(date, "yyyy-MM-dd");
  return events.filter((e) => {
    if (e.date && e.recurring === false) {
      return e.date === dateStr;
    }
    if (e.recurring !== false && e.day) {
      return DAY_MAP[e.day] === weekday;
    }
    return false;
  });
}

function EventModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  return (
    <div className="cal-modal-backdrop" onClick={onClose} role="presentation">
      <div className="cal-modal ui-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{event.title}</h3>
        <dl className="cal-modal-meta">
          <div><dt>الشيخ</dt><dd>{event.sheikh}</dd></div>
          <div><dt>المكان</dt><dd>{event.mosque}</dd></div>
          <div><dt>اليوم</dt><dd>{event.day}</dd></div>
          <div><dt>الوقت</dt><dd>{event.time}</dd></div>
        </dl>
        {event.description && <p className="cal-modal-desc">{event.description}</p>}
        <div className="cal-modal-actions">
          <Link href={event.href} className="ui-card-btn">التفاصيل</Link>
          <button type="button" className="ui-card-btn ui-card-btn--ghost" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalEvent, setModalEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    loadKuwaitLessons()
      .then((lessons) => setEvents(eventsFromLessons(lessons)))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 6 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 6 });
  const monthDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const weekStart = startOfWeek(selected, { weekStartsOn: 6 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(weekStart, { weekStartsOn: 6 }),
  });

  const selectedEvents = eventsForDate(selected, events);

  return (
    <div className="page-shell calendar-page">
      <PageHeader
        eyebrow="التقويم العلمي"
        title="تقويم الدروس"
        subtitle="عرض شهري وأسبوعي ويومي للدروس والدورات والمحاضرات."
      />

      <div className="cal-toolbar ui-card">
        <div className="cal-nav">
          <button type="button" className="cal-nav-btn" onClick={() => setCursor(subMonths(cursor, 1))} aria-label="الشهر السابق">‹</button>
          <strong>{format(cursor, "MMMM yyyy", { locale: arSA })}</strong>
          <button type="button" className="cal-nav-btn" onClick={() => setCursor(addMonths(cursor, 1))} aria-label="الشهر التالي">›</button>
        </div>
        <div className="cal-view-tabs">
          {(["month", "week", "day"] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              className={`cal-view-tab${view === v ? " is-active" : ""}`}
              onClick={() => setView(v)}
            >
              {v === "month" ? "شهري" : v === "week" ? "أسبوعي" : "يومي"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          {view === "month" && (
            <div className="cal-month ui-card">
              <div className="cal-weekdays">
                {["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="cal-grid">
                {monthDays.map((day) => {
                  const dayEvents = eventsForDate(day, events);
                  const isSelected = isSameDay(day, selected);
                  const inMonth = isSameMonth(day, cursor);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      className={`cal-cell${isSelected ? " is-selected" : ""}${!inMonth ? " is-outside" : ""}`}
                      onClick={() => {
                        setSelected(day);
                        setView("day");
                      }}
                    >
                      <span className="cal-cell-num">{format(day, "d")}</span>
                      {dayEvents.length > 0 && (
                        <span className="cal-cell-dot" aria-label={`${dayEvents.length} درس`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {view === "week" && (
            <div className="cal-week ui-card">
              {weekDays.map((day) => {
                const dayEvents = eventsForDate(day, events);
                return (
                  <div key={day.toISOString()} className="cal-week-col">
                    <button
                      type="button"
                      className={`cal-week-head${isSameDay(day, selected) ? " is-selected" : ""}`}
                      onClick={() => setSelected(day)}
                    >
                      {format(day, "EEEE d", { locale: arSA })}
                    </button>
                    <div className="cal-week-events">
                      {dayEvents.length === 0 ? (
                        <p className="cal-empty">لا دروس</p>
                      ) : (
                        dayEvents.map((ev) => (
                          <button key={ev.id} type="button" className="cal-event-chip" onClick={() => setModalEvent(ev)}>
                            {ev.title}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === "day" && (
            <div className="cal-day ui-card">
              <h3>{format(selected, "EEEE d MMMM yyyy", { locale: arSA })}</h3>
              {selectedEvents.length === 0 ? (
                <p className="cal-empty">لا توجد دروس في هذا اليوم.</p>
              ) : (
                <div className="cal-day-list">
                  {selectedEvents.map((ev) => (
                    <button key={ev.id} type="button" className="cal-day-item" onClick={() => setModalEvent(ev)}>
                      <strong>{ev.title}</strong>
                      <span>{ev.sheikh} · {ev.mosque}</span>
                      <span>{ev.time}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {modalEvent && <EventModal event={modalEvent} onClose={() => setModalEvent(null)} />}
    </div>
  );
}
