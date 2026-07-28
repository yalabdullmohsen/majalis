/**
 * حلقة تقدّم الورد + السلسلة وتقدير إتمام الختمة — للوحة مركز القرآن.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Flame, BookOpen } from "lucide-react";
import { toArabicDigits } from "@/lib/utils";
import {
  getWirdProgressSnapshot,
  scheduleWirdReminder,
} from "@/lib/wird-engine";

function toAr(n: number): string {
  return toArabicDigits(Math.round(n * 10) / 10);
}

export function WirdProgressWidget() {
  const [snap, setSnap] = useState(() => getWirdProgressSnapshot());

  useEffect(() => {
    scheduleWirdReminder();
    const id = window.setInterval(() => setSnap(getWirdProgressSnapshot()), 15_000);
    const onVis = () => {
      if (document.visibilityState === "visible") setSnap(getWirdProgressSnapshot());
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const r = 42;
  const circ = 2 * Math.PI * r;
  const pct = snap.pct;

  return (
    <section className="wpw-widget" aria-label="الورد اليومي">
      <div className="wpw-widget__ring-wrap">
        <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true">
          <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(20,63,53,.12)" strokeWidth="8" />
          <circle
            cx="56"
            cy="56"
            r={r}
            fill="none"
            stroke="var(--majalis-emerald, #143F35)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - Math.min(pct, 1))}
            transform="rotate(-90 56 56)"
            className="wpw-ring-fill"
          />
        </svg>
        <div className="wpw-widget__ring-label">
          <strong>{toAr(snap.displayDone)}</strong>
          <span>من {toAr(snap.displayTarget)} {snap.unitLabel}</span>
        </div>
      </div>

      <div className="wpw-widget__meta">
        <h2 className="wpw-widget__title">وردك اليوم</h2>
        <p className="wpw-widget__streak">
          <Flame size={14} aria-hidden="true" />
          {snap.streakLabel}
        </p>
        {snap.khatmahEtaDays != null && (
          <p className="wpw-widget__eta">
            <BookOpen size={14} aria-hidden="true" />
            تقدير إتمام الختمة: نحو {toArabicDigits(snap.khatmahEtaDays)} يومًا
          </p>
        )}
        <Link href="/daily-wird" className="wpw-widget__link">
          إدارة الورد والتذكيرات
        </Link>
      </div>
    </section>
  );
}

export default WirdProgressWidget;
