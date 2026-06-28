import { useMemo, useState } from "react";
import type { CalendarDay, DayRecord, PrayerKey } from "@/lib/prayer-tracker";
import { PRAYER_KEYS, PRAYER_LABELS, emptyDay } from "@/lib/prayer-tracker";

type Props = {
  calendarMonth: (year: number, month: number) => CalendarDay[];
  getDay: (date: string) => DayRecord | undefined;
};

const STATUS_CLASS: Record<CalendarDay["status"], string> = {
  full: "is-full",
  partial: "is-partial",
  missed: "is-missed",
  empty: "is-empty",
};

export function PrayerCalendar({ calendarMonth, getDay }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo(() => calendarMonth(year, month), [calendarMonth, year, month]);
  const selectedDay = selected ? getDay(selected) || emptyDay(selected) : null;

  const shift = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setSelected(null);
  };

  const monthLabel = new Intl.DateTimeFormat("ar-KW", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );

  const firstDow = new Date(year, month - 1, 1).getDay();
  const pad = (firstDow + 6) % 7;

  return (
    <section className="ui-card prayer-calendar">
      <header className="prayer-calendar__head">
        <button type="button" onClick={() => shift(-1)} aria-label="الشهر السابق">‹</button>
        <h3>{monthLabel}</h3>
        <button type="button" onClick={() => shift(1)} aria-label="الشهر التالي">›</button>
      </header>

      <div className="prayer-calendar__legend">
        <span><i className="dot is-full" /> جميع الصلوات</span>
        <span><i className="dot is-partial" /> ناقصة</span>
        <span><i className="dot is-missed" /> فاتت</span>
      </div>

      <div className="prayer-calendar__grid">
        {["س", "ح", "ن", "ث", "ر", "خ", "ج"].map((d) => (
          <span key={d} className="prayer-calendar__dow">{d}</span>
        ))}
        {Array.from({ length: pad }).map((_, i) => (
          <span key={`pad-${i}`} className="prayer-calendar__pad" />
        ))}
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            className={`prayer-calendar__day ${STATUS_CLASS[day.status]}${selected === day.date ? " is-selected" : ""}`}
            onClick={() => setSelected(day.date)}
          >
            {Number(day.date.slice(-2))}
          </button>
        ))}
      </div>

      {selectedDay && selected && (
        <div className="prayer-calendar__detail">
          <h4>{selected}</h4>
          <ul>
            {PRAYER_KEYS.map((key: PrayerKey) => {
              const s = selectedDay[key];
              const st = s?.status === "done" ? "✅" : s?.status === "missed" ? "❌" : "⏳";
              return (
                <li key={key}>
                  {st} {PRAYER_LABELS[key]}
                  {s?.status === "done" && (
                    <small>
                      {s.place === "mosque" ? " · مسجد" : " · بيت"}
                      {s.congregation ? " · جماعة" : ""}
                      {s.isFirstTime ? " · أول وقت" : ""}
                      {s.pointsEarned ? ` · +${s.pointsEarned}` : ""}
                    </small>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
