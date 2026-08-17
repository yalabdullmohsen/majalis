import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { hijriDayLabel, MAX_EVENTS_PER_CELL } from "@/lib/calendar-dates";
import type { CalendarEvent } from "@/lib/calendar-events";

export type CalendarDayCellProps = {
  date: Date;
  events: CalendarEvent[];
  inMonth?: boolean;
  isSelected?: boolean;
  isToday?: boolean;
  density: "month" | "week" | "day";
  onSelectDay: () => void;
  onEventClick: (ev: CalendarEvent) => void;
};

function EventList({
  events,
  onEventClick,
  interactive,
}: {
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  interactive: boolean;
}) {
  const shown = events.slice(0, MAX_EVENTS_PER_CELL);
  const extra = events.length - shown.length;

  if (interactive) {
    return (
      <div className="cal-cell-events">
        {shown.map((ev) => (
          <button key={ev.id} type="button" className="cal-event-chip" onClick={() => onEventClick(ev)}>
            <span className="cal-event-chip__title">{ev.title}</span>
          </button>
        ))}
        {extra > 0 ? <span className="cal-cell-more">+{extra}</span> : null}
      </div>
    );
  }

  return (
    <div className="cal-cell-events">
      {shown.map((ev) => (
        <span key={ev.id} className="cal-cell-event" title={ev.title}>
          {ev.title}
        </span>
      ))}
      {extra > 0 ? <span className="cal-cell-more">+{extra}</span> : null}
    </div>
  );
}

/**
 * خلية يوم — تدفّق عمودي فقط، بلا position:absolute.
 */
export function CalendarDayCell({
  date,
  events,
  inMonth = true,
  isSelected = false,
  isToday = false,
  density,
  onSelectDay,
  onEventClick,
}: CalendarDayCellProps) {
  const hDay = hijriDayLabel(date);
  const count = events.length;

  if (density === "day") {
    return (
      <section className="cal-day-panel" aria-label={format(date, "EEEE d MMMM yyyy", { locale: arSA })}>
        <header className="cal-day-panel__head">
          <h3>{format(date, "EEEE d MMMM yyyy", { locale: arSA })}</h3>
          {hDay ? <span className="cal-day-panel__hijri">{hDay} هـ</span> : null}
          {count > 0 ? (
            <span className="cal-cell-badge" aria-label={`${count} درس`}>
              {count}
            </span>
          ) : null}
        </header>
        {events.length === 0 ? (
          <p className="cal-empty">لا دروس في هذا اليوم.</p>
        ) : (
          <ul className="cal-day-panel__list">
            {events.map((ev) => (
              <li key={ev.id}>
                <button type="button" className="cal-day-item" onClick={() => onEventClick(ev)}>
                  <strong>{ev.title}</strong>
                  <span>{ev.sheikh} · {ev.mosque}</span>
                  <span>{ev.time}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (density === "week") {
    return (
      <div
        className={[
          "cal-cell cal-cell--week",
          isSelected ? "is-selected" : "",
          isToday ? "is-today" : "",
          count > 0 ? "has-events" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {count > 0 ? (
          <span className="cal-cell-badge cal-cell-badge--week" aria-label={`${count} درس`}>
            {count}
          </span>
        ) : null}
        {events.length === 0 ? (
          <p className="cal-empty cal-empty--inline">لا دروس</p>
        ) : (
          <EventList events={events} onEventClick={onEventClick} interactive />
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={[
        "cal-cell cal-cell--month",
        isSelected ? "is-selected" : "",
        isToday ? "is-today" : "",
        !inMonth ? "is-outside" : "",
        count > 0 ? "has-events" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onSelectDay}
      aria-label={`${format(date, "d MMMM", { locale: arSA })}${count > 0 ? `، ${count} درس` : ""}`}
    >
      <div className="cal-cell-head">
        <span className="cal-cell-num">{format(date, "d")}</span>
        {hDay ? <span className="cal-cell-hijri">{hDay}</span> : null}
        {count > 0 ? (
          <span className="cal-cell-badge" aria-hidden="true">
            {count}
          </span>
        ) : null}
      </div>
      <EventList events={events} onEventClick={onEventClick} interactive={false} />
    </button>
  );
}
