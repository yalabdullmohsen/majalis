import { useMemo } from "react";
import { Link } from "wouter";
import { PROGRESS_TASKS } from "@/lib/daily-progress";

const DAY_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAY_SHORT = ["أحد", "إث", "ثل", "أرب", "خم", "جم", "سب"];

function todayKey(offset = 0) {
  try {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuwait",
    }).format(d);
  } catch {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  }
}

function getDayOfWeek(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.getDay();
}

function readStore(): Record<string, Record<string, number>> {
  try {
    const raw = localStorage.getItem("majalis-daily-progress-v1");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function isDayComplete(store: Record<string, Record<string, number>>, key: string): boolean {
  const day = store[key];
  if (!day) return false;
  return PROGRESS_TASKS.every((t) => (day[t.id] || 0) >= t.target);
}

export function HomeWeekStreak() {
  const { days, streak } = useMemo(() => {
    const store = readStore();
    const list = Array.from({ length: 7 }, (_, i) => {
      const offset = 6 - i;
      const key = todayKey(offset);
      const dow = getDayOfWeek(offset);
      return {
        key,
        label: DAY_SHORT[dow],
        fullLabel: DAY_AR[dow],
        done: isDayComplete(store, key),
        isToday: offset === 0,
      };
    });

    let s = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].done) s++;
      else break;
    }
    return { days: list, streak: s };
  }, []);

  return (
    <section className="hws" aria-labelledby="hws-heading">
      <div className="hws__head">
        <div>
          <p className="home-eyebrow">الاتساق الأسبوعي</p>
          <h2 id="hws-heading" className="hws__title">
            سجل الأسبوع
            {streak > 0 && (
              <span className="hws__streak-badge" aria-label={`${streak} أيام متتالية`}>
                🔥 {streak}
              </span>
            )}
          </h2>
        </div>
        <Link href="/daily-wird" className="home-section-link">الورد</Link>
      </div>

      <div className="hws__grid">
        {days.map((d) => (
          <div
            key={d.key}
            className={`hws__day${d.done ? " hws__day--done" : ""}${d.isToday ? " hws__day--today" : ""}`}
            title={d.fullLabel}
            aria-label={`${d.fullLabel}: ${d.done ? "مكتمل" : "غير مكتمل"}`}
          >
            <div className="hws__circle">
              {d.done ? <span aria-hidden="true">✓</span> : null}
            </div>
            <span className="hws__label">{d.label}</span>
          </div>
        ))}
      </div>

      {streak === 0 && (
        <p className="hws__tip">أتمم وردك اليوم لتبدأ سلسلة التواصل</p>
      )}
      {streak >= 7 && (
        <p className="hws__tip hws__tip--congrats">أسبوع كامل من التواصل — بارك الله فيك!</p>
      )}
    </section>
  );
}

export default HomeWeekStreak;
