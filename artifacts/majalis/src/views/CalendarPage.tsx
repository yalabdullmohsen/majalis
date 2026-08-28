import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Download } from "lucide-react";
import { ShareButtons } from "@/components/ContentActions";
import "@/styles/pages/calendar.css";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { arSA } from "date-fns/locale";
import { getUnifiedActiveLessons } from "@/lib/lessons-service";
import { PageHeader, ErrorState } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { CalendarDayCell } from "@/components/calendar/CalendarDayCell";
import {
  buildMonthGrid,
  buildWeekDays,
  CALENDAR_WEEKDAY_LABELS,
  hijriMonthYearLabel,
} from "@/lib/calendar-dates";
import {
  eventsForDate,
  eventsFromLessons,
  type CalendarEvent,
} from "@/lib/calendar-events";

type ViewMode = "month" | "week" | "day";

function EventModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.classList.add("filter-sheet-open");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.classList.remove("filter-sheet-open");
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="cal-modal-backdrop" onClick={onClose} role="presentation">
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="cal-modal ui-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cal-modal-title"
      >
        <h3 id="cal-modal-title">{event.title}</h3>
        <dl className="cal-modal-meta">
          <div><dt>الشيخ</dt><dd>{event.sheikh}</dd></div>
          <div><dt>المكان</dt><dd>{event.mosque}</dd></div>
          <div><dt>اليوم</dt><dd>{event.day}</dd></div>
          <div><dt>الوقت</dt><dd>{event.time}</dd></div>
        </dl>
        {event.description ? <p className="cal-modal-desc">{event.description}</p> : null}
        <div className="cal-modal-actions">
          <Link href={event.href} className="ui-card-btn">التفاصيل</Link>
          <button type="button" className="ui-card-btn ui-card-btn--ghost" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}

function toIcsDate(date: Date, time?: string): string {
  const d = format(date, "yyyyMMdd");
  if (!time) return `${d}T060000`;
  const [hh, mm] = time.replace(/[^\d:]/g, "").split(":").map(Number);
  const h = String(hh || 6).padStart(2, "0");
  const m = String(mm || 0).padStart(2, "0");
  return `${d}T${h}${m}00`;
}

