import { useEffect, useState } from "react";
import { Link } from "wouter";
import { BookOpen, CalendarClock, Lightbulb, Quote, Star } from "lucide-react";
import { getDailyFaida, getDailyHadith, getDayIndex } from "@/lib/daily-content";
import { getUnifiedActiveLessons } from "@/lib/lessons-service";
import { computeNextOccurrenceMs } from "@/lib/lesson-time";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { getSelectedGovernorate } from "@/lib/prayer-times";
import { RequestManager } from "@/lib/request-manager";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import {
  fetchWeekDayFacts, todayWeekDayCode, weekDayInfoTypeLabel,
  type WeekDayFact,
} from "@/lib/week-day-facts-service";

/* ══ مادة «مجلس اليوم» — فتحة واحدة فقط، لا تكرار ══
   الأولوية: مادة يوم الأسبوع (محتوى محرَّر من قاعدة البيانات) إن توفرت
   لليوم الحالي، وإلا فحديث/فائدة يتبادلان يوميًا بحسب زوجية اليوم —
   يوحّد ما كان مبعثرًا سابقًا في HomeNawawiHadith/HomeDailyCorner
   (2026-07-23، توحيد الأقسام اليومية). كل عنصر يعرض نوعه ومصدره دومًا. */
type TodayItem =
  | { kind: "weekday"; label: string; text: string; source: string }
  | { kind: "hadith"; text: string; source: string }
  | { kind: "faida"; text: string; source: string };

function pickTodayItem(weekDayFacts: WeekDayFact[] | null): TodayItem | null {
  if (weekDayFacts && weekDayFacts.length > 0) {
    const f = weekDayFacts[0];
    return { kind: "weekday", label: weekDayInfoTypeLabel(f.info_type), text: f.title, source: f.body };
  }
  const useHadith = getDayIndex() % 2 === 0;
  if (useHadith) {
    const h = getDailyHadith();
    const grade = h.grade ? ` — ${h.grade}` : "";
    return { kind: "hadith", text: h.text, source: `${h.narrator} — ${h.source}${grade}` };
  }
  const f = getDailyFaida();
  return { kind: "faida", text: f.text, source: f.source || f.category };
}

function kuwaitDateStr(): string {
  return new Intl.DateTimeFormat("ar-KW", {
    timeZone: "Asia/Kuwait",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export function HomeMajlisToday() {
  const [nextLesson, setNextLesson] = useState<KuwaitLessonRecord | null>(null);
  const govId = getSelectedGovernorate().id;
  const { countdown } = usePrayerCountdown(govId);
  const [weekDayFacts, setWeekDayFacts] = useState<WeekDayFact[] | null>(null);

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

  useEffect(() => {
    void fetchWeekDayFacts(todayWeekDayCode()).then(setWeekDayFacts).catch(() => setWeekDayFacts(null));
  }, []);

  const todayItem = pickTodayItem(weekDayFacts);
  const itemIcon = todayItem?.kind === "weekday" ? CalendarClock : todayItem?.kind === "hadith" ? Quote : Lightbulb;
  const itemLabel = todayItem?.kind === "weekday" ? todayItem.label
    : todayItem?.kind === "hadith" ? "حديث اليوم" : "فائدة اليوم";
  const itemLink = todayItem?.kind === "hadith" ? "/hadith" : "/fawaid";
  const ItemIcon = itemIcon;

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

        {/* ── مادة اليوم: فتحة واحدة فقط (مادة يوم الأسبوع، وإلا حديث/فائدة بالتناوب) ── */}
        {todayItem && (
          <div className="myt-block myt-block--faida">
            <div className="myt-block__icon" aria-hidden="true">
              <ItemIcon size={18} strokeWidth={1.8} />
            </div>
            <div className="myt-block__content">
              <p className="myt-block__label">{itemLabel}</p>
              <p className="myt-block__text">{todayItem.text}</p>
              <p className="myt-block__source">— {todayItem.source}</p>
            </div>
            <Link href={itemLink} className="myt-block__link" aria-label={`المزيد من ${itemLabel}`}>›</Link>
          </div>
        )}

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
