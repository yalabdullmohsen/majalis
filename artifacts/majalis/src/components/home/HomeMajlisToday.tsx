import { useEffect, useState } from "react";
import { Link } from "wouter";
import { BookOpen, Lightbulb, Star } from "lucide-react";
import { getDailyFaida } from "@/lib/daily-content";
import { getUnifiedActiveLessons } from "@/lib/lessons-service";
import { computeNextOccurrenceMs } from "@/lib/lesson-time";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { getSelectedGovernorate } from "@/lib/prayer-times";
import { RequestManager } from "@/lib/request-manager";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

function kuwaitDateStr(): string {
  return new Intl.DateTimeFormat("ar-KW", {
    timeZone: "Asia/Kuwait",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export function HomeMajlisToday() {
  const faida = getDailyFaida();
  const [nextLesson, setNextLesson] = useState<KuwaitLessonRecord | null>(null);
  const govId = getSelectedGovernorate().id;
  const { countdown } = usePrayerCountdown(govId);

  useEffect(() => {
    void RequestManager.run("home:majlis-today-lessons", () => getUnifiedActiveLessons())
      .then(({ lessons }) => {
        if (!Array.isArray(lessons) || lessons.length === 0) return;
        const now = new Date();
        const sorted = lessons
          .filter((l) => !l.isCourse && l.day && l.time)
          .map((l) => ({ lesson: l, nextMs: computeNextOccurrenceMs(l.day, l.time, now) }))
          .filter((x) => x.nextMs !== null)
          .sort((a, b) => a.nextMs - b.nextMs);
        if (sorted[0]) setNextLesson(sorted[0].lesson);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="myt-card" dir="rtl" aria-labelledby="myt-heading">

      {/* ── رأس البطاقة ── */}
      <div className="myt-header">
        <div className="myt-header__label">
          <Star size={13} strokeWidth={2.5} aria-hidden="true" />
          <span>مجلس اليوم</span>
        </div>
        <span className="myt-header__date">{kuwaitDateStr()}</span>
      </div>

      <div className="myt-body">

        {/* ── الفائدة اليومية ── */}
        <div className="myt-block myt-block--faida">
          <div className="myt-block__icon" aria-hidden="true">
            <Lightbulb size={18} strokeWidth={1.8} />
          </div>
          <div className="myt-block__content">
            <p className="myt-block__label">فائدة اليوم</p>
            <p className="myt-block__text">{faida.text}</p>
            {faida.source && (
              <p className="myt-block__source">— {faida.source}</p>
            )}
          </div>
          <Link href="/fawaid" className="myt-block__link" aria-label="المزيد من الفوائد">›</Link>
        </div>

        {/* ── الدرس القادم ── */}
        {nextLesson && (
          <div className="myt-block myt-block--lesson">
            <div className="myt-block__icon" aria-hidden="true">
              <BookOpen size={18} strokeWidth={1.8} />
            </div>
            <div className="myt-block__content">
              <p className="myt-block__label">أقرب درس</p>
              <p className="myt-block__text myt-block__text--lesson">{nextLesson.title}</p>
              {nextLesson.mosque && (
                <p className="myt-block__source">{nextLesson.mosque}</p>
              )}
            </div>
            <Link href="/lessons" className="myt-block__link" aria-label="جميع الدروس">›</Link>
          </div>
        )}

        {/* ── الصلاة القادمة ── */}
        {countdown?.next && (() => {
          // خلال فترة السماح (٣٠ دقيقة بعد الأذان) نعرض الصلاة الفعلية التالية
          // بدل الصلاة التي أذّنت للتو مع عدّاد 00:00:00 — نفس منطق PrayerTimesPage.
          const inGrace = countdown.sinceSeconds != null;
          const displayName = inGrace && countdown.graceNextSlot ? countdown.graceNextSlot.name : countdown.next.name;
          const displayTime = inGrace && countdown.graceNextSlot ? countdown.graceNextSlot.time : countdown.next.time;
          const displayHms = inGrace && countdown.graceNextHms ? countdown.graceNextHms : countdown.remainingHms;
          return (
            <div className="myt-block myt-block--prayer">
              <div className="myt-block__icon myt-block__icon--prayer" aria-hidden="true">
                <span className="myt-moon" aria-hidden="true">☽</span>
              </div>
              <div className="myt-block__content">
                <p className="myt-block__label">الصلاة القادمة</p>
                <p className="myt-block__text">
                  {displayName}
                  <span className="myt-prayer-time">{displayTime}</span>
                </p>
                <p className="myt-block__source">{displayHms}</p>
              </div>
              <Link href="/prayer-times" className="myt-block__link" aria-label="مواقيت الصلاة">›</Link>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