function generateIcs(monthEvents: { date: Date; ev: CalendarEvent }[], monthLabel: string): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//majlisilm.com//Islamic Lessons Calendar//AR",
    `X-WR-CALNAME:دروس سُنّة — ${monthLabel}`,
    "X-WR-TIMEZONE:Asia/Kuwait",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const { date, ev } of monthEvents) {
    const dtstart = toIcsDate(date, ev.time);
    const dtend = toIcsDate(date, ev.time ? ev.time.replace(/\d+/, (h) => String(Number(h) + 1)) : undefined);
    const uid = `${ev.id}-${format(date, "yyyyMMdd")}@majlisilm.com`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss")}`,
      `DTSTART;TZID=Asia/Kuwait:${dtstart}`,
      `DTEND;TZID=Asia/Kuwait:${dtend}`,
      `SUMMARY:${ev.title}`,
      `DESCRIPTION:${[ev.sheikh, ev.mosque, ev.description].filter(Boolean).join(" | ")}`,
      `LOCATION:${ev.mosque || ""}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadIcs(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CalendarGridSkeleton() {
  return (
    <div className="cal-month ui-card" aria-busy="true" aria-label="جاري تحميل التقويم">
      <div className="cal-weekdays">
        {CALENDAR_WEEKDAY_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="cal-grid cal-grid--skeleton">
        {Array.from({ length: 42 }, (_, i) => (
          <div key={i} className="cal-cell cal-cell--month cal-cell--skeleton" />
        ))}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const today = new Date();
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(today);
  const [selected, setSelected] = useState(today);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [modalEvent, setModalEvent] = useState<CalendarEvent | null>(null);

  function handleIcsExport() {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const monthEvents: { date: Date; ev: CalendarEvent }[] = [];
    for (const day of days) {
      for (const ev of eventsForDate(day, events)) {
        monthEvents.push({ date: day, ev });
      }
    }
    const label = format(cursor, "yyyy-MM");
    downloadIcs(generateIcs(monthEvents, format(cursor, "MMMM yyyy", { locale: arSA })), `majalis-${label}.ics`);
  }

  useEffect(() => {
    applyPageSeo({
      path: "/calendar",
      title: "التقويم الإسلامي والدروس | سُنّة",
      description: "تقويم الدروس والمناسبات الإسلامية، عرض شهري وأسبوعي ويومي مع الأحداث والحلقات العلمية.",
      keywords: ["تقويم إسلامي", "مواعيد دروس", "التقويم الهجري", "الأحداث الإسلامية", "جدول الدروس"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "التقويم الإسلامي والدروس", url: "https://majlisilm.com/calendar", about: { "@type": "Thing", name: "التقويم الهجري والمناسبات الإسلامية" } }],
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    getUnifiedActiveLessons()
      .then(({ lessons }) => setEvents(eventsFromLessons(lessons)))
      .catch(() => {
        setEvents([]);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [retryTick]);

  const monthDays = buildMonthGrid(cursor);
  const weekDays = buildWeekDays(selected);
  const isViewingCurrentMonth = isSameMonth(cursor, today);
  const hijriLabel = hijriMonthYearLabel(cursor);
  const monthHasEvents = eachDayOfInterval({ start: startOfMonth(cursor), end: endOfMonth(cursor) }).some(
    (d) => eventsForDate(d, events).length > 0,
  );

  function goToday() {
    setCursor(today);
    setSelected(today);
  }

  return (
    <div className="page-shell calendar-page">
      <PageHeader
        eyebrow="المناسبات والدروس"
        title="تقويم الدروس"
        subtitle="عرض شهري وأسبوعي ويومي للدروس والدورات."
      />

      <div className="cal-toolbar ui-card">
        <div className="cal-nav">
          <button type="button" className="cal-nav-btn" onClick={() => setCursor(subMonths(cursor, 1))} aria-label="الشهر السابق">‹</button>
          <div className="cal-nav-label">
            <strong>{format(cursor, "MMMM yyyy", { locale: arSA })}</strong>
            {hijriLabel ? <span className="cal-nav-hijri">{hijriLabel}</span> : null}
          </div>
          <button type="button" className="cal-nav-btn" onClick={() => setCursor(addMonths(cursor, 1))} aria-label="الشهر التالي">›</button>
          {!isViewingCurrentMonth ? (
            <button type="button" className="cal-today-btn" onClick={goToday} aria-label="انتقل لليوم">
              اليوم
            </button>
          ) : null}
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
        <button
          type="button"
          className="cal-ics-btn"
          onClick={handleIcsExport}
          aria-label="تحميل دروس الشهر كملف تقويم"
        >
          <Download size={16} aria-hidden="true" />
          <span>ICS</span>
        </button>
      </div>

      {loading ? (
        <CalendarGridSkeleton />
      ) : loadError ? (
        <ErrorState text="تعذّر تحميل مواعيد الدروس. يرجى المحاولة مرة أخرى." onRetry={() => setRetryTick((n) => n + 1)} />
      ) : (
        <>
          {view === "month" && (
            <div className="cal-month ui-card">
              {!monthHasEvents ? (
                <p className="cal-empty cal-empty--banner">لا دروس في هذا الشهر.</p>
              ) : null}
              <div className="cal-weekdays">
                {CALENDAR_WEEKDAY_LABELS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="cal-grid">
                {monthDays.map((day) => {
                  const dayEvents = eventsForDate(day, events);
                  return (
                    <CalendarDayCell
                      key={day.toISOString()}
                      date={day}
                      events={dayEvents}
                      density="month"
                      inMonth={isSameMonth(day, cursor)}
                      isSelected={isSameDay(day, selected)}
                      isToday={isSameDay(day, today)}
                      onSelectDay={() => {
                        setSelected(day);
                        setView("day");
                      }}
                      onEventClick={setModalEvent}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {view === "week" && (
            <div className="cal-week ui-card">
              <div className="cal-week-grid">
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="cal-week-col">
                    <button
                      type="button"
                      className={`cal-week-head${isSameDay(day, selected) ? " is-selected" : ""}${isSameDay(day, today) ? " is-today" : ""}`}
                      onClick={() => setSelected(day)}
                    >
                      {format(day, "EEE d", { locale: arSA })}
                    </button>
                    <CalendarDayCell
                      date={day}
                      events={eventsForDate(day, events)}
                      density="week"
                      isSelected={isSameDay(day, selected)}
                      isToday={isSameDay(day, today)}
                      onSelectDay={() => setSelected(day)}
                      onEventClick={setModalEvent}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === "day" && (
            <div className="cal-day ui-card">
              <CalendarDayCell
                date={selected}
                events={eventsForDate(selected, events)}
                density="day"
                isToday={isSameDay(selected, today)}
                onSelectDay={() => {}}
                onEventClick={setModalEvent}
              />
            </div>
          )}
        </>
      )}

      {modalEvent ? <EventModal event={modalEvent} onClose={() => setModalEvent(null)} /> : null}

      <div className="twh-share">
        <ShareButtons aria-label="التقويم الهجري والمناسبات الإسلامية — سُنّة" url="https://majlisilm.com/calendar" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz sectionId="islamic-history" aria-label="اختبر معلوماتك في التاريخ الإسلامي" count={4} />
      </div>
    </div>
  );
}
